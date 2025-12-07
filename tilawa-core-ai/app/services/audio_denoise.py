from __future__ import annotations

from typing import Dict

import numpy as np

from app.utils.logging import get_logger


logger = get_logger(__name__)


def denoise_with_profile(
    samples: np.ndarray,
    sample_rate: int,
    noise_profile: Dict[str, float],
    strength: float = 0.5,
) -> np.ndarray:
    """Simple spectral denoising guided by a noise profile.

    - Uses low/mid/high band levels from the noise profile.
    - Applies more attenuation in noisier bands, scaled by `strength`.

    This is a light, conservative denoiser intended to gently reduce
    broadband room noise without introducing strong artifacts.
    """
    if samples is None or samples.size == 0 or sample_rate <= 0:
        return samples

    if not noise_profile:
        logger.info("No noise profile provided; skipping denoising")
        return samples

    x = samples.astype("float32")

    try:
        # Clamp strength and band levels
        s = float(max(0.0, min(1.0, strength)))
        low_level = float(noise_profile.get("low_band", 0.0) or 0.0)
        mid_level = float(noise_profile.get("mid_band", 0.0) or 0.0)
        high_level = float(noise_profile.get("high_band", 0.0) or 0.0)

        low_level = max(0.0, min(1.0, low_level))
        mid_level = max(0.0, min(1.0, mid_level))
        high_level = max(0.0, min(1.0, high_level))

        # Simple global FFT-based denoising
        N = int(x.size)
        if N <= 0:
            return x

        spectrum = np.fft.rfft(x)
        mag = np.abs(spectrum)
        phase = np.angle(spectrum)
        freqs = np.fft.rfftfreq(N, d=1.0 / float(sample_rate))

        # Map band levels to attenuation factors
        def band_att(level: float) -> float:
            # The noisier the band, the more attenuation.
            return float(1.0 - s * level)

        low_att = band_att(low_level)
        mid_att = band_att(mid_level)
        high_att = band_att(high_level)

        # Build attenuation curve per bin
        att = np.ones_like(mag, dtype="float32")
        low_mask = freqs < 250.0
        mid_mask = (freqs >= 250.0) & (freqs < 2000.0)
        high_mask = (freqs >= 2000.0) & (freqs <= 8000.0)

        att[low_mask] *= low_att
        att[mid_mask] *= mid_att
        att[high_mask] *= high_att

        mag_denoised = mag * att
        spectrum_denoised = mag_denoised * np.exp(1j * phase)
        y = np.fft.irfft(spectrum_denoised, n=N).astype("float32")

        y = np.clip(y, -1.0, 1.0)
        return y
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error during spectral denoising; returning original samples", exc_info=exc)
        return samples
