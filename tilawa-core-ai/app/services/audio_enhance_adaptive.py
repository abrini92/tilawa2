from __future__ import annotations

from io import BytesIO
from typing import Dict

import numpy as np
import soundfile as sf

from app.services.audio_adaptive_params import compute_adaptive_chain_params
from app.services.audio_denoise import denoise_with_profile
from app.services.audio_enhance_pro import (
    _apply_simple_compressor,
    _apply_simple_deesser,
    _apply_simple_limiter,
    _apply_simple_voice_eq,
    _prepare_audio_for_studio,
    enhance_audio_pro_to_wav_bytes,
)
from app.services.audio_profile import build_audio_profile_from_bytes
from app.utils.audio_io import load_audio_from_bytes
from app.utils.logging import get_logger


logger = get_logger(__name__)


def enhance_audio_adaptive_to_wav_bytes(
    raw_bytes: bytes,
    noise_profile: Dict[str, float] | None = None,
) -> bytes:
    """Adaptive Tilawa Studio chain.

    Pipeline:
    - Analyze the user's voice (profile).
    - Compute adaptive chain parameters.
    - Apply EQ, de-esser, compressor and limiter with these params.
    - Export to 16-bit PCM WAV.
    """
    logger.info("Starting Adaptive Tilawa Studio enhancement")

    profile = build_audio_profile_from_bytes(raw_bytes)
    if not profile:
        logger.warning("Empty audio profile; falling back to Pro chain")
        return enhance_audio_pro_to_wav_bytes(raw_bytes)

    params = compute_adaptive_chain_params(profile)

    samples, sr = load_audio_from_bytes(raw_bytes)
    if samples is None or samples.size == 0 or sr <= 0:
        logger.warning("Empty or invalid audio in adaptive chain; falling back to Pro chain")
        return enhance_audio_pro_to_wav_bytes(raw_bytes)

    # Prepare audio (mono + resample)
    samples, sr = _prepare_audio_for_studio(samples, sr)

    # Optional noise-aware denoising before adaptive chain
    if noise_profile:
        try:
            samples = denoise_with_profile(samples, sr, noise_profile, strength=0.5)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Error during denoising in adaptive chain; continuing without denoise", exc_info=exc)

    # Initial RMS and normalization to target
    rms_before = float(np.sqrt(float(np.mean(samples**2))) if samples.size else 0.0)
    target_rms = float(params.get("target_rms", 0.11))

    if rms_before > 1e-6:
        gain = target_rms / rms_before
        samples = samples * float(gain)

    try:
        # Extract adaptive parameters
        eq_low_gain_db = float(params.get("eq_low_gain_db", 0.0))
        eq_high_gain_db = float(params.get("eq_high_gain_db", 0.0))
        deesser_strength = float(params.get("deesser_strength", 0.5))
        compressor_threshold_db = float(params.get("compressor_threshold_db", -18.0))
        makeup_gain_db = float(params.get("makeup_gain_db", 2.0))

        # Adaptive processing chain
        processed = _apply_simple_voice_eq(
            samples,
            sr,
            eq_low_gain_db=eq_low_gain_db,
            eq_high_gain_db=eq_high_gain_db,
        )
        processed = _apply_simple_deesser(processed, sr, strength=deesser_strength)
        processed = _apply_simple_compressor(
            processed,
            threshold_db=compressor_threshold_db,
            ratio=2.0,
            makeup_gain_db=makeup_gain_db,
        )
        processed = _apply_simple_limiter(processed, ceiling=0.98)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in adaptive chain; falling back to Pro chain", exc_info=exc)
        return enhance_audio_pro_to_wav_bytes(raw_bytes)

    rms_after = float(np.sqrt(float(np.mean(processed**2))) if processed.size else 0.0)

    logger.info(
        "Adaptive Tilawa Studio enhancement done",
        extra={
            "sample_rate": sr,
            "rms_before": rms_before,
            "rms_after": rms_after,
            "target_rms": target_rms,
            "profile": profile,
            "params": params,
            "has_noise_profile": bool(noise_profile),
        },
    )

    processed = np.clip(processed.astype("float32"), -1.0, 1.0)

    buffer = BytesIO()
    sf.write(buffer, processed, sr, format="WAV", subtype="PCM_16")
    buffer.seek(0)
    return buffer.getvalue()
