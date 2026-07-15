"""api-gateway — FastAPI service."""

from fastapi import FastAPI

app = FastAPI(title="api-gateway")


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}
