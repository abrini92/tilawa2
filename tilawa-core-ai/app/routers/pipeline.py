from fastapi import APIRouter, File, UploadFile

from app.services.audio_enhance import enhance_audio
from app.services.quran_align import align_quran
from app.services.voice_embedding import extract_embedding
from app.services.quality_scoring import compute_quality_score


router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/full")
async def full_pipeline(file: UploadFile = File(...)) -> dict:
    """End-to-end pipeline over a single uploaded audio file."""

    raw_bytes = await file.read()

    metrics = enhance_audio(raw_bytes)
    alignment = align_quran(raw_bytes)
    embedding = extract_embedding(raw_bytes)
    scores = compute_quality_score(raw_bytes)

    return {
        "audio_metrics": metrics,
        "quran_alignment": alignment,
        "voice_embedding": embedding,
        "quality_scores": scores,
    }
