"""Integration tests using proper audio fixtures."""

import pytest
from fastapi.testclient import TestClient


class TestAudioEndpointsWithRealAudio:
    """Integration tests for audio endpoints with valid WAV files."""

    def test_enhance_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /audio/enhance with valid WAV audio."""
        files = {"file": ("test.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/audio/enhance", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["metrics"]["duration_sec"] > 0
        assert data["metrics"]["sample_rate"] > 0

    def test_enhance_pro_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /audio/enhance-pro returns valid WAV."""
        files = {"file": ("test.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/audio/enhance-pro", files=files)
        
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("audio/wav")
        # Check WAV header (RIFF)
        assert response.content[:4] == b"RIFF"

    def test_enhance_adaptive_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /audio/enhance-adaptive returns valid WAV."""
        files = {"file": ("test.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/audio/enhance-adaptive", files=files)
        
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("audio/wav")
        assert response.content[:4] == b"RIFF"

    def test_audio_profile_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /audio/profile returns expected metrics."""
        files = {"file": ("test.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/audio/profile", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "rms" in data
        assert isinstance(data["rms"], (int, float))

    def test_noise_profile_with_silence(
        self, client: TestClient, silence_audio_bytes: bytes
    ) -> None:
        """Test /audio/noise-profile with silent audio."""
        files = {"file": ("silence.wav", silence_audio_bytes, "audio/wav")}
        response = client.post("/audio/noise-profile", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "noise_rms" in data
        # Silent audio should have very low RMS
        assert data["noise_rms"] < 0.01

    def test_calibrate_with_multiple_files(
        self, client: TestClient, sample_audio_bytes: bytes, silence_audio_bytes: bytes
    ) -> None:
        """Test /audio/calibrate with recitation + noise samples."""
        files = [
            ("files", ("rec1.wav", sample_audio_bytes, "audio/wav")),
            ("files", ("rec2.wav", sample_audio_bytes, "audio/wav")),
            ("noise_file", ("noise.wav", silence_audio_bytes, "audio/wav")),
        ]
        response = client.post("/audio/calibrate", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "voice_profile" in data
        assert "noise_profile" in data
        assert "recommended_params" in data


class TestQuranEndpointsWithRealAudio:
    """Integration tests for Qur'an endpoints."""

    def test_quran_align_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /quran/align with valid audio."""
        files = {"file": ("recitation.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/quran/align", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "verses" in data
        assert "integrity_score" in data
        assert "transcript" in data
        assert "timeline" in data

    def test_is_quran_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /quran/is-quran classification."""
        files = {"file": ("recitation.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/quran/is-quran", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "is_quran" in data
        assert "label" in data
        assert "quran_confidence" in data


class TestVoiceEndpointsWithRealAudio:
    """Integration tests for voice endpoints."""

    def test_voice_analyze_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /voice/analyze with valid audio."""
        files = {"file": ("voice.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/voice/analyze", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "embedding" in data
        assert "scores" in data
        assert len(data["embedding"]) == 40


class TestContentEndpointsWithRealAudio:
    """Integration tests for content classification."""

    def test_content_classify_with_valid_audio(
        self, client: TestClient, sample_audio_bytes: bytes
    ) -> None:
        """Test /content/classify with valid audio."""
        files = {"file": ("content.wav", sample_audio_bytes, "audio/wav")}
        response = client.post("/content/classify", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["label"] in ["quran", "nasheed", "speech", "noise"]
        assert 0 <= data["confidence"] <= 1


class TestErrorHandling:
    """Tests for error handling and edge cases."""

    def test_empty_file_handling(self, client: TestClient) -> None:
        """Empty files should be handled gracefully."""
        files = {"file": ("empty.wav", b"", "audio/wav")}
        response = client.post("/audio/enhance", files=files)
        # Should return 200 with fallback metrics or 400
        assert response.status_code in [200, 400]

    def test_invalid_audio_format(self, client: TestClient) -> None:
        """Invalid audio should be handled gracefully."""
        files = {"file": ("invalid.wav", b"not valid audio data", "audio/wav")}
        response = client.post("/audio/enhance", files=files)
        # Should return 200 with fallback or 400
        assert response.status_code in [200, 400]

    def test_missing_file(self, client: TestClient) -> None:
        """Missing file should return 422."""
        response = client.post("/audio/enhance")
        assert response.status_code == 422


class TestHealthAndMetrics:
    """Tests for health and monitoring endpoints."""

    def test_health_endpoint(self, client: TestClient) -> None:
        """Health endpoint should return ok."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_metrics_endpoint(self, client: TestClient) -> None:
        """Metrics endpoint should be available."""
        response = client.get("/metrics")
        assert response.status_code == 200
        # Should contain Prometheus metrics
        assert "http_requests" in response.text or "tilawa" in response.text
