from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_audio_enhance() -> None:
    files = {"file": ("test.wav", b"0" * 1024, "audio/wav")}
    response = client.post("/audio/enhance", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "metrics" in data
    assert data["metrics"]["duration_sec"] >= 0.0


def test_audio_enhance_pro_endpoint() -> None:
    files = {"file": ("test.wav", b"1" * 2048, "audio/wav")}
    response = client.post("/audio/enhance-pro", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")


def test_audio_enhance_adaptive_endpoint() -> None:
    files = {"file": ("test.wav", b"1" * 4096, "audio/wav")}
    response = client.post("/audio/enhance-adaptive", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")


def test_audio_profile_endpoint() -> None:
    files = {"file": ("test.wav", b"1" * 2048, "audio/wav")}
    response = client.post("/audio/profile", files=files)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_audio_noise_profile_endpoint() -> None:
    files = {"file": ("noise.wav", b"1" * 2048, "audio/wav")}
    response = client.post("/audio/noise-profile", files=files)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_audio_calibrate_endpoint() -> None:
    files = [
        ("files", ("rec1.wav", b"1" * 2048, "audio/wav")),
        ("files", ("rec2.wav", b"1" * 2048, "audio/wav")),
    ]
    response = client.post("/audio/calibrate", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "voice_profile" in data
    assert "recommended_params" in data


def test_audio_enhance_adaptive_with_noise_endpoint() -> None:
    files = [
        ("file", ("rec.wav", b"1" * 2048, "audio/wav")),
        ("noise_file", ("noise.wav", b"1" * 2048, "audio/wav")),
    ]
    response = client.post("/audio/enhance-adaptive-with-noise", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")
