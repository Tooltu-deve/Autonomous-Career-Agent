"""Pydantic models dùng chung giữa các service.

Bám theo spec `docs/superpowers/specs/2026-07-18-cv-editor-pdf-latex-design.md`
và schema `infra/init-db/01_schema.sql`.
"""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

# Phiên bản format cho message qua RabbitMQ. Mọi message mang `schema_version`
# để consumer rẽ nhánh parse khi format đổi (xem API_CONTRACT.md phần B).
SCHEMA_VERSION = 1

# ---- Enum-like literals (khớp ENUM trong Postgres) ----
JobSource = Literal["linkedin", "indeed", "manual"]
JobStatus = Literal["active", "expired", "closed"]
TemplateName = Literal["classic", "modern", "academic"]

# Trạng thái orchestration dùng chung xuyên service (khớp ENUM trong
# infra/init-db/01_schema.sql). Khai báo tập trung ở đây để mọi service
# import cùng một nguồn, tránh gõ literal lệch nhau (drift).
GenerationStatus = Literal[
    "saved",
    "cv_queued",
    "cv_generating",
    "cv_generated",
    "ats_scoring",
    "completed",
    "needs_review",
    "failed",
]
PipelineStage = Literal["saved", "applied", "interview", "offer", "rejected"]
CvEditStatus = Literal["draft", "edited"]


class Job(BaseModel):
    """Một job cào được từ LinkedIn/Indeed (hoặc nhập tay)."""

    id: Optional[str] = None
    source: JobSource
    external_job_id: Optional[str] = None  # id trên LinkedIn/Indeed
    title: str
    company: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    seniority_level: Optional[str] = None
    url: Optional[str] = None
    description: str  # job description (JD)
    posted_at: Optional[datetime] = None
    scraped_at: Optional[datetime] = None
    status: JobStatus = "active"
    expires_at: Optional[datetime] = None
    raw_data: Optional[dict] = None  # payload gốc lúc scrape


# ---- Item lồng dùng chung cho cả profile (RAG input) và CV content ----
class ExperienceItem(BaseModel):
    """Một mục kinh nghiệm (dùng trong profile lẫn CV)."""

    title: str
    organization: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None  # None = hiện tại
    description: Optional[str] = None


class EducationItem(BaseModel):
    """Một mục học vấn (dùng trong profile lẫn CV)."""

    school: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class CertificationItem(BaseModel):
    """Một chứng chỉ (dùng trong profile lẫn CV). Cả hai field bắt buộc."""

    title: str
    obtain_date: date


class ProfileData(BaseModel):
    """Hồ sơ user dạng JSON dùng cho RAG khi sinh CV."""

    user_id: str
    full_name: str
    email: str
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    preferred_template: TemplateName = "classic"
    skills: list[str] = []
    experience: list[ExperienceItem] = []
    education: list[EducationItem] = []
    certifications: list[CertificationItem] = []


class CvRequest(BaseModel):
    """Message của queue `cv.requested` (scraper -> cv-agent, có retry)."""

    schema_version: int = SCHEMA_VERSION
    user_id: str
    job_id: str
    attempt: int = 1
    feedback: Optional[str] = None  # weaknesses/advice cho lần sinh lại


# ---- CV content: schema lồng, validate ở PUT /cvs và pdf-service ----
# Trong CV, mô tả là DANH SÁCH gạch đầu dòng (khác profile — nơi user gõ tự do
# thành một đoạn). Nhờ vậy template render được \begin{itemize}, đọc như CV thật
# thay vì một khối văn bản.


def _as_bullets(value: object) -> object:
    """Nhận list giữ nguyên; nhận chuỗi thì tách thành từng bullet.

    CV sinh trước thay đổi này lưu `description` dạng chuỗi có "\\n- ", nên
    cv_json cũ trong DB vẫn đọc được (CV Editor và export PDF không vỡ).
    """
    if value is None:
        return []
    if isinstance(value, str):
        lines = (ln.strip().lstrip("-•*").strip() for ln in value.splitlines())
        return [ln for ln in lines if ln]
    return value


class CvExperienceItem(BaseModel):
    """Một mục kinh nghiệm trong CV — mô tả là các bullet."""

    title: str
    organization: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None  # None = hiện tại
    description: list[str] = []

    _split_description = field_validator("description", mode="before")(_as_bullets)


class CvEducationItem(BaseModel):
    """Một mục học vấn trong CV — mô tả là các bullet."""

    school: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: list[str] = []

    _split_description = field_validator("description", mode="before")(_as_bullets)


class SkillGroup(BaseModel):
    """Một nhóm kỹ năng trong CV — nhãn nhóm + các kỹ năng thuộc nhóm.

    LLM tự đặt tên nhóm theo chuẩn ngành của JD; user sửa lại được ở CV Editor.
    Template render thành bảng 2 cột (nhãn | kỹ năng) thay vì một dòng phẳng.
    """

    category: str
    skills: list[str] = []


class CVContent(BaseModel):
    """Cấu trúc `cv_json` — nội dung CV chảy xuyên suốt pipeline."""

    summary: str
    experience: list[CvExperienceItem] = []
    education: list[CvEducationItem] = []
    certifications: list[CertificationItem] = []
    skill_groups: list[SkillGroup] = []

    @model_validator(mode="before")
    @classmethod
    def _migrate_flat_skills(cls, data: object) -> object:
        """cv_json CŨ lưu `skills: list[str]` -> gộp thành một nhóm "Skills".

        `GET /cvs/{id}` validate lại mọi bản ghi cũ trong Postgres qua model
        này, nên CV sinh trước thay đổi này vẫn phải đọc và export được — cùng
        lý do với `_as_bullets` ở trên.

        Dữ liệu rác (chuỗi, list không phải chuỗi) để nguyên -> `skill_groups`
        rỗng chứ KHÔNG raise: một bản ghi cũ hỏng không được làm 500 cả API.
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


class GeneratedCV(BaseModel):
    """Một bản CV do cv-agent (RAG) sinh ra — khớp bảng `cv_generations`
    và response `GET /cvs/{id}`. Khoá theo `application_id` (1:1)."""

    id: Optional[str] = None
    application_id: str
    content: CVContent  # = cv_json
    edit_status: CvEditStatus = "draft"
    model_used: str
    generated_at: Optional[datetime] = None


class CvGenerated(BaseModel):
    """Message của queue `cv.generated` (cv-agent -> ats-agent).

    Chỉ mang con trỏ tới bản CV; ats-agent tra `cv_generations` theo id này.
    """

    schema_version: int = SCHEMA_VERSION
    cv_generation_id: str


# ---- ATS report (khớp bảng ats_reports) ----
class Recommendation(BaseModel):
    """Một khuyến nghị cải thiện CV do ats-agent sinh ra."""

    type: str
    title: str
    body: str


class ATSReport(BaseModel):
    """Kết quả đánh giá của ats-agent (chấm điểm + cover letter)."""

    overall_score: int = Field(ge=0, le=100)
    score_breakdown: dict  # keywords/skills/experience/formatting
    matched_keywords: list[str] = []
    missing_keywords: list[str] = []
    recommendations: list[Recommendation] = []
    cover_letter_text: str
    model_used: str
