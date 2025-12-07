from typing import Any, Dict, List, Literal

from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.audio_calibration import calibrate_from_samples
from app.services.audio_enhance import enhance_audio, enhance_audio_to_wav_bytes
from app.services.audio_enhance_pro import enhance_audio_pro_to_wav_bytes
from app.services.audio_enhance_adaptive import enhance_audio_adaptive_to_wav_bytes
from app.services.audio_noise_profile import build_noise_profile_from_bytes
from app.services.audio_profile import build_audio_profile_from_bytes
from app.utils.logging import get_logger


logger = get_logger(__name__)
router = APIRouter()


class AudioEnhanceMetrics(BaseModel):
    sample_rate: int
    duration_sec: float
    rms_before: float
    rms_after: float
    peak_before: float
    peak_after: float
    snr_before_db: float
    snr_after_db: float
    clipping_ratio: float


class AudioEnhanceResponse(BaseModel):
    metrics: AudioEnhanceMetrics
    status: Literal["ok"]


class AudioProfile(BaseModel):
    rms: float | None = None
    brightness_hz: float | None = None
    low_band_energy: float | None = None
    high_band_energy: float | None = None
    sibilance_index: float | None = None
    dynamic_range_db: float | None = None


class NoiseProfile(BaseModel):
    noise_rms: float | None = None
    low_band: float | None = None
    mid_band: float | None = None
    high_band: float | None = None


class CalibrationResult(BaseModel):
    voice_profile: Dict[str, float]
    noise_profile: Dict[str, float] = Field(default_factory=dict)
    recommended_params: Dict[str, float]


@router.post("/enhance", response_model=AudioEnhanceResponse)
def enhance(file: UploadFile = File(...)) -> AudioEnhanceResponse:
    try:
        raw_bytes = file.file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    metrics = enhance_audio(raw_bytes)
    return AudioEnhanceResponse(metrics=metrics, status="ok")


@router.post("/enhance-file")
async def enhance_file(file: UploadFile = File(...)) -> StreamingResponse:
    """Studio mode: return enhanced audio as 16-bit PCM WAV.

    - Accept an audio file (mp3/wav/etc.)
    - Run normalization + light enhancement
    - Return a WAV file as the HTTP response
    """

    try:
        raw_bytes = await file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for enhance-file")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    wav_bytes = enhance_audio_to_wav_bytes(raw_bytes)

    return StreamingResponse(
        BytesIO(wav_bytes),
        media_type="audio/wav",
        headers={
            "Content-Disposition": 'attachment; filename="enhanced.wav"',
        },
    )


@router.post("/enhance-pro")
async def enhance_pro_file(file: UploadFile = File(...)) -> StreamingResponse:
    """Tilawa Studio Pro: advanced chain (EQ + de-esser + compression + limiter).

    - Accept an audio file (mp3/wav/etc.).
    - Run an advanced but conservative voice chain.
    - Return a polished 16-bit PCM WAV suitable for high-quality listening.
    """

    try:
        raw_bytes = await file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for enhance-pro")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    wav_bytes = enhance_audio_pro_to_wav_bytes(raw_bytes)

    return StreamingResponse(
        BytesIO(wav_bytes),
        media_type="audio/wav",
        headers={
            "Content-Disposition": 'attachment; filename="enhanced_pro.wav"',
        },
    )


@router.post("/enhance-adaptive")
async def enhance_adaptive_file(file: UploadFile = File(...)) -> StreamingResponse:
    """Tilawa Adaptive Studio:

    - Accept an audio file.
    - Analyze the user's voice and adapt the chain (EQ/compression/de-esser).
    - Return a personalized 16-bit PCM WAV.
    """

    try:
        raw_bytes = await file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for enhance-adaptive")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    wav_bytes = enhance_audio_adaptive_to_wav_bytes(raw_bytes)

    return StreamingResponse(
        BytesIO(wav_bytes),
        media_type="audio/wav",
        headers={
            "Content-Disposition": 'attachment; filename="enhanced_adaptive.wav"',
        },
    )


@router.post("/profile", response_model=Dict[str, float])
async def audio_profile(file: UploadFile = File(...)) -> Dict[str, float]:
    """Compute a basic audio profile (voice) for a single file."""

    try:
        raw = await file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for /audio/profile")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    profile = build_audio_profile_from_bytes(raw)
    return profile


@router.post("/noise-profile", response_model=Dict[str, float])
async def audio_noise_profile(file: UploadFile = File(...)) -> Dict[str, float]:
    """Compute a basic noise profile from a 'silence' recording (room noise)."""

    try:
        raw = await file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio file for /audio/noise-profile")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file") from exc

    profile = build_noise_profile_from_bytes(raw)
    return profile


@router.post("/calibrate", response_model=CalibrationResult)
async def audio_calibrate(
    files: List[UploadFile] = File(..., description="Recitation samples"),
    noise_file: UploadFile | None = File(None, description="Optional noise/silence sample"),
) -> CalibrationResult:
    """Calibrate a user audio profile from recitation + optional noise file."""

    recitation_bytes: List[bytes] = []
    for f in files:
        try:
            recitation_bytes.append(await f.read())
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Failed to read recitation sample in /audio/calibrate", exc_info=exc)

    noise_bytes: bytes | None = None
    if noise_file is not None:
        try:
            noise_bytes = await noise_file.read()
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Failed to read noise sample in /audio/calibrate", exc_info=exc)

    result = calibrate_from_samples(recitation_bytes, noise_bytes)
    return CalibrationResult(**result)


@router.post("/enhance-adaptive-with-noise")
async def enhance_adaptive_with_noise(
    file: UploadFile = File(...),
    noise_file: UploadFile = File(...),
) -> StreamingResponse:
    """Adaptive enhancement using a provided noise profile.

    - noise_file is used to build a noise_profile.
    - file is enhanced with voice+noise adaptive chain.
    """

    try:
        raw = await file.read()
        noise_raw = await noise_file.read()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to read uploaded audio files for enhance-adaptive-with-noise")
        raise HTTPException(status_code=400, detail="Failed to read uploaded files") from exc

    noise_profile = build_noise_profile_from_bytes(noise_raw)
    wav_bytes = enhance_audio_adaptive_to_wav_bytes(raw, noise_profile=noise_profile)

    return StreamingResponse(
        BytesIO(wav_bytes),
        media_type="audio/wav",
        headers={
            "Content-Disposition": 'attachment; filename="enhanced_adaptive_noise.wav"',
        },
    )
