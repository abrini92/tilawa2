from io import BytesIO
from typing import Tuple

import numpy as np
import soundfile as sf


def load_audio_from_bytes(raw_bytes: bytes) -> Tuple[np.ndarray, int]:
    """Load audio from raw bytes into a mono float32 numpy array and sample_rate.

    - Converts to mono if needed (mean over channels).
    - Normalizes to [-1, 1] float32.
    - Falls back to silence if decoding fails or bytes are empty.
    """
    if not raw_bytes:
        return np.zeros(1, dtype="float32"), 16000

    try:
        data, sr = sf.read(BytesIO(raw_bytes), always_2d=True)
        mono = data.mean(axis=1).astype("float32")
        return mono, int(sr)
    except Exception:
        # Fallback: return 1-sample silence at 16kHz
        return np.zeros(1, dtype="float32"), 16000


def get_duration_seconds(samples: np.ndarray, sample_rate: int) -> float:
    return float(len(samples) / sample_rate)


def compute_rms(samples: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(samples))) + 1e-12)


def compute_peak(samples: np.ndarray) -> float:
    return float(np.max(np.abs(samples)) + 1e-12)


def estimate_snr_db(samples: np.ndarray, noise_floor_ratio: float = 0.1) -> float:
    """Very rough SNR estimate using frame-wise RMS statistics."""
    if len(samples) < 1024:
        return 0.0

    frame_len = 1024
    hop = 512
    rms_frames = []
    for start in range(0, len(samples) - frame_len, hop):
        frame = samples[start : start + frame_len]
        rms_frames.append(compute_rms(frame))

    rms_frames = np.array(rms_frames)
    if len(rms_frames) == 0:
        return 0.0

    global_rms = float(np.mean(rms_frames))
    k = max(1, int(len(rms_frames) * noise_floor_ratio))
    noise_rms = float(np.mean(np.sort(rms_frames)[:k]) + 1e-12)

    if noise_rms <= 0:
        return 0.0

    snr = 20.0 * np.log10(global_rms / noise_rms + 1e-12)
    return float(snr)
