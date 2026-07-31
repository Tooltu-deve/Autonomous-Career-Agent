"""Route pdf-service — mỏng: validate, render → compile, stream PDF.

Xem docs/API_CONTRACT.md §A7. template ngoài whitelist → Pydantic trả 422
(Literal); jinja2 không thấy template → 400; compile LaTeX lỗi/treo → 422.
"""

from fastapi import APIRouter, HTTPException, Response, status
from jinja2 import TemplateNotFound

from app.schemas.pdf import ExportRequest
from app.services import compiler, renderer

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/export")
def export_pdf(data: ExportRequest) -> Response:
    try:
        tex = renderer.render(data.template, data.cv_data, data.header.model_dump())
    except TemplateNotFound:
        # whitelist đã chặn ở Pydantic; đây là phòng khi thiếu file template.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template không tồn tại: {data.template}",
        )

    try:
        pdf_bytes = compiler.compile_pdf(tex)
    except compiler.CompileError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Xuất PDF thất bại: {exc}",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="cv.pdf"'},
    )
