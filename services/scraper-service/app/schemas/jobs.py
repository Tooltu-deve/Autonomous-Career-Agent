"""Pydantic schemas cho scraper-service (request/response, khớp API_CONTRACT.md A4)."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from libs.schemas.models import JobSource, JobStatus

# ---- Request schemas ----


class JobSearchRequest(BaseModel):
    """Body của POST /jobs/search.

    Frontend lấy từ profile_preferences và truyền vào; scraper không đọc DB profile.
    Khớp API_CONTRACT.md A4 — chỉ có target_role + preferred_locations.
    """

    target_role: str = Field(..., min_length=1, examples=["Backend Engineer"])
    preferred_locations: list[str] = Field(
        default=["Ho Chi Minh City"], examples=[["Ho Chi Minh City", "Remote"]]
    )


class JobSelectRequest(BaseModel):
    """Body của POST /jobs/select."""

    job_ids: list[UUID] = Field(
        ..., min_length=1, description="Danh sách job_id user muốn tạo CV"
    )


# ---- Response schemas ----


class JobOut(BaseModel):
    """Một job trả ra API — khớp API_CONTRACT.md A4 GET /jobs."""

    id: UUID
    source: JobSource
    external_job_id: Optional[str] = None
    title: str
    company: str
    location: Optional[str] = None
    url: Optional[str] = None
    description: str
    posted_at: Optional[datetime] = None
    scraped_at: Optional[datetime] = None
    status: JobStatus
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    """Phân trang danh sách jobs — khớp API_CONTRACT.md GET /jobs."""

    items: list[JobOut]
    page: int
    limit: int
    total: int


class ApplicationOut(BaseModel):
    """Application row trả ra sau khi select job — dùng trong SelectResponse."""

    id: UUID
    job_id: UUID
    generation_status: str

    model_config = {"from_attributes": True}


class SelectResponse(BaseModel):
    """Response của POST /jobs/select (202 Accepted)."""

    applications: list[ApplicationOut]


# ---- Dev/test only schemas ----


class JobPreviewItem(BaseModel):
    """Một job raw đã normalize, không có DB id (dùng cho /jobs/preview).

    Fields khớp API_CONTRACT.md A4 GET /jobs, trừ `id` (chưa lưu DB).
    `raw_data` là nội bộ — không trả ra API (contract line 250).
    """

    source: str
    external_job_id: Optional[str] = None
    title: str
    company: str
    location: Optional[str] = None
    url: Optional[str] = None
    description: str
    posted_at: Optional[datetime] = None
    scraped_at: Optional[datetime] = None
    status: str = "active"  # mặc định active (chưa lưu DB)
    expires_at: Optional[datetime] = None


class JobPreviewResponse(BaseModel):
    """Response của POST /jobs/preview."""

    indeed_count: int
    linkedin_count: int
    total: int
    items: list[JobPreviewItem]
