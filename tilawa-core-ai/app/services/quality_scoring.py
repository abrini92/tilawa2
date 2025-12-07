from typing import Dict

import librosa
import numpy as np

from app.utils.audio_io import load_audio_from_bytes, compute_rms, estimate_snr_db
from app.utils.logging import get_logger


logger = get_logger(__name__)


def _compute_stability(samples: np.ndarray, sample_rate: int) -> float:
    """Approximate voice stability based on frame-wise energy variation."""
    if samples.size < sample_rate:
        return 0.5

    hop = int(0.02 * sample_rate)
    frame_len = int(0.04 * sample_rate)

    energies = []
    for start in range(0, samples.size - frame_len, hop):
        frame = samples[start : start + frame_len]
        energies.append(float(np.mean(frame**2)))

    energies_arr = np.asarray(energies)
    if energies_arr.size < 2:
        return 0.5

    mean_e = float(energies_arr.mean() + 1e-12)
    std_e = float(energies_arr.std())
    cov = std_e / mean_e
    stability = 1.0 / (1.0 + cov)
    return float(np.clip(stability, 0.0, 1.0))


def _compute_noise_score(snr_db: float, low: float = 10.0, high: float = 40.0) -> float:
    """Map SNR dB to [0, 1] where 1 is very clean."""
    if snr_db <= low:
        return 0.0
    if snr_db >= high:
        return 1.0
    return float((snr_db - low) / (high - low))


def _compute_clarity(samples: np.ndarray, sample_rate: int) -> float:
    """Approximate clarity using zero-crossing rate heuristics."""
    if samples.size == 0:
        return 0.0
    zcr = librosa.feature.zero_crossing_rate(samples)[0]
    mean_zcr = float(zcr.mean())
    ideal = 0.05
    diff = abs(mean_zcr - ideal)
    clarity = 1.0 - diff * 10.0
    return float(np.clip(clarity, 0.0, 1.0))


def compute_quality_score(raw_bytes: bytes) -> Dict[str, object]:
    """Compute a Tilawa-oriented quality score from raw audio bytes."""
    samples, sr = load_audio_from_bytes(raw_bytes)

    rms = compute_rms(samples)
    snr_db = estimate_snr_db(samples)
    clarity = _compute_clarity(samples, sr)
    stability = _compute_stability(samples, sr)
    noise_score = _compute_noise_score(snr_db)

    tilawa_score = (
        clarity * 0.4
        + stability * 0.3
        + noise_score * 0.3
    ) * 100.0

    scores: Dict[str, object] = {
        "rms": rms,
        "snr_db": snr_db,
        "clarity": clarity,
        "stability": stability,
        "noise": 1.0 - noise_score,
        "tilawa_score": float(tilawa_score),
    }

    logger.info("Voice quality scores computed", extra=scores)
    return scores
