from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_content_classify() -> None:
    files = {"file": ("test.wav", b"3" * 512, "audio/wav")}
    response = client.post("/content/classify", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "label" in data
    assert "confidence" in data
    assert 0.0 <= data["confidence"] <= 1.0
