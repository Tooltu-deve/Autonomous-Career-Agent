"""cv-agent-service — FastAPI service."""
from fastapi import FastAPI

app = FastAPI(title="cv-agent-service")


@app.get("/health")
def health():
    return {"status": "ok", "service": "cv-agent-service"}
