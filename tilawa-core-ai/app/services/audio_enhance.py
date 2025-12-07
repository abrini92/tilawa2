from typing import Dict

from io import BytesIO

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

from app.utils.audio_io import (
    load_audio_from_bytes,
    get_duration_seconds,
    compute_rms,
    compute_peak,
    estimate_snr_db,
)
from app.utils.logging import get_logger


logger = get_logger(__name__)


def normalize_audio(samples: np.ndarray, target_rms: float = 0.1) -> np.ndarray:
    """Simple loudness normalization based on RMS."""
    current_rms = compute_rms(samples)
    if current_rms < 1e-6:
        return samples

    gain = target_rms / current_rms
    normalized = samples * gain
    normalized = np.clip(normalized, -1.0, 1.0)
    return normalized


def detect_clipping(samples: np.ndarray, threshold: float = 0.999) -> float:
    """Return proportion of samples that are clipped near |1.0|."""
    if samples.size == 0:
        return 0.0
    clipped = np.sum(np.abs(samples) >= threshold)
    return float(clipped / samples.size)


def enhance_audio(raw_bytes: bytes) -> Dict[str, object]:
    """Core audio enhancement + metrics.

    - Load
    - RMS normalization
    - Compute metrics (duration, rms, peak, snr, clipping)
    Currently we only return metrics, not enhanced audio.
    """
    logger.info("Starting audio enhancement pipeline")

    samples, sr = load_audio_from_bytes(raw_bytes)

    duration_sec = get_duration_seconds(samples, sr)
    rms_before = compute_rms(samples)
    peak_before = compute_peak(samples)
    snr_before = estimate_snr_db(samples)

    enhanced = normalize_audio(samples)
    rms_after = compute_rms(enhanced)
    peak_after = compute_peak(enhanced)
    snr_after = estimate_snr_db(enhanced)
    clipping_ratio = detect_clipping(enhanced)

    logger.info(
        "Audio enhancement done",
        extra={
            "duration_sec": duration_sec,
            "rms_before": rms_before,
            "rms_after": rms_after,
            "snr_before": snr_before,
            "snr_after": snr_after,
            "clipping_ratio": clipping_ratio,
        },
    )

    metrics: Dict[str, object] = {
        "sample_rate": sr,
        "duration_sec": duration_sec,
        "rms_before": rms_before,
        "rms_after": rms_after,
        "peak_before": peak_before,
        "peak_after": peak_after,
        "snr_before_db": snr_before,
        "snr_after_db": snr_after,
        "clipping_ratio": clipping_ratio,
    }

    return metrics


def _apply_highpass_filter(samples: np.ndarray, sample_rate: int, cutoff: float = 80.0) -> np.ndarray:
    """Apply a simple high-pass filter to remove very low-frequency rumble.

    Uses a 2nd-order Butterworth high-pass around the given cutoff.
    """
    if samples.size == 0 or sample_rate <= 0:
        return samples.astype("float32")

    nyq = 0.5 * float(sample_rate)
    normal_cutoff = cutoff / nyq if nyq > 0 else 0.0
    if normal_cutoff <= 0.0 or normal_cutoff >= 1.0:
        return samples.astype("float32")

    b, a = butter(2, normal_cutoff, btype="high", analog=False)
    filtered = lfilter(b, a, samples)
    return filtered.astype("float32")


def enhance_audio_to_wav_bytes(raw_bytes: bytes) -> bytes:
    """Enhance audio and return a 16-bit PCM WAV as bytes.

    Pipeline:
    - load audio from bytes
    - RMS-based normalization
    - light high-pass filtering to remove very low rumble
    - export to in-memory WAV (PCM_16)
    """
    logger.info("Starting audio enhancement to WAV bytes")

    samples, sr = load_audio_from_bytes(raw_bytes)

    duration_sec = get_duration_seconds(samples, sr)
    rms_before = compute_rms(samples)

    normalized = normalize_audio(samples)
    filtered = _apply_highpass_filter(normalized, sr, cutoff=80.0)

    rms_after = compute_rms(filtered)

    logger.info(
        "Audio enhancement-to-file done",
        extra={
            "duration_sec": duration_sec,
            "sample_rate": sr,
            "rms_before": rms_before,
            "rms_after": rms_after,
            "highpass_cutoff_hz": 80.0,
        },
    )

    # Ensure float32 in [-1, 1] before writing
    float_samples = np.clip(filtered.astype("float32"), -1.0, 1.0)

    buffer = BytesIO()
    sf.write(buffer, float_samples, sr, format="WAV", subtype="PCM_16")
    buffer.seek(0)
    return buffer.getvalue()
