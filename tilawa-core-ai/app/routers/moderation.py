from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.classifier import classify_content
from app.utils.logging import get_logger


logger = get_logger(__name__)
router = APIRouter()


class ContentClassifyResponse(BaseModel):
    label: str
    confidence: float


@router.post("/classify", response_model=ContentClassifyResponse)
def classify(file: UploadFile = File(...)) -> ContentClassifyResponse:
    try:
        raw_bytes = file.file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for content classification")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    result = classify_content(raw_bytes)
    return ContentClassifyResponse(**result)
