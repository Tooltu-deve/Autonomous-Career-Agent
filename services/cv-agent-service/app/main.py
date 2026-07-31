"""cv-agent-service — FastAPI app + consumer nền (cv.requested)."""

import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.cvs import router as cvs_router
from app.services import consumer


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Spawn consumer trong daemon thread: nghe cv.requested song song với API.
    thread = threading.Thread(target=consumer.run, daemon=True)
    thread.start()
    yield
    # daemon thread tự chết khi process dừng — không cần join.


app = FastAPI(title="cv-agent-service", lifespan=lifespan)
app.include_router(cvs_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "cv-agent-service"}
