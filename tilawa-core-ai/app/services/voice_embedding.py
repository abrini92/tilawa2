from typing import List

import librosa
import numpy as np

from app.utils.audio_io import load_audio_from_bytes
from app.utils.logging import get_logger


logger = get_logger(__name__)


def _compute_mfcc_embedding(samples: np.ndarray, sample_rate: int, n_mfcc: int = 40) -> np.ndarray:
    """Compute a simple MFCC-based embedding.

    - Compute MFCCs over the full signal
    - Mean-pool over time
    - L2-normalize the resulting vector
    """
    if samples.size == 0:
        return np.zeros(n_mfcc, dtype="float32")

    mfcc = librosa.feature.mfcc(y=samples, sr=sample_rate, n_mfcc=n_mfcc)
    emb = mfcc.mean(axis=1).astype("float32")
    norm = float(np.linalg.norm(emb) + 1e-12)
    emb = emb / norm
    return emb


def extract_embedding(raw_bytes: bytes) -> List[float]:
    """Load audio and compute MFCC-based embedding."""
    logger.info("Computing voice embedding (MFCC-based)")
    samples, sr = load_audio_from_bytes(raw_bytes)
    emb = _compute_mfcc_embedding(samples, sr)
    return emb.tolist()
