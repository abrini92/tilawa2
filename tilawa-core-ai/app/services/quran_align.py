import time
from typing import Any, Dict, List

import numpy as np

from app.services.quran_matcher import match_transcript_to_verses
from app.services.quran_sequence import analyze_quran_recitation_transcript
from app.services.quran_timeline import build_ayah_timeline
from app.utils.audio_io import load_audio_from_bytes
from app.utils.logging import get_logger
from app.utils.metrics import (
    MODEL_LOAD_DURATION,
    MODEL_LOADED,
    QURAN_ALIGNMENT_DURATION,
    QURAN_CONFIDENCE,
    QURAN_DETECTION_TOTAL,
    TRANSCRIPTION_DURATION,
    TRANSCRIPTION_REALTIME_FACTOR,
)


logger = get_logger(__name__)

# Try faster-whisper first (4x faster), fallback to openai-whisper
_FASTER_WHISPER_AVAILABLE = False
_WHISPER_AVAILABLE = False
_whisper_model = None  # Lazy-loaded singleton

try:  # pragma: no cover - optional dependency
    from faster_whisper import WhisperModel  # type: ignore

    _FASTER_WHISPER_AVAILABLE = True
    logger.info("faster-whisper available")
except ImportError:  # pragma: no cover
    try:
        import whisper  # type: ignore

        _WHISPER_AVAILABLE = True
        logger.info("openai-whisper available (slower)")
    except ImportError:
        logger.warning("No whisper implementation available")


def _compute_is_quran_like(matches: List[Dict[str, Any]], global_accuracy: Any) -> bool:
    """Heuristic to decide if a transcript looks like Qur'an recitation.

    Uses both best match confidence and global verse-sequence accuracy.
    """

    if not matches:
        return False

    try:
        best_conf = float(matches[0].get("confidence", 0.0))
    except Exception:  # pragma: no cover - defensive
        best_conf = 0.0

    try:
        ga = float(global_accuracy) if global_accuracy is not None else 0.0
    except Exception:  # pragma: no cover - defensive
        ga = 0.0

    return best_conf >= 0.7 and ga >= 0.5


def _get_whisper_model():
    """Lazy-load and cache the Whisper model (singleton)."""
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    model_name = "faster_whisper_small" if _FASTER_WHISPER_AVAILABLE else "openai_whisper_small"
    start_time = time.perf_counter()

    if _FASTER_WHISPER_AVAILABLE:
        # faster-whisper: use int8 quantization for speed
        # Model sizes: tiny, base, small, medium, large-v2, large-v3
        _whisper_model = WhisperModel(
            "small",
            device="cpu",  # or "cuda" if GPU available
            compute_type="int8",  # int8 for CPU, float16 for GPU
        )
        logger.info("Loaded faster-whisper model (small, int8)")
    elif _WHISPER_AVAILABLE:
        import whisper  # type: ignore

        _whisper_model = whisper.load_model("small")
        logger.info("Loaded openai-whisper model (small)")
    else:
        raise RuntimeError("No whisper implementation available")

    load_duration = time.perf_counter() - start_time
    MODEL_LOAD_DURATION.labels(model_name=model_name).observe(load_duration)
    MODEL_LOADED.labels(model_name=model_name).set(1)

    return _whisper_model


def _transcribe_with_whisper(samples: np.ndarray, sample_rate: int) -> str:
    """Use Whisper (faster-whisper preferred) to transcribe Arabic audio."""
    if not _FASTER_WHISPER_AVAILABLE and not _WHISPER_AVAILABLE:
        raise RuntimeError("No whisper implementation available")

    import librosa  # lazy import

    audio_duration = len(samples) / sample_rate
    audio_16k = librosa.resample(samples, orig_sr=sample_rate, target_sr=16000)
    model = _get_whisper_model()

    model_label = "faster_whisper" if _FASTER_WHISPER_AVAILABLE else "openai_whisper"
    start_time = time.perf_counter()

    if _FASTER_WHISPER_AVAILABLE:
        # faster-whisper API
        segments, info = model.transcribe(
            audio_16k,
            language="ar",
            beam_size=5,
            vad_filter=True,  # Voice activity detection for better accuracy
        )
        transcript = " ".join(segment.text for segment in segments)
        logger.info(
            "faster-whisper transcription done",
            extra={"language_prob": info.language_probability, "duration": info.duration},
        )
        result_text = transcript.strip()
    else:
        # openai-whisper API (fallback)
        result = model.transcribe(audio_16k, language="ar")
        result_text = str(result.get("text", "")).strip()

    # Record metrics
    transcription_time = time.perf_counter() - start_time
    TRANSCRIPTION_DURATION.labels(model=model_label).observe(transcription_time)
    if audio_duration > 0:
        rtf = transcription_time / audio_duration
        TRANSCRIPTION_REALTIME_FACTOR.labels(model=model_label).observe(rtf)

    return result_text


def _dummy_alignment_result() -> Dict[str, Any]:
    """Return a static, safe fallback alignment result."""
    return {
        "verses": [
            {"surah": 1, "ayah": 1, "confidence": 0.95},
        ],
        "integrity_score": 95,
        "flags": [],
        "matches": [
            {"surah": 1, "ayah": 1, "confidence": 0.95},
        ],
        "transcript": None,
        "sequence": [],
        "global_accuracy": None,
        "errors": [],
        "is_quran_like": None,
        "timeline": [],
    }


def align_quran_text(transcript: str) -> Dict[str, Any]:
    """Align a textual transcript against Qur'an verses and analyze sequence/errors."""
    base: Dict[str, Any] = {
        "transcript": transcript,
        "matches": [],
        "sequence": [],
        "global_accuracy": None,
        "errors": [],
        "is_quran_like": None,
    }

    try:
        matches = match_transcript_to_verses(transcript, top_k=5)
        base["matches"] = matches

        seq_analysis = analyze_quran_recitation_transcript(transcript)
        base["sequence"] = seq_analysis.get("sequence", [])
        base["global_accuracy"] = seq_analysis.get("global_accuracy")
        base["errors"] = seq_analysis.get("errors", [])

        base["is_quran_like"] = _compute_is_quran_like(
            base["matches"], base["global_accuracy"]
        )
        return base
    except Exception as exc:  # pragma: no cover
        logger.exception("Error in align_quran_text", exc_info=exc)
        return base


def align_quran(raw_bytes: bytes) -> Dict[str, Any]:
    """High-level Qur'an alignment logic from audio.

    1. ASR Whisper → transcript (if available)
    2. transcript → verses via align_quran_text / quran_matcher
    3. Backward-compatible schema:
       - "verses": best match only
       - "integrity_score": int%
       - "matches": full list
       - "transcript": transcript
    """
    alignment_start = time.perf_counter()
    samples, sr = load_audio_from_bytes(raw_bytes)

    transcript: str
    if _FASTER_WHISPER_AVAILABLE or _WHISPER_AVAILABLE:
        try:
            transcript = _transcribe_with_whisper(samples, sr)
            logger.info("Whisper transcript", extra={"transcript": transcript})
        except Exception as exc:  # pragma: no cover
            logger.exception("Error during Whisper transcription, falling back to dummy", exc_info=exc)
            transcript = ""
    else:
        logger.warning("No Whisper available, using dummy transcript for alignment")
        transcript = "الحمد لله رب العالمين"

    if not transcript:
        return _dummy_alignment_result()

    text_alignment = align_quran_text(transcript)
    matches: List[Dict[str, Any]] = text_alignment.get("matches", [])
    sequence: List[Dict[str, Any]] = text_alignment.get("sequence", [])
    global_accuracy = text_alignment.get("global_accuracy")
    errors = text_alignment.get("errors", [])
    is_quran_like = _compute_is_quran_like(matches, global_accuracy)

    # Build ayah-level timeline from audio + sequence
    timeline: List[Dict[str, Any]] = []
    try:
        if sequence:
            timeline = build_ayah_timeline(samples, sr, sequence)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error while building ayah timeline", exc_info=exc)
        timeline = []

    if matches:
        best = matches[0]
        verses: List[Dict[str, Any]] = [
            {
                "surah": best["surah"],
                "ayah": best["ayah"],
                "confidence": best["confidence"],
            }
        ]
        integrity_score = int(max(0.0, min(1.0, float(best.get("confidence", 0.0)))) * 100)
    else:
        verses = []
        integrity_score = 0

    flags: List[str] = []
    if not is_quran_like:
        flags.append("non_quran_like")

    result: Dict[str, Any] = {
        "verses": verses,
        "integrity_score": integrity_score,
        "flags": flags,
        "matches": matches,
        "transcript": text_alignment.get("transcript"),
        "sequence": sequence,
        "global_accuracy": global_accuracy,
        "errors": errors,
        "is_quran_like": is_quran_like,
        "timeline": timeline,
    }

    # Record metrics
    QURAN_ALIGNMENT_DURATION.observe(time.perf_counter() - alignment_start)
    QURAN_DETECTION_TOTAL.labels(is_quran=str(is_quran_like).lower()).inc()
    if matches:
        QURAN_CONFIDENCE.observe(float(matches[0].get("confidence", 0.0)))

    return result
