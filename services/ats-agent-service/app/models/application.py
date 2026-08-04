"""ORM bảng `applications` — bảng orchestration DÙNG CHUNG.

ats-agent ĐỌC (tra application từ cv_generation, lấy attempt) và GHI hai cột
`generation_status` + `attempt` khi quyết định PASS/FAIL/NEEDS_REVIEW. Đây là
ngoại lệ single-writer có chủ đích (xem ARCHITECTURE.md).
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ApplicationORM(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True))
    job_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True))
    generation_status: Mapped[str] = mapped_column(
        Enum(
            "saved",
            "cv_queued",
            "cv_generating",
            "cv_generated",
            "ats_scoring",
            "completed",
            "needs_review",
            "failed",
            name="generation_status",
        )
    )
    pipeline_stage: Mapped[str] = mapped_column(
        Enum(
            "saved",
            "applied",
            "interview",
            "offer",
            "rejected",
            name="pipeline_stage",
        ),
        default="saved",
    )
    attempt: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
