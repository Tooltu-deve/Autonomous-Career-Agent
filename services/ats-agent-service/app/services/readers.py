"""Đọc cv_generations / applications / jobs — các bảng ats-agent KHÔNG sở hữu."""

import uuid

from sqlalchemy.orm import Session

from app.models.application import ApplicationORM
from app.models.cv import CvGenerationORM
from app.models.job import JobORM


def read_cv(db: Session, cv_generation_id: uuid.UUID) -> CvGenerationORM | None:
    """Đọc bản CV theo id trong message cv.generated. None nếu không tồn tại."""
    return db.get(CvGenerationORM, cv_generation_id)


def read_application(db: Session, application_id: uuid.UUID) -> ApplicationORM | None:
    """Đọc application (anchor row) theo id. None nếu không tồn tại."""
    return db.get(ApplicationORM, application_id)


def read_job(db: Session, job_id: uuid.UUID) -> JobORM | None:
    """Đọc job (để lấy JD) theo id. None nếu không tồn tại."""
    return db.get(JobORM, job_id)
