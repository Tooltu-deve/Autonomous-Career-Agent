"""ats-agent-service — FastAPI app + consumer nền (cv.generated)."""

import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.applications import router as applications_router
from app.services import consumer


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Spawn consumer trong daemon thread: nghe cv.generated song song với API.
    thread = threading.Thread(target=consumer.run, daemon=True)
    thread.start()
    yield
    # daemon thread tự chết khi process dừng — không cần join.


app = FastAPI(title="ats-agent-service", lifespan=lifespan)
app.include_router(applications_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ats-agent-service"}
