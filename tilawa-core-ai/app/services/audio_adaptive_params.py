from __future__ import annotations

from typing import Dict

from app.utils.logging import get_logger


logger = get_logger(__name__)


def compute_adaptive_chain_params(profile: Dict[str, float]) -> Dict[str, float]:
    """Map an audio profile to processing parameters for the studio chain.

    Expected profile keys:
      - rms
      - brightness_hz
      - low_band_energy
      - high_band_energy
      - sibilance_index
      - dynamic_range_db

    Returns parameters such as:
      - eq_low_gain_db
      - eq_high_gain_db
      - deesser_strength
      - compressor_threshold_db
      - makeup_gain_db
      - target_rms
    """
    rms = float(profile.get("rms", 0.11) or 0.11)
    brightness = float(profile.get("brightness_hz", 2500.0) or 2500.0)
    low_band = float(profile.get("low_band_energy", 0.0) or 0.0)
    high_band = float(profile.get("high_band_energy", 0.0) or 0.0)
    sibilance = float(profile.get("sibilance_index", 0.0) or 0.0)
    dyn_range = float(profile.get("dynamic_range_db", 15.0) or 15.0)

    # Clamp some values to reasonable ranges
    sibilance = max(0.0, min(1.0, sibilance))

    # High-frequency EQ gain (presence / brightness)
    # Target brightness ~2.2–2.8 kHz.
    if brightness < 2000.0:
        eq_high_gain_db = 3.0
    elif brightness < 2200.0:
        eq_high_gain_db = 2.0
    elif brightness > 3200.0:
        eq_high_gain_db = -2.0
    elif brightness > 2800.0:
        eq_high_gain_db = -1.0
    else:
        eq_high_gain_db = 0.0

    # Low-frequency EQ gain (warmth/body)
    # low_band is a ratio [0, 1] of energy in 125–500 Hz.
    if low_band > 0.4:
        eq_low_gain_db = -2.0
    elif low_band > 0.25:
        eq_low_gain_db = -1.0
    elif low_band < 0.1:
        eq_low_gain_db = 2.0
    elif low_band < 0.2:
        eq_low_gain_db = 1.0
    else:
        eq_low_gain_db = 0.0

    # De-esser strength based on sibilance index
    if sibilance > 0.7:
        deesser_strength = 0.8
    elif sibilance >= 0.4:
        deesser_strength = 0.5
    else:
        deesser_strength = 0.3

    # Compressor settings from dynamic range
    if dyn_range > 20.0:
        compressor_threshold_db = -20.0
        makeup_gain_db = 3.0
    elif dyn_range < 10.0:
        compressor_threshold_db = -14.0
        makeup_gain_db = 1.0
    else:
        compressor_threshold_db = -18.0
        makeup_gain_db = 2.0

    # Target RMS loudness
    if rms < 0.07:
        target_rms = 0.13
    elif rms > 0.15:
        target_rms = 0.10
    else:
        target_rms = 0.11

    params: Dict[str, float] = {
        "eq_low_gain_db": eq_low_gain_db,
        "eq_high_gain_db": eq_high_gain_db,
        "deesser_strength": deesser_strength,
        "compressor_threshold_db": compressor_threshold_db,
        "makeup_gain_db": makeup_gain_db,
        "target_rms": target_rms,
    }

    logger.info("Adaptive chain params computed", extra={"params": params, "profile": profile})
    return params
