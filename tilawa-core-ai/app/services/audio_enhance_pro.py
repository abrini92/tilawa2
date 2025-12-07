from __future__ import annotations

from io import BytesIO
from typing import Tuple

import librosa
import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

from app.utils.audio_io import load_audio_from_bytes
from app.utils.logging import get_logger


logger = get_logger(__name__)


def _prepare_audio_for_studio(
    samples: np.ndarray, sample_rate: int, target_sr: int = 48000
) -> Tuple[np.ndarray, int]:
    """Ensure mono float32 audio and optionally resample to target_sr.

    - Mix down multi-channel audio to mono.
    - Resample to target_sr for more consistent processing.
    - Return float32 samples in [-1, 1].
    """
    if samples.size == 0 or sample_rate <= 0:
        return samples.astype("float32"), int(sample_rate)

    # Mix to mono if needed: shape (n_samples, n_channels) -> (n_samples,)
    if samples.ndim > 1:
        samples = np.mean(samples, axis=1)

    samples = samples.astype("float32")

    sr = int(sample_rate)
    if sr != target_sr:
        try:
            samples = librosa.resample(samples, orig_sr=sr, target_sr=target_sr)
            sr = int(target_sr)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Resampling failed in _prepare_audio_for_studio", exc_info=exc)

    # Hard clip to safe range
    samples = np.clip(samples, -1.0, 1.0).astype("float32")
    return samples, sr


def _butter_filter(
    cutoff_low: float | None,
    cutoff_high: float | None,
    sample_rate: int,
    btype: str,
    order: int = 2,
) -> Tuple[np.ndarray, np.ndarray] | tuple[None, None]:
    """Helper to build a Butterworth filter safely."""
    if sample_rate <= 0:
        return None, None

    nyq = 0.5 * float(sample_rate)
    if nyq <= 0:
        return None, None

    if btype in {"high", "low"}:
        freq = cutoff_low if btype == "high" else cutoff_high
        if freq is None or freq <= 0 or freq >= nyq:
            return None, None
        normal = float(freq) / nyq
        b, a = butter(order, normal, btype=btype, analog=False)
        return b, a

    if btype == "band":
        if cutoff_low is None or cutoff_high is None:
            return None, None
        low = float(cutoff_low) / nyq
        high = float(cutoff_high) / nyq
        if not (0.0 < low < high < 1.0):
            return None, None
        b, a = butter(order, [low, high], btype="band", analog=False)
        return b, a

    return None, None


def _apply_simple_voice_eq(
    samples: np.ndarray,
    sample_rate: int,
    eq_low_gain_db: float = -2.0,
    eq_high_gain_db: float = 2.0,
) -> np.ndarray:
    """Apply a conservative EQ tailored for spoken/Qur'an voice.

    Steps:
    - High-pass at ~80 Hz to remove rumble.
    - Low-shelf gain (eq_low_gain_db) around ~250 Hz.
    - High-shelf gain (eq_high_gain_db) around ~4 kHz.
    """
    if samples.size == 0 or sample_rate <= 0:
        return samples

    x = samples.astype("float32")

    try:
        # 1) High-pass at 80 Hz
        b_hp, a_hp = _butter_filter(80.0, None, sample_rate, btype="high", order=2)
        if b_hp is not None:
            x = lfilter(b_hp, a_hp, x)

        # 2) Low-shelf gain around 250 Hz (approx via low-pass split)
        b_lp, a_lp = _butter_filter(None, 250.0, sample_rate, btype="low", order=2)
        if b_lp is not None:
            low = lfilter(b_lp, a_lp, x)
            high = x - low
            low_gain = 10.0 ** (float(eq_low_gain_db) / 20.0)
            x = low_gain * low + high

        # 3) High-shelf gain around 4 kHz (approx via high-pass split)
        b_hs, a_hs = _butter_filter(4000.0, None, sample_rate, btype="high", order=2)
        if b_hs is not None:
            high_band = lfilter(b_hs, a_hs, x)
            low_band = x - high_band
            high_gain = 10.0 ** (float(eq_high_gain_db) / 20.0)
            x = low_band + high_gain * high_band

        x = np.clip(x, -1.0, 1.0).astype("float32")
        return x
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in _apply_simple_voice_eq", exc_info=exc)
        return samples


def _apply_simple_deesser(
    samples: np.ndarray,
    sample_rate: int,
    strength: float = 0.8,
) -> np.ndarray:
    """Very simple de-esser focusing on ~4–8 kHz band.

    - Extract sibilant band via band-pass.
    - Compute envelope.
    - Gently attenuate when envelope exceeds a threshold.

    The `strength` parameter controls the gain applied where sibilance is
    detected (1.0 = no attenuation, lower = stronger de-essing).
    """
    if samples.size == 0 or sample_rate <= 0:
        return samples

    x = samples.astype("float32")

    try:
        b_band, a_band = _butter_filter(4000.0, 8000.0, sample_rate, btype="band", order=2)
        if b_band is None:
            return x

        band = lfilter(b_band, a_band, x)
        env = np.abs(band)
        if env.size == 0:
            return x

        # Threshold based on high percentile of envelope
        thr = float(np.percentile(env, 95))
        if thr <= 0.0:
            return x

        gain = np.ones_like(x, dtype="float32")
        mask = env > thr
        # Gentle attenuation where sibilant energy is strong
        s = float(max(0.0, min(1.0, strength)))
        gain[mask] = s

        y = x * gain
        y = np.clip(y, -1.0, 1.0).astype("float32")
        return y
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in _apply_simple_deesser", exc_info=exc)
        return samples


def _apply_simple_compressor(
    samples: np.ndarray,
    threshold_db: float = -18.0,
    ratio: float = 2.0,
    makeup_gain_db: float = 2.0,
) -> np.ndarray:
    """Simple static compressor in the amplitude domain.

    - Convert to dBFS.
    - Compress above threshold with given ratio.
    - Apply small makeup gain.
    """
    if samples.size == 0:
        return samples

    x = samples.astype("float32")
    eps = 1e-8

    try:
        mag = np.abs(x) + eps
        db = 20.0 * np.log10(mag)

        over = db - threshold_db
        compressed_db = threshold_db + over / ratio
        db_new = np.where(db > threshold_db, compressed_db, db)
        db_new = db_new + makeup_gain_db

        mag_new = 10.0 ** (db_new / 20.0)
        sign = np.sign(x)
        y = sign * mag_new
        y = np.clip(y, -1.0, 1.0).astype("float32")
        return y
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in _apply_simple_compressor", exc_info=exc)
        return samples


def _apply_simple_limiter(samples: np.ndarray, ceiling: float = 0.98) -> np.ndarray:
    """Hard limiter to avoid clipping by constraining to [-ceiling, ceiling]."""
    if samples.size == 0:
        return samples
    return np.clip(samples.astype("float32"), -float(ceiling), float(ceiling))


def enhance_audio_pro_to_wav_bytes(raw_bytes: bytes) -> bytes:
    """Tilawa Studio Pro chain.

    Pipeline:
    - Load audio from bytes.
    - Prepare (mono, target SR).
    - Normalize RMS to a target.
    - Apply EQ, de-esser, compressor, limiter.
    - Export to 16-bit PCM WAV.
    """
    logger.info("Starting Tilawa Studio Pro enhancement")

    samples, sr = load_audio_from_bytes(raw_bytes)
    if samples.size == 0 or sr <= 0:
        logger.warning("Empty or invalid audio in enhance_audio_pro_to_wav_bytes")
        buffer = BytesIO()
        sf.write(buffer, np.zeros(1, dtype="float32"), 16000, format="WAV", subtype="PCM_16")
        buffer.seek(0)
        return buffer.getvalue()

    # Prepare audio (mono + resample)
    samples, sr = _prepare_audio_for_studio(samples, sr)

    # Initial RMS
    rms_before = float(np.sqrt(float(np.mean(samples**2))) if samples.size else 0.0)

    # RMS normalization
    target_rms = 0.1
    if rms_before > 1e-6:
        gain = target_rms / rms_before
        samples = samples * float(gain)

    try:
        # Studio processing chain
        processed = _apply_simple_voice_eq(samples, sr)
        processed = _apply_simple_deesser(processed, sr)
        processed = _apply_simple_compressor(processed)
        processed = _apply_simple_limiter(processed)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in Studio Pro chain, falling back to normalized only", exc_info=exc)
        processed = samples

    # Final RMS measurement
    rms_after = float(np.sqrt(float(np.mean(processed**2))) if processed.size else 0.0)

    logger.info(
        "Tilawa Studio Pro enhancement done",
        extra={
            "sample_rate": sr,
            "rms_before": rms_before,
            "rms_after": rms_after,
            "target_rms": target_rms,
        },
    )

    processed = np.clip(processed.astype("float32"), -1.0, 1.0)

    buffer = BytesIO()
    sf.write(buffer, processed, sr, format="WAV", subtype="PCM_16")
    buffer.seek(0)
    return buffer.getvalue()
