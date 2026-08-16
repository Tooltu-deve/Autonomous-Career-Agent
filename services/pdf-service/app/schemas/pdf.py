"""Pydantic request cho pdf-service — khớp docs/API_CONTRACT.md §A7."""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, field_validator, model_validator

# Whitelist template — chống path injection (chỉ 3 tên hợp lệ, khớp tên file .tex.j2).
TemplateName = Literal["classic", "modern", "academic"]


# ---- cv_data: mirror libs.schemas.models.CVContent (pdf-service tách khỏi libs) ----
# Validate lại cv_data (spec §7): cấu trúc sai -> 422, không để lọt vào template
# gây lỗi render (500) hay render ra "None".
def _as_bullets(value: object) -> object:
    """Nhận list giữ nguyên; chuỗi thì tách thành bullet (cv_json cũ vẫn render)."""
    if value is None:
        return []
    if isinstance(value, str):
        lines = (ln.strip().lstrip("-•*").strip() for ln in value.splitlines())
        return [ln for ln in lines if ln]
    return value


class ExperienceItem(BaseModel):
    title: str
    organization: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: list[str] = []

    _split_description = field_validator("description", mode="before")(_as_bullets)


class EducationItem(BaseModel):
    school: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: list[str] = []

    _split_description = field_validator("description", mode="before")(_as_bullets)


class CertificationItem(BaseModel):
    title: str
    obtain_date: date


class SkillGroup(BaseModel):
    """Nhãn nhóm + kỹ năng thuộc nhóm — template render thành bảng 2 cột."""

    category: str
    skills: list[str] = []


class CvData(BaseModel):
    summary: str
    experience: list[ExperienceItem] = []
    education: list[EducationItem] = []
    certifications: list[CertificationItem] = []
    skill_groups: list[SkillGroup] = []

    @model_validator(mode="before")
    @classmethod
    def _migrate_flat_skills(cls, data: object) -> object:
        """cv_json cũ (`skills: list[str]`) -> gộp thành một nhóm "Skills".

        CV sinh trước khi có nhóm vẫn export PDF được. Dữ liệu rác để nguyên ->
        `skill_groups` rỗng, không raise.
        """
        if not isinstance(data, dict) or data.get("skill_groups"):
            return data
        flat = data.get("skills")
        if isinstance(flat, list) and all(isinstance(s, str) for s in flat):
            names = [s.strip() for s in flat if s.strip()]
            if names:
                return {
                    **data,
                    "skill_groups": [{"category": "Skills", "skills": names}],
                }
        return data


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
