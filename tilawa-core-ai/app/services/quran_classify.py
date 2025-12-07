from __future__ import annotations

from typing import Any, Dict, List


def summarize_alignment_result(
    align_result: Dict[str, Any],
    accuracy_threshold: float = 0.5,
    confidence_threshold: float = 0.6,
) -> Dict[str, Any]:
    """Summarize a full alignment result into a simple classification + feedback.

    The expected input is the dict returned by align_quran / align_quran_text.
    """
    matches: List[Dict[str, Any]] = list(align_result.get("matches") or [])
    sequence: List[Dict[str, Any]] = list(align_result.get("sequence") or [])
    errors: List[Dict[str, Any]] = list(align_result.get("errors") or [])

    global_accuracy_raw = align_result.get("global_accuracy")
    try:
        global_accuracy = float(global_accuracy_raw) if global_accuracy_raw is not None else None
    except Exception:  # pragma: no cover - defensive
        global_accuracy = None

    # Determine main surah and ayah span
    main_surah = None
    ayah_start = None
    ayah_end = None

    if sequence:
        try:
            main_surah = int(sequence[0]["surah"])
            ayah_numbers = [int(it["ayah"]) for it in sequence]
            ayah_start = min(ayah_numbers)
            ayah_end = max(ayah_numbers)
        except Exception:  # pragma: no cover - defensive
            main_surah = None
            ayah_start = None
            ayah_end = None
    elif matches:
        try:
            main_surah = int(matches[0]["surah"])
            ayah_start = ayah_end = int(matches[0]["ayah"])
        except Exception:  # pragma: no cover - defensive
            main_surah = None
            ayah_start = None
            ayah_end = None

    # Quran confidence based on best match
    try:
        best_conf = float(matches[0]["confidence"]) if matches else 0.0
    except Exception:  # pragma: no cover - defensive
        best_conf = 0.0

    quran_confidence = float(best_conf)

    # Decide if it is Qur'an-like according to thresholds
    has_sequence = len(sequence) >= 1
    has_accuracy = global_accuracy is not None
    is_quran = bool(
        has_accuracy
        and global_accuracy is not None
        and global_accuracy >= accuracy_threshold
        and has_sequence
        and quran_confidence >= confidence_threshold
    )

    # Label according to quality
    if not is_quran:
        label = "not_quran"
    elif is_quran and (global_accuracy or 0.0) >= 0.9 and len(errors) == 0:
        label = "quran_good"
    elif is_quran and len(errors) > 0:
        label = "quran_with_errors"
    else:
        label = "quran_uncertain"

    summary: Dict[str, Any] = {
        "is_quran": is_quran,
        "label": label,
        "quran_confidence": quran_confidence,
        "main_surah": main_surah,
        "ayah_start": ayah_start,
        "ayah_end": ayah_end,
        "recitation_accuracy": global_accuracy,
        "issues_count": len(errors),
        "issues": errors,
    }

    return summary
