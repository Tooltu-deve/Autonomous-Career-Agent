"""Pydantic models dùng chung giữa các service.

Bám theo spec `docs/superpowers/specs/2026-07-18-cv-editor-pdf-latex-design.md`
và schema `infra/init-db/01_schema.sql`.
"""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

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


class CvRequest(BaseModel):
    """Message của queue `cv.requested` (scraper -> cv-agent, có retry)."""

    schema_version: int = SCHEMA_VERSION
    user_id: str
    job_id: str
    attempt: int = 1
    feedback: Optional[str] = None  # weaknesses/advice cho lần sinh lại


# ---- CV content: schema lồng, validate ở PUT /cvs và pdf-service ----
class CVContent(BaseModel):
    """Cấu trúc `cv_json` — nội dung CV chảy xuyên suốt pipeline."""

    summary: str
    experience: list[ExperienceItem] = []
    education: list[EducationItem] = []
    skills: list[str] = []


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
