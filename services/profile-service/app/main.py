"""profile-service — FastAPI service."""

from fastapi import FastAPI

from app.api.profile import router as profile_router

app = FastAPI(title="profile-service")
app.include_router(profile_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "profile-service"}
