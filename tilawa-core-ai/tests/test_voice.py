from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_voice_analyze() -> None:
    files = {"file": ("test.wav", b"2" * 2048, "audio/wav")}
    response = client.post("/voice/analyze", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "embedding" in data
    assert len(data["embedding"]) == 40
    assert "scores" in data
    assert 0 <= data["scores"]["clarity"] <= 1
    assert 0 <= data["scores"]["stability"] <= 1
    assert 0 <= data["scores"]["noise"] <= 1
    assert 0 <= data["scores"]["tilawa_score"] <= 100
