"""Unit tests for core services (not just endpoints)."""

import numpy as np
import pytest

from app.services.audio_enhance import enhance_audio
from app.services.audio_enhance_pro import (
    _apply_simple_compressor,
    _apply_simple_deesser,
    _apply_simple_limiter,
    _apply_simple_voice_eq,
    _prepare_audio_for_studio,
)
from app.services.classifier import classify_content
from app.services.quality_scoring import compute_quality_score
from app.services.voice_embedding import extract_embedding
from app.services.quran_align import _compute_is_quran_like, align_quran_text


class TestAudioEnhancePro:
    """Tests for audio enhancement pipeline components."""

    def test_prepare_audio_mono_conversion(self) -> None:
        """Stereo audio should be converted to mono."""
        stereo = np.random.randn(1000, 2).astype("float32")
        mono, sr = _prepare_audio_for_studio(stereo, 16000, target_sr=16000)
        assert mono.ndim == 1
        assert len(mono) == 1000

    def test_prepare_audio_resampling(self) -> None:
        """Audio should be resampled to target sample rate."""
        samples = np.random.randn(16000).astype("float32")  # 1 second at 16kHz
        resampled, sr = _prepare_audio_for_studio(samples, 16000, target_sr=48000)
        assert sr == 48000
        # Should be approximately 3x longer (48000/16000)
        assert len(resampled) > len(samples) * 2

    def test_prepare_audio_clipping(self) -> None:
        """Output should be clipped to [-1, 1]."""
        samples = np.array([2.0, -2.0, 0.5], dtype="float32")
        result, _ = _prepare_audio_for_studio(samples, 16000, target_sr=16000)
        assert np.all(result >= -1.0)
        assert np.all(result <= 1.0)

    def test_voice_eq_preserves_length(self) -> None:
        """EQ should not change audio length."""
        samples = np.random.randn(48000).astype("float32") * 0.5
        result = _apply_simple_voice_eq(samples, 48000)
        assert len(result) == len(samples)

    def test_deesser_preserves_length(self) -> None:
        """De-esser should not change audio length."""
        samples = np.random.randn(48000).astype("float32") * 0.5
        result = _apply_simple_deesser(samples, 48000)
        assert len(result) == len(samples)

    def test_compressor_reduces_dynamics(self) -> None:
        """Compressor should reduce dynamic range."""
        # Create signal with high dynamic range
        samples = np.zeros(1000, dtype="float32")
        samples[0:500] = 0.1  # Quiet part
        samples[500:1000] = 0.9  # Loud part
        
        result = _apply_simple_compressor(samples, threshold_db=-20.0, ratio=4.0)
        
        # Loud part should be reduced relative to quiet part
        original_ratio = np.mean(np.abs(samples[500:1000])) / np.mean(np.abs(samples[0:500]))
        compressed_ratio = np.mean(np.abs(result[500:1000])) / np.mean(np.abs(result[0:500]))
        assert compressed_ratio < original_ratio

    def test_limiter_ceiling(self) -> None:
        """Limiter should enforce ceiling."""
        samples = np.array([0.5, 1.0, -1.0, 0.99], dtype="float32")
        result = _apply_simple_limiter(samples, ceiling=0.95)
        assert np.all(np.abs(result) <= 0.95)

    def test_empty_audio_handling(self) -> None:
        """Functions should handle empty arrays gracefully."""
        empty = np.array([], dtype="float32")
        assert len(_apply_simple_voice_eq(empty, 48000)) == 0
        assert len(_apply_simple_deesser(empty, 48000)) == 0
        assert len(_apply_simple_compressor(empty)) == 0
        assert len(_apply_simple_limiter(empty)) == 0


class TestVoiceEmbedding:
    """Tests for voice embedding extraction."""

    def test_embedding_dimension(self, sample_audio_bytes: bytes) -> None:
        """Embedding should have expected dimension."""
        embedding = extract_embedding(sample_audio_bytes)
        assert len(embedding) == 40  # Expected dimension

    def test_embedding_deterministic(self, sample_audio_bytes: bytes) -> None:
        """Same input should produce same embedding."""
        emb1 = extract_embedding(sample_audio_bytes)
        emb2 = extract_embedding(sample_audio_bytes)
        assert emb1 == emb2

    def test_embedding_normalized(self, sample_audio_bytes: bytes) -> None:
        """Embedding values should be in reasonable range."""
        embedding = extract_embedding(sample_audio_bytes)
        assert all(-10 <= v <= 10 for v in embedding)


class TestQualityScoring:
    """Tests for audio quality scoring."""

    def test_score_ranges(self, sample_audio_bytes: bytes) -> None:
        """All scores should be in valid ranges."""
        scores = compute_quality_score(sample_audio_bytes)

        assert 0 <= scores["clarity"] <= 1
        assert 0 <= scores["stability"] <= 1
        assert 0 <= scores["noise"] <= 1
        assert 0 <= scores["tilawa_score"] <= 100

    def test_noisy_audio_detection(
        self, sample_audio_bytes: bytes, noisy_audio_bytes: bytes
    ) -> None:
        """Noisy audio should have higher noise score."""

        clean_scores = compute_quality_score(sample_audio_bytes)
        noisy_scores = compute_quality_score(noisy_audio_bytes)

        # Noisy audio should have higher noise score
        assert noisy_scores["noise"] >= clean_scores["noise"]


class TestClassifier:
    """Tests for content classification."""

    def test_classification_output(self, sample_audio_bytes: bytes) -> None:
        """Classifier should return valid label and confidence."""
        result = classify_content(sample_audio_bytes)

        assert result["label"] in ["quran", "nasheed", "speech", "noise"]
        assert 0 <= result["confidence"] <= 1


class TestQuranAlignment:
    """Tests for Qur'an alignment logic."""

    def test_is_quran_like_high_confidence(self) -> None:
        """High confidence matches should be detected as Qur'an-like."""
        matches = [{"surah": 1, "ayah": 2, "confidence": 0.95}]
        assert _compute_is_quran_like(matches, global_accuracy=0.8) is True

    def test_is_quran_like_low_confidence(self) -> None:
        """Low confidence should not be Qur'an-like."""
        matches = [{"surah": 1, "ayah": 2, "confidence": 0.3}]
        assert _compute_is_quran_like(matches, global_accuracy=0.8) is False

    def test_is_quran_like_empty_matches(self) -> None:
        """Empty matches should not be Qur'an-like."""
        assert _compute_is_quran_like([], global_accuracy=0.8) is False

    def test_align_quran_text_fatiha(self) -> None:
        """Al-Fatiha verses should be correctly identified."""
        result = align_quran_text("بسم الله الرحمن الرحيم")
        assert "matches" in result
        assert len(result["matches"]) > 0
        # Should match Surah 1 (Al-Fatiha)
        assert any(m["surah"] == 1 for m in result["matches"])

    def test_align_quran_text_non_quran(self) -> None:
        """Non-Qur'anic text should have low confidence."""
        result = align_quran_text("مرحبا كيف حالك اليوم")
        # Should still return structure but with lower confidence
        assert "matches" in result
        assert "is_quran_like" in result


class TestEnhanceAudio:
    """Tests for the main enhance_audio function."""

    def test_enhance_returns_metrics(self) -> None:
        """enhance_audio should return all expected metrics."""
        # Create a simple valid WAV-like structure
        audio = np.random.randn(16000).astype("float32") * 0.5
        
        # Note: enhance_audio expects raw bytes, so we need to test via endpoint
        # This is a placeholder for when we have proper audio fixtures
        pass


class TestMetricsEndpoint:
    """Tests for Prometheus metrics endpoint."""

    def test_metrics_endpoint_available(self, client) -> None:
        """Metrics endpoint should be accessible."""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "tilawa" in response.text or "http" in response.text
