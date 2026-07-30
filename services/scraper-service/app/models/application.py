"""SQLAlchemy model cho bảng `applications` — bảng orchestration dùng chung."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class ApplicationDB(Base):
    """Map bảng `applications` trong Postgres (khớp infra/init-db/01_schema.sql).

    Lưu ý kiến trúc: đây là bảng orchestration dùng chung —
    scraper tạo row khi select job, cv-agent và ats-agent cập nhật
    `generation_status` khi pipeline chạy. Xem ARCHITECTURE.md.
    """

    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
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
        ),
        nullable=False,
        default="saved",
    )
    pipeline_stage: Mapped[str] = mapped_column(
        Enum(
            "saved", "applied", "interview", "offer", "rejected", name="pipeline_stage"
        ),
        nullable=False,
        default="saved",
    )
    attempt: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
