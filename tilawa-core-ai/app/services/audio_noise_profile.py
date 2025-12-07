from __future__ import annotations

from typing import Any, Dict, Tuple

import numpy as np

from app.utils.audio_io import load_audio_from_bytes
from app.utils.logging import get_logger


logger = get_logger(__name__)


def _compute_band_levels(mag: np.ndarray, freqs: np.ndarray) -> Dict[str, float]:
    """Compute relative energy for low/mid/high bands.

    Bands (Hz):
      - low: 0–250
      - mid: 250–2000
      - high: 2000–8000
    """
    if mag.size == 0 or freqs.size == 0:
        return {"low": 0.0, "mid": 0.0, "high": 0.0}

    total_energy = float(np.sum(mag)) + 1e-12

    def band_ratio(f_low: float, f_high: float) -> float:
        mask = (freqs >= f_low) & (freqs < f_high)
        if not np.any(mask):
            return 0.0
        band_energy = float(np.sum(mag[mask]))
        return max(0.0, min(1.0, band_energy / total_energy))

    low = band_ratio(0.0, 250.0)
    mid = band_ratio(250.0, 2000.0)
    high = band_ratio(2000.0, 8000.0)

    return {"low": low, "mid": mid, "high": high}


def compute_noise_profile_from_samples(samples: np.ndarray, sample_rate: int) -> Dict[str, float]:
    """Compute a simple noise profile from a 'silence' recording (room noise).

    Returns:
      - noise_rms
      - low_band
      - mid_band
      - high_band
    """
    profile: Dict[str, float] = {
        "noise_rms": 0.0,
        "low_band": 0.0,
        "mid_band": 0.0,
        "high_band": 0.0,
    }

    try:
        if samples is None or samples.size == 0 or sample_rate <= 0:
            return profile

        x = samples
        if x.ndim > 1:
            x = np.mean(x, axis=1)
        x = x.astype("float32")

        noise_rms = float(np.sqrt(float(np.mean(x**2))) if x.size else 0.0)
        profile["noise_rms"] = noise_rms

        # Use at most 5 seconds for spectral estimate
        sr = int(sample_rate)
        max_len = sr * 5
        if x.size > max_len:
            x = x[:max_len]

        if x.size == 0:
            return profile

        N = int(x.size)
        window = np.hanning(N).astype("float32")
        seg = x * window
        spectrum = np.fft.rfft(seg)
        mag = np.abs(spectrum)
        freqs = np.fft.rfftfreq(N, d=1.0 / float(sr))

        bands = _compute_band_levels(mag, freqs)
        profile["low_band"] = float(bands.get("low", 0.0))
        profile["mid_band"] = float(bands.get("mid", 0.0))
        profile["high_band"] = float(bands.get("high", 0.0))

    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error computing noise profile from samples", exc_info=exc)

    return profile


def build_noise_profile_from_bytes(raw_bytes: bytes) -> Dict[str, float]:
    """High-level helper to build a noise profile from raw bytes."""
    samples, sr = load_audio_from_bytes(raw_bytes)
    if samples is None or samples.size == 0 or sr <= 0:
        logger.warning("Empty or invalid audio for noise profile")
        return {}

    profile = compute_noise_profile_from_samples(samples, sr)
    logger.info("Noise profile computed", extra={"noise_profile": profile})
    return profile
