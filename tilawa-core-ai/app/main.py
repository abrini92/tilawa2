from fastapi import FastAPI, Response
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.routers import audio, quran, voice, moderation, pipeline
from app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    # Prometheus metrics instrumentation
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_env_var=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/health", "/metrics"],
        inprogress_name="tilawa_inprogress_requests",
        inprogress_labels=True,
    ).instrument(app)

    @app.get("/metrics", tags=["monitoring"])
    def metrics() -> Response:
        data = generate_latest()
        return Response(content=data, media_type=CONTENT_TYPE_LATEST)

    @app.get("/health", tags=["monitoring"])
    def health_check() -> dict:
        return {"status": "ok"}

    app.include_router(audio.router, prefix="/audio", tags=["audio"])
    app.include_router(quran.router, prefix="/quran", tags=["quran"])
    app.include_router(voice.router, prefix="/voice", tags=["voice"])
    app.include_router(moderation.router, prefix="/content", tags=["content"])
    app.include_router(pipeline.router)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
