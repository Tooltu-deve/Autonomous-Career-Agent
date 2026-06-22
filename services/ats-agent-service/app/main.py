"""ats-agent-service — FastAPI service."""
from fastapi import FastAPI

app = FastAPI(title="ats-agent-service")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ats-agent-service"}
