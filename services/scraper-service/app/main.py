"""scraper-service — FastAPI service."""
from fastapi import FastAPI

app = FastAPI(title="scraper-service")


@app.get("/health")
def health():
    return {"status": "ok", "service": "scraper-service"}
