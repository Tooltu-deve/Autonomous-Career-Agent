"""auth-service — FastAPI service."""

from fastapi import FastAPI

from app.api.auth import router as auth_router

app = FastAPI(title="auth-service")
app.include_router(auth_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "auth-service"}
