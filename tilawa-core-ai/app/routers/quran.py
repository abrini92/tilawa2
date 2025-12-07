from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.quran_align import align_quran, align_quran_text
from app.services.quran_classify import summarize_alignment_result
from app.utils.logging import get_logger


logger = get_logger(__name__)
router = APIRouter()


class AlignedVerse(BaseModel):
    surah: int
    ayah: int
    confidence: float


class QuranTextAlignMatch(BaseModel):
    surah: int
    ayah: int
    confidence: float


class QuranSequenceItem(BaseModel):
    surah: int
    ayah: int
    confidence: float
    accuracy: float
    error_flag: bool
    missing_words: List[str]
    extra_words: List[str]


class QuranErrorItem(BaseModel):
    surah: int
    ayah: int
    type: str
    details: str


class QuranAlignResponse(BaseModel):
    verses: List[AlignedVerse]
    integrity_score: int
    flags: List[str]
    matches: List[QuranTextAlignMatch]
    transcript: str | None = None
    sequence: List[QuranSequenceItem] = Field(default_factory=list)
    global_accuracy: float | None = None
    errors: List[QuranErrorItem] = Field(default_factory=list)
    is_quran_like: bool | None = None
    timeline: List["QuranTimelineItem"] = Field(default_factory=list)


class QuranTextAlignRequest(BaseModel):
    transcript: str


class QuranTextAlignResponse(BaseModel):
    transcript: str
    matches: List[QuranTextAlignMatch]
    sequence: List[QuranSequenceItem] = Field(default_factory=list)
    global_accuracy: float | None = None
    errors: List[QuranErrorItem] = Field(default_factory=list)
    is_quran_like: bool | None = None


class QuranTimelineItem(BaseModel):
    surah: int
    ayah: int
    start: float
    end: float


class QuranClassificationResponse(BaseModel):
    is_quran: bool
    label: str
    quran_confidence: float
    main_surah: int | None = None
    ayah_start: int | None = None
    ayah_end: int | None = None
    recitation_accuracy: float | None = None
    issues_count: int
    issues: List[QuranErrorItem] = Field(default_factory=list)


@router.post("/align", response_model=QuranAlignResponse)
def align(file: UploadFile = File(...)) -> QuranAlignResponse:
    try:
        raw_bytes = file.file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for Qur'an alignment")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    result = align_quran(raw_bytes)
    return QuranAlignResponse(**result)


@router.post("/align-text", response_model=QuranTextAlignResponse)
async def align_text(req: QuranTextAlignRequest) -> QuranTextAlignResponse:
    result = align_quran_text(req.transcript)
    return QuranTextAlignResponse(**result)


@router.post("/is-quran-text", response_model=QuranClassificationResponse)
async def is_quran_text(req: QuranTextAlignRequest) -> QuranClassificationResponse:
    """High-level classification for a raw Arabic transcript."""

    alignment = align_quran_text(req.transcript)
    summary = summarize_alignment_result(alignment)
    return QuranClassificationResponse(**summary)


@router.post("/is-quran", response_model=QuranClassificationResponse)
async def is_quran_audio(file: UploadFile = File(...)) -> QuranClassificationResponse:
    """High-level classification for an audio recitation.

    Runs ASR + alignment internally and returns a Qur'an / not-Qur'an verdict
    together with coarse feedback.
    """

    raw_bytes = await file.read()
    alignment = align_quran(raw_bytes)
    summary = summarize_alignment_result(alignment)
    return QuranClassificationResponse(**summary)
