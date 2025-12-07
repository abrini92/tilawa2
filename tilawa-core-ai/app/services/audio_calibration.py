from __future__ import annotations

from typing import Any, Dict, List

import numpy as np

from app.services.audio_adaptive_params import compute_adaptive_chain_params
from app.services.audio_noise_profile import build_noise_profile_from_bytes
from app.services.audio_profile import build_audio_profile_from_bytes
from app.utils.logging import get_logger


logger = get_logger(__name__)


def aggregate_voice_profiles(profiles: List[Dict[str, float]]) -> Dict[str, float]:
    """Average multiple voice profiles (rms, brightness_hz, etc.).

    Only average keys present in all profiles and with numeric values.
    """
    if not profiles:
        return {}

    # Intersection of keys across all profiles
    common_keys = set(profiles[0].keys())
    for p in profiles[1:]:
        common_keys &= set(p.keys())

    aggregated: Dict[str, float] = {}
    for key in common_keys:
        values: List[float] = []
        for p in profiles:
            try:
                v = float(p.get(key))
            except (TypeError, ValueError):  # pragma: no cover - defensive
                values = []
                break
            values.append(v)
        if not values:
            continue
        aggregated[key] = float(np.mean(values))

    return aggregated


def calibrate_from_samples(
    recitation_files: List[bytes],
    noise_file: bytes | None = None,
) -> Dict[str, Any]:
    """Calibrate a user profile based on recitation + optional noise samples."""
    voice_profiles: List[Dict[str, float]] = []

    for raw in recitation_files:
        if not raw:
            continue
        try:
            profile = build_audio_profile_from_bytes(raw)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Error building audio profile during calibration", exc_info=exc)
            continue
        if profile:
            voice_profiles.append(profile)

    voice_profile = aggregate_voice_profiles(voice_profiles) if voice_profiles else {}

    if voice_profile:
        recommended_params = compute_adaptive_chain_params(voice_profile)
    else:
        recommended_params = {}

    noise_profile: Dict[str, float] = {}
    if noise_file:
        try:
            noise_profile = build_noise_profile_from_bytes(noise_file)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Error building noise profile during calibration", exc_info=exc)
            noise_profile = {}

    result: Dict[str, Any] = {
        "voice_profile": voice_profile,
        "noise_profile": noise_profile,
        "recommended_params": recommended_params,
    }

    logger.info("Calibration result", extra={"result": result})
    return result
