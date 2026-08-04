"""SQLAlchemy model cho bảng `user_jobs` — owned by scraper-service.

Cá nhân hoá Job Radar: (user_id, job_id) = job xuất hiện trên radar của user
(do lần POST /jobs/search của user đó tìm ra). `jobs` vẫn là kho chung.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class UserJobDB(Base):
    """Map bảng `user_jobs` trong Postgres (khớp infra/init-db/01_schema.sql)."""

    __tablename__ = "user_jobs"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
