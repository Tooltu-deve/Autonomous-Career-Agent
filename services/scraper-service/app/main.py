"""scraper-service — FastAPI entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.api.jobs import router as jobs_router
from app.core.database import engine
from libs.common.logging import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    """Kiểm tra kết nối DB khi startup."""
    try:
        with engine.connect():
            logger.info("scraper-service: kết nối DB thành công.")
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "scraper-service: không kết nối được DB (%s). Tiếp tục chạy.", exc
        )
    yield


app = FastAPI(title="scraper-service", lifespan=lifespan)

app.include_router(jobs_router)


@app.get("/health")
def health() -> dict:
    """Health check endpoint — bắt buộc theo CODING_CONVENTION.md."""
    return {"status": "ok", "service": "scraper-service"}
