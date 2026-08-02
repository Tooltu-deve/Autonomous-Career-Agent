"""ORM bảng `ats_reports` — owned by ats-agent-service.

Khớp infra/init-db/01_schema.sql. 1:1 với cv_generation (cv_generation_id
UNIQUE): retry ghi đè report cũ, chỉ giữ bản mới nhất.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.core.db import Base

# JSONB / TEXT[] trên Postgres; JSON thường trên SQLite (test).
JsonType = JSONB().with_variant(JSON, "sqlite")
TextArray = ARRAY(String).with_variant(JSON, "sqlite")


class AtsReportORM(Base):
    __tablename__ = "ats_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cv_generation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), unique=True, nullable=False
    )
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    score_breakdown: Mapped[dict] = mapped_column(JsonType, nullable=False)
    matched_keywords: Mapped[list] = mapped_column(TextArray, nullable=False)
    missing_keywords: Mapped[list] = mapped_column(TextArray, nullable=False)
    recommendations: Mapped[list] = mapped_column(JsonType, nullable=False)
    cover_letter_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_used: Mapped[str] = mapped_column(String, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
