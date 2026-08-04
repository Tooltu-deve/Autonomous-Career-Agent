"""api-gateway — FastAPI reverse proxy."""

from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.proxy import router as proxy_router
from libs.common.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=httpx.Timeout(5.0, read=120.0))
    yield
    await app.state.http_client.aclose()


app = FastAPI(title="api-gateway", lifespan=lifespan)

# Frontend (Next.js) gọi gateway từ browser ở origin khác → cần CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}


app.include_router(proxy_router)
