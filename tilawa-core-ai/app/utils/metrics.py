"""Prometheus metrics for Tilawa Core AI.

Custom metrics for monitoring audio processing, transcription, and alignment.
"""

from prometheus_client import Counter, Histogram, Gauge

# Request counters
REQUESTS_TOTAL = Counter(
    "tilawa_requests_total",
    "Total number of requests",
    ["endpoint", "status"],
)

# Audio processing metrics
AUDIO_PROCESSING_DURATION = Histogram(
    "tilawa_audio_processing_seconds",
    "Time spent processing audio",
    ["operation"],  # enhance, enhance_pro, enhance_adaptive
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

AUDIO_DURATION_PROCESSED = Histogram(
    "tilawa_audio_duration_seconds",
    "Duration of audio files processed",
    ["operation"],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600],
)

# Transcription metrics
TRANSCRIPTION_DURATION = Histogram(
    "tilawa_transcription_seconds",
    "Time spent on ASR transcription",
    ["model"],  # faster_whisper, openai_whisper
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0],
)

TRANSCRIPTION_REALTIME_FACTOR = Histogram(
    "tilawa_transcription_realtime_factor",
    "Ratio of transcription time to audio duration (lower is better)",
    ["model"],
    buckets=[0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0],
)

# Qur'an alignment metrics
QURAN_ALIGNMENT_DURATION = Histogram(
    "tilawa_quran_alignment_seconds",
    "Time spent on Qur'an alignment",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
)

QURAN_DETECTION_TOTAL = Counter(
    "tilawa_quran_detection_total",
    "Total Qur'an detection results",
    ["is_quran"],  # true, false
)

QURAN_CONFIDENCE = Histogram(
    "tilawa_quran_confidence",
    "Confidence scores for Qur'an detection",
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
)

# Model loading
MODEL_LOAD_DURATION = Histogram(
    "tilawa_model_load_seconds",
    "Time to load ML models",
    ["model_name"],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0],
)

MODEL_LOADED = Gauge(
    "tilawa_model_loaded",
    "Whether a model is currently loaded",
    ["model_name"],
)

# Error tracking
ERRORS_TOTAL = Counter(
    "tilawa_errors_total",
    "Total number of errors",
    ["endpoint", "error_type"],
)

# File upload metrics
UPLOAD_SIZE_BYTES = Histogram(
    "tilawa_upload_size_bytes",
    "Size of uploaded files in bytes",
    ["endpoint"],
    buckets=[1024, 10240, 102400, 1048576, 10485760, 104857600],  # 1KB to 100MB
)
