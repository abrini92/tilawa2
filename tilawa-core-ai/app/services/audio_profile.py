from __future__ import annotations

from typing import Any, Dict, Tuple

import numpy as np

from app.utils.audio_io import load_audio_from_bytes
from app.utils.logging import get_logger


logger = get_logger(__name__)


def compute_basic_audio_profile(samples: np.ndarray, sample_rate: int) -> Dict[str, float]:
    """Compute a basic audio profile for a voice/Qur'an recitation.

    Metrics:
    - rms: root mean square level
    - brightness_hz: spectral centroid (rough brightness measure)
    - low_band_energy: relative energy in ~125–500 Hz (warmth/body)
    - high_band_energy: relative energy in ~2–6 kHz (presence/clarity)
    - sibilance_index: relative energy in ~4–8 kHz
    - dynamic_range_db: 90th - 10th percentile of level in dB
    """
    profile: Dict[str, float] = {
        "rms": 0.0,
        "brightness_hz": 0.0,
        "low_band_energy": 0.0,
        "high_band_energy": 0.0,
        "sibilance_index": 0.0,
        "dynamic_range_db": 0.0,
    }

    if samples is None or samples.size == 0 or sample_rate <= 0:
        return profile

    # Ensure mono 1D
    x = samples
    if x.ndim > 1:
        x = np.mean(x, axis=1)
    x = x.astype("float32")

    # Use at most ~10 seconds for analysis to keep it efficient
    sr = int(sample_rate)
    max_len = sr * 10
    if x.size > max_len:
        x = x[:max_len]

    if x.size == 0:
        return profile

    # RMS
    rms = float(np.sqrt(float(np.mean(x**2))) if x.size else 0.0)
    profile["rms"] = rms

    # FFT-based spectral features
    try:
        N = int(x.size)
        window = np.hanning(N).astype("float32")
        x_win = x * window

        spectrum = np.fft.rfft(x_win)
        mag = np.abs(spectrum)
        freqs = np.fft.rfftfreq(N, d=1.0 / float(sr))

        total_energy = float(np.sum(mag))
        if total_energy <= 0.0:
            total_energy = 1e-12

        # Spectral centroid (brightness)
        brightness = float(np.sum(freqs * mag) / total_energy)
        profile["brightness_hz"] = brightness

        # Band energies as relative ratios
        def band_ratio(f_low: float, f_high: float) -> float:
            mask = (freqs >= f_low) & (freqs <= f_high)
            if not np.any(mask):
                return 0.0
            band_energy = float(np.sum(mag[mask]))
            return max(0.0, min(1.0, band_energy / total_energy))

        profile["low_band_energy"] = band_ratio(125.0, 500.0)
        profile["high_band_energy"] = band_ratio(2000.0, 6000.0)
        profile["sibilance_index"] = band_ratio(4000.0, 8000.0)

    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error while computing spectral profile", exc_info=exc)

    # Dynamic range estimate (based on amplitude envelope in dB)
    try:
        eps = 1e-8
        env = np.abs(x) + eps
        env_db = 20.0 * np.log10(env)
        p90 = float(np.percentile(env_db, 90))
        p10 = float(np.percentile(env_db, 10))
        dyn_range = max(0.0, p90 - p10)
        profile["dynamic_range_db"] = dyn_range
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error while computing dynamic range", exc_info=exc)

    return profile


def build_audio_profile_from_bytes(raw_bytes: bytes) -> Dict[str, float]:
    """High-level helper to build an audio profile from raw bytes."""
    samples, sr = load_audio_from_bytes(raw_bytes)
    if samples is None or samples.size == 0 or sr <= 0:
        logger.warning("Empty or invalid audio when building audio profile")
        return {}

    profile = compute_basic_audio_profile(samples, sr)
    logger.info("Audio profile computed", extra={"profile": profile})
    return profile
