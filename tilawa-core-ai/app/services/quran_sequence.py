from __future__ import annotations

from typing import Any, Dict, List

from app.services.quran_matcher import match_transcript_to_verses
from app.services.quran_normalize import load_quran_verses, normalize_arabic


def analyze_quran_recitation_transcript(
    transcript: str,
    max_span: int = 10,
    accuracy_threshold: float = 0.9,
) -> Dict[str, Any]:
    """Analyze a Qur'an recitation transcript at the verse-sequence level.

    - infers main surah based on best text match
    - builds a local forward sequence of ayat within that surah
    - computes per-ayah accuracy and simple error indicators
    """
    base_result: Dict[str, Any] = {
        "surah": None,
        "sequence": [],
        "global_accuracy": None,
        "errors": [],
    }

    if not transcript:
        return base_result

    transcript_norm = normalize_arabic(transcript)
    if not transcript_norm:
        return base_result

    transcript_tokens = transcript_norm.split()

    # Anchor via existing matcher (use aggregated confidence per surah).
    matches = match_transcript_to_verses(transcript, top_k=5)
    if not matches:
        return base_result

    # Aggregate confidence per surah to better handle cases like
    # basmalah (1:1) followed by a long recitation from another surah.
    surah_scores: Dict[int, float] = {}
    best_per_surah: Dict[int, Dict[str, Any]] = {}

    for m in matches:
        try:
            surah_id = int(m["surah"])
            conf = float(m.get("confidence", 0.0))
        except Exception:  # pragma: no cover - defensive
            continue

        surah_scores[surah_id] = surah_scores.get(surah_id, 0.0) + conf

        current_best = best_per_surah.get(surah_id)
        if current_best is None or conf > float(current_best.get("confidence", 0.0)):
            best_per_surah[surah_id] = m

    if not surah_scores:
        return base_result

    # Choose surah with highest total confidence across top matches.
    anchor_surah = max(surah_scores.items(), key=lambda kv: kv[1])[0]
    anchor_match = best_per_surah.get(anchor_surah)
    if anchor_match is None:
        return base_result

    anchor_conf = float(anchor_match.get("confidence", 0.0))
    if anchor_conf < 0.3:
        # Very weak match, do not attempt sequence
        return base_result

    anchor_ayah = int(anchor_match["ayah"])

    # Retrieve verses for that surah
    verses = load_quran_verses()
    surah_verses = [v for v in verses if int(v["surah"]) == anchor_surah]
    if not surah_verses:
        return base_result

    surah_verses.sort(key=lambda v: int(v["ayah"]))
    verses_by_ayah = {int(v["ayah"]): v for v in surah_verses}
    last_ayah = int(surah_verses[-1]["ayah"])

    start_ayah = anchor_ayah
    end_ayah = min(anchor_ayah + max_span - 1, last_ayah)

    sequence: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    accuracies: List[float] = []

    for ayah_num in range(start_ayah, end_ayah + 1):
        verse = verses_by_ayah.get(ayah_num)
        if verse is None:
            continue

        text_norm = str(verse.get("text_norm", ""))
        ayah_tokens = text_norm.split()
        if not ayah_tokens:
            continue

        total = float(len(ayah_tokens)) or 1.0
        covered = sum(1 for w in ayah_tokens if w in transcript_tokens)
        accuracy = covered / total

        # Skip extremely low-overlap ayat to avoid noisy tails
        if accuracy < 0.2:
            continue

        missing_words = [w for w in ayah_tokens if w not in transcript_tokens]
        extra_words = [w for w in transcript_tokens if w not in ayah_tokens]

        error_flag = accuracy < accuracy_threshold
        confidence = float(accuracy)

        item: Dict[str, Any] = {
            "surah": anchor_surah,
            "ayah": ayah_num,
            "confidence": confidence,
            "accuracy": accuracy,
            "error_flag": error_flag,
            "missing_words": missing_words,
            "extra_words": extra_words,
        }
        sequence.append(item)
        accuracies.append(accuracy)

        if error_flag:
            if missing_words:
                errors.append(
                    {
                        "surah": anchor_surah,
                        "ayah": ayah_num,
                        "type": "missing_words",
                        "details": "Missing words: " + ", ".join(missing_words),
                    }
                )
            errors.append(
                {
                    "surah": anchor_surah,
                    "ayah": ayah_num,
                    "type": "low_accuracy",
                    "details": f"Accuracy {accuracy:.2f} below threshold {accuracy_threshold:.2f}",
                }
            )

    if not sequence:
        return base_result

    global_accuracy = float(sum(accuracies) / len(accuracies))

    base_result["surah"] = anchor_surah
    base_result["sequence"] = sequence
    base_result["global_accuracy"] = global_accuracy
    base_result["errors"] = errors

    return base_result
