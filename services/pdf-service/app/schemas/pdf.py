"""Pydantic request cho pdf-service — khớp docs/API_CONTRACT.md §A7."""

from typing import Literal, Optional

from pydantic import BaseModel

# Whitelist template — chống path injection (chỉ 3 tên hợp lệ, khớp tên file .tex.j2).
TemplateName = Literal["classic", "modern", "academic"]


class PdfHeader(BaseModel):
    """Thông tin cá nhân cho phần header CV — FE gộp từ GET /profile (+ user).

    Mọi field optional: profile mới có thể chưa điền github/linkedin; template
    render field nào có, bỏ field thiếu.
    """

    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class ExportRequest(BaseModel):
    template: TemplateName
    cv_data: dict
    header: PdfHeader = PdfHeader()  # mặc định rỗng nếu FE không gửi
