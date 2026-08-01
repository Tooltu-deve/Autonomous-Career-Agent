"""pdf-service — FastAPI service (render LaTeX → PDF, stateless)."""

from fastapi import FastAPI

from app.api.pdf import router as pdf_router

app = FastAPI(title="pdf-service")
app.include_router(pdf_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "pdf-service"}
