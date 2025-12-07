from typing import Dict

from app.utils.logging import get_logger


logger = get_logger(__name__)


LABELS = ["quran", "nasheed", "speech", "noise"]


def classify_content(raw_bytes: bytes) -> Dict[str, object]:
    """Dummy content classifier based on file size.

    Deterministic and simple: choose label based on length modulo and derive
    a pseudo-confidence.
    """
    length = len(raw_bytes) if raw_bytes else 0
    idx = length % len(LABELS)
    label = LABELS[idx]

    # Confidence between 0.6 and 0.99
    confidence = 0.6 + (length % 40) / 100.0
    confidence = min(confidence, 0.99)

    result: Dict[str, object] = {"label": label, "confidence": float(confidence)}
    logger.info("Content classified", extra={"label": label, "confidence": confidence, "num_bytes": length})
    return result
