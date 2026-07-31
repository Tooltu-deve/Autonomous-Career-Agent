"""ORM model bảng `cv_generations` — owned by cv-agent-service.

Khớp infra/init-db/01_schema.sql. 1:1 với application (application_id UNIQUE):
retry ghi đè bản cũ, chỉ giữ CV mới nhất.
"""

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

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), unique=True, nullable=False
    )
    cv_json: Mapped[dict] = mapped_column(JsonType, nullable=False)
    edit_status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    model_used: Mapped[str] = mapped_column(String, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
