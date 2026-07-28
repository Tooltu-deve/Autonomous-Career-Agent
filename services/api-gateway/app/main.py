"""api-gateway — FastAPI reverse proxy."""

from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

from app.api.proxy import router as proxy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.http_client.aclose()


app = FastAPI(title="api-gateway", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}


app.include_router(proxy_router)
