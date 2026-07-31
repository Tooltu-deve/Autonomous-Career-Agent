"""Pydantic request/response cho API /cvs — khớp API_CONTRACT §A6.

cv_json dùng lại CVContent trong libs (nguồn schema duy nhất cho nội dung CV).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from libs.schemas.models import CVContent, CvEditStatus


class CvUpdateRequest(BaseModel):
    """Body PUT /cvs/{id} — user lưu CV đã chỉnh; validate theo CVContent."""

    cv_json: CVContent


class CvResponse(BaseModel):
    """Response GET /cvs/{id} — khớp bảng cv_generations."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    cv_json: CVContent
    edit_status: CvEditStatus
    model_used: str
    generated_at: datetime
