from __future__ import annotations

from typing import Dict, List

from difflib import SequenceMatcher

try:  # pragma: no cover - optional dependency
    from rapidfuzz import fuzz

    _HAS_RAPIDFUZZ = True
except Exception:  # pragma: no cover
    fuzz = None  # type: ignore
    _HAS_RAPIDFUZZ = False

from app.services.quran_normalize import normalize_arabic, load_quran_verses


def _similarity(a: str, b: str) -> float:
    """Compute similarity between two normalized strings in [0, 1]."""
    if not a or not b:
        return 0.0

    if _HAS_RAPIDFUZZ and fuzz is not None:
        # Use partial_ratio so that a verse contained inside a longer transcript
        # still scores highly. Returns [0, 100].
        return float(fuzz.partial_ratio(a, b) / 100.0)

    return float(SequenceMatcher(None, a, b).ratio())


def match_transcript_to_verses(transcript: str, top_k: int = 3) -> List[Dict]:
    """Match a transcript against Qur'an verses.

    Returns top_k matches sorted by confidence desc.
    Each item: {"surah": int, "ayah": int, "confidence": float}
    """
    if not transcript:
        return []

    transcript_norm = normalize_arabic(transcript)
    if not transcript_norm:
        return []

    verses = load_quran_verses()
    scores: List[Dict] = []

    for v in verses:
        verse_norm = v["text_norm"]
        score = _similarity(transcript_norm, verse_norm)
        if score <= 0.0:
            continue
        scores.append(
            {
                "surah": v["surah"],
                "ayah": v["ayah"],
                "confidence": float(score),
            }
        )

    scores.sort(key=lambda x: x["confidence"], reverse=True)

    if top_k <= 0:
        return scores

    return scores[:top_k]
