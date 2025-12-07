from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.voice_embedding import extract_embedding
from app.services.quality_scoring import compute_quality_score
from app.utils.logging import get_logger


logger = get_logger(__name__)
router = APIRouter()


class VoiceQualityScores(BaseModel):
    clarity: float
    stability: float
    noise: float
    tilawa_score: float


class VoiceAnalyzeResponse(BaseModel):
    embedding: List[float]
    scores: VoiceQualityScores


@router.post("/analyze", response_model=VoiceAnalyzeResponse)
def analyze(file: UploadFile = File(...)) -> VoiceAnalyzeResponse:
    try:
        raw_bytes = file.file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for voice analysis")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    embedding = extract_embedding(raw_bytes)
    scores = compute_quality_score(raw_bytes)

    return VoiceAnalyzeResponse(embedding=embedding, scores=VoiceQualityScores(**scores))
