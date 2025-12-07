from __future__ import annotations

from typing import Any, Dict, List, Tuple

import librosa
import numpy as np


def _compute_speech_segments(samples: np.ndarray, sample_rate: int) -> List[Tuple[float, float]]:
    """Detect coarse speech segments using energy-based splitting.

    Returns a list of (start_sec, end_sec) tuples.
    """
    if samples.size == 0 or sample_rate <= 0:
        return []

    # librosa.effects.split returns sample indices [start, end)
    intervals = librosa.effects.split(samples, top_db=30)
    segments: List[Tuple[float, float]] = []
    for start_sample, end_sample in intervals:
        start_t = float(start_sample) / float(sample_rate)
        end_t = float(end_sample) / float(sample_rate)
        if end_t > start_t:
            segments.append((start_t, end_t))

    return segments


def build_ayah_timeline(
    samples: np.ndarray,
    sample_rate: int,
    sequence: List[Dict[str, Any]],
    margin_s: float = 0.15,
) -> List[Dict[str, Any]]:
    """Approximate a timeline (start/end seconds) for each ayah in the sequence.

    This is a coarse, monotonic allocation of detected speech segments over the
    ordered ayah sequence and is meant as a V1 helper for interactive players.
    """
    timeline: List[Dict[str, Any]] = []

    if not sequence:
        return timeline

    if samples.size == 0 or sample_rate <= 0:
        # No audio information, nothing to do
        return timeline

    duration_sec = float(len(samples) / float(sample_rate))

    segments = _compute_speech_segments(samples, sample_rate)
    if not segments:
        # Fallback: treat entire audio as one big segment
        segments = [(0.0, duration_sec)]

    total_speech = sum(end - start for start, end in segments)
    if total_speech <= 0.0:
        # Degenerate fallback
        segments = [(0.0, duration_sec)]
        total_speech = duration_sec

    if total_speech <= 0.0:
        return timeline

    num_ayah = len(sequence)
    per_ayah = total_speech / float(max(1, num_ayah))

    seg_idx = 0
    seg_start, seg_end = segments[0]
    current_t = seg_start

    for item in sequence:
        # Target window for this ayah in the speech timeline
        target_start = current_t
        target_end = current_t + per_ayah

        # Advance to the segment that covers target_start
        while seg_idx < len(segments) and target_start >= seg_end:
            seg_idx += 1
            if seg_idx < len(segments):
                seg_start, seg_end = segments[seg_idx]
                current_t = max(current_t, seg_start)

        if seg_idx >= len(segments):
            # No more speech segments; stop assigning
            break

        start_t = max(current_t, seg_start)
        end_t = min(target_end, seg_end)

        if end_t <= start_t:
            # If window collapsed, expand minimally inside current segment
            start_t = max(seg_start, min(current_t, seg_end))
            end_t = seg_end

        # Apply margins
        start_t = max(0.0, start_t - margin_s)
        end_t = min(duration_sec, end_t + margin_s)

        timeline.append(
            {
                "surah": int(item["surah"]),
                "ayah": int(item["ayah"]),
                "start": float(start_t),
                "end": float(end_t),
            }
        )

        current_t = end_t

    return timeline
