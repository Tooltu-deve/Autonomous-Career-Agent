"""ORM đọc bảng `cv_generations` (owned by cv-agent) — ats chỉ ĐỌC cv_json."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.core.db import Base

# JSONB trên Postgres; JSON thường trên SQLite (test) — cùng interface dict.
JsonType = JSONB().with_variant(JSON, "sqlite")


class CvGenerationORM(Base):
    __tablename__ = "cv_generations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    application_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), unique=True)
    cv_json: Mapped[dict] = mapped_column(JsonType, nullable=False)
    edit_status: Mapped[str] = mapped_column(String, default="draft")
    model_used: Mapped[str] = mapped_column(String, default="")
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
