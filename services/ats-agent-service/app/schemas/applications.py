"""Pydantic response cho API /applications — khớp API_CONTRACT §A5.

Report đọc gộp qua GET /applications/{id} (application + cv + ats_report
trong một call) — không có endpoint /reports riêng.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from libs.schemas.models import (
    CvEditStatus,
    GenerationStatus,
    PipelineStage,
    Recommendation,
)


class CvGenerationOut(BaseModel):
    """Bản CV lồng trong detail (không kèm application_id — đã ở ngoài)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cv_json: dict
    edit_status: CvEditStatus
    model_used: str
    generated_at: datetime


class AtsReportOut(BaseModel):
    """Report ATS lồng trong detail — khớp bảng ats_reports."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    overall_score: int
    score_breakdown: dict
    matched_keywords: list[str]
    missing_keywords: list[str]
    recommendations: list[Recommendation]
    cover_letter_text: str
    model_used: str
    generated_at: datetime


class ApplicationListItem(BaseModel):
    """Một dòng trong danh sách application (rút gọn, kèm điểm nếu có)."""

    id: uuid.UUID
    job_id: uuid.UUID
    job_title: str
    company: str
    generation_status: GenerationStatus
    pipeline_stage: PipelineStage
    overall_score: int | None = None
    created_at: datetime


class ApplicationListResponse(BaseModel):
    """Response GET /applications — phân trang."""

    items: list[ApplicationListItem]
    page: int
    limit: int
    total: int


class ApplicationDetail(BaseModel):
    """Response GET /applications/{id} — gộp application + cv + report."""

    id: uuid.UUID
    user_id: uuid.UUID
    job_id: uuid.UUID
    generation_status: GenerationStatus
    pipeline_stage: PipelineStage
    cv_generation: CvGenerationOut | None = None
    ats_report: AtsReportOut | None = None
    created_at: datetime
