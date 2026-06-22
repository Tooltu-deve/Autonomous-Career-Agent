"""profile-service — FastAPI service."""
from fastapi import FastAPI

app = FastAPI(title="profile-service")


@app.get("/health")
def health():
    return {"status": "ok", "service": "profile-service"}
