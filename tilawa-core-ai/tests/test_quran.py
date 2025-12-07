from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_quran_align_text_fatiha_ayah2() -> None:
    payload = {"transcript": "الحمد لله رب العالمين"}
    response = client.post("/quran/align-text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["transcript"] == payload["transcript"]
    assert len(data["matches"]) >= 1
    best = data["matches"][0]
    # We only require that there is a high-confidence verse match; we do not
    # enforce a specific (surah, ayah) here because the matcher heuristics and
    # corpus variants may change, while the contract is simply that Fatiha-like
    # text yields strong matches and rich alignment metadata.
    assert best["confidence"] > 0.7

    # New multi-verse / error analysis fields
    assert "sequence" in data
    assert isinstance(data["sequence"], list)
    assert "errors" in data
    assert isinstance(data["errors"], list)
    assert "is_quran_like" in data


def test_quran_align_audio_smoke() -> None:
    files = {"file": ("test.wav", b"1" * 1024, "audio/wav")}
    response = client.post("/quran/align", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "verses" in data
    assert "integrity_score" in data
    assert "matches" in data
    assert "sequence" in data
    assert "errors" in data
    assert "is_quran_like" in data
    assert "timeline" in data
    assert isinstance(data["timeline"], list)


def test_is_quran_text_endpoint_smoke() -> None:
    payload = {"transcript": "الحمد لله رب العالمين"}
    response = client.post("/quran/is-quran-text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "is_quran" in data
    assert "label" in data
    assert "quran_confidence" in data


def test_is_quran_audio_endpoint_smoke() -> None:
    files = {"file": ("test.wav", b"1" * 2048, "audio/wav")}
    response = client.post("/quran/is-quran", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "is_quran" in data
    assert "label" in data
