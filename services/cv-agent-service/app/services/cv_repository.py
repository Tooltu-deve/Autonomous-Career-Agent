"""Tầng truy cập DB cho cv-agent: application status + cv_generations (CRUD).

Gom mọi thao tác GHI vào một chỗ: consumer (File 8) và API (File 9) đều gọi
qua đây thay vì tự viết query. cv-agent chỉ GHI `cv_generations` (sở hữu) và
cột `applications.generation_status` (ngoại lệ orchestration).
"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import ApplicationORM
from app.models.cv import CvGenerationORM
from libs.schemas.models import GenerationStatus


def get_application(
    db: Session, user_id: uuid.UUID, job_id: uuid.UUID
) -> ApplicationORM | None:
    """Tìm application theo cặp (user_id, job_id) — message chỉ mang 2 field này."""
    return db.scalar(
        select(ApplicationORM).where(
            ApplicationORM.user_id == user_id,
            ApplicationORM.job_id == job_id,
        )
    )


def set_generation_status(
    db: Session, application: ApplicationORM, status: GenerationStatus
) -> None:
    """Cập nhật generation_status của application (ngoại lệ single-writer)."""
    application.generation_status = status
    db.commit()


def upsert_cv_generation(
    db: Session, application_id: uuid.UUID, cv_json: dict, model_used: str
) -> CvGenerationORM:
    """Ghi CV cho application (1:1). Đã có -> ghi đè (retry); chưa -> tạo mới."""
    cv = db.scalar(
        select(CvGenerationORM).where(CvGenerationORM.application_id == application_id)
    )
    if cv is None:
        cv = CvGenerationORM(application_id=application_id)
        db.add(cv)
    cv.cv_json = cv_json
    cv.model_used = model_used
    cv.edit_status = "draft"  # retry sinh lại -> quay về draft
    db.commit()
    db.refresh(cv)
    return cv


def get_cv(db: Session, cv_id: uuid.UUID) -> CvGenerationORM | None:
    """Đọc CV theo id (dùng cho GET /cvs)."""
    return db.get(CvGenerationORM, cv_id)


def update_cv(db: Session, cv: CvGenerationORM, cv_json: dict) -> CvGenerationORM:
    """User sửa CV (PUT /cvs) -> ghi cv_json mới + đánh dấu edited."""
    cv.cv_json = cv_json
    cv.edit_status = "edited"
    db.commit()
    db.refresh(cv)
    return cv
