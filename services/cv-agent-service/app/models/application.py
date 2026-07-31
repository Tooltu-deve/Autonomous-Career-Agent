"""ORM bảng `applications` — bảng orchestration DÙNG CHUNG.

cv-agent ĐỌC (tìm application theo user_id+job_id, lấy attempt) và GHI cột
`generation_status` khi CV đi qua pipeline. Đây là ngoại lệ single-writer có
chủ đích (xem ARCHITECTURE.md) — cv-agent KHÔNG ghi cột nào khác.
"""

import uuid

from sqlalchemy import Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ApplicationORM(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True))
    job_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True))
    generation_status: Mapped[str] = mapped_column(String)
    attempt: Mapped[int] = mapped_column(Integer)
