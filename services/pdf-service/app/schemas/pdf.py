"""Pydantic request cho pdf-service — khớp docs/API_CONTRACT.md §A7."""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel

# Whitelist template — chống path injection (chỉ 3 tên hợp lệ, khớp tên file .tex.j2).
TemplateName = Literal["classic", "modern", "academic"]


# ---- cv_data: mirror libs.schemas.models.CVContent (pdf-service tách khỏi libs) ----
# Validate lại cv_data (spec §7): cấu trúc sai -> 422, không để lọt vào template
# gây lỗi render (500) hay render ra "None".
class ExperienceItem(BaseModel):
    title: str
    organization: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class EducationItem(BaseModel):
    school: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class CvData(BaseModel):
    summary: str
    experience: list[ExperienceItem] = []
    education: list[EducationItem] = []
    skills: list[str] = []


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
    cv_data: CvData  # validate cấu trúc CV -> sai schema trả 422
    header: PdfHeader = PdfHeader()  # mặc định rỗng nếu FE không gửi
