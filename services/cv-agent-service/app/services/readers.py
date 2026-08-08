"""Đọc profile (theo user_id) + job (theo job_id) từ Postgres — thay cho RAG.

cv-agent chỉ ĐỌC hai bảng này (owned bởi profile/scraper). Trả dữ liệu thô,
việc ghép thành prompt để cv_agent lo (File 7).
"""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.job import JobORM
from app.models.profile import ProfileORM


def _iso(value: date | None) -> str | None:
    """date -> chuỗi ISO (để json.dumps được); None giữ nguyên."""
    return value.isoformat() if value else None


def read_profile(db: Session, user_id: uuid.UUID) -> dict | None:
    """Đọc profile của user thành dict cho prompt. None nếu chưa có profile."""
    profile = db.scalar(select(ProfileORM).where(ProfileORM.user_id == user_id))
    if profile is None:
        return None
    return {
        "headline": profile.headline,
        "summary": profile.summary,
        "experiences": [
            {
                "title": e.title,
                "organization": e.organization,
                "start_date": _iso(e.start_date),
                "end_date": _iso(e.end_date),
                "description": e.description,
            }
            for e in profile.experiences
        ],
        "educations": [
            {
                "school": e.school,
                "degree": e.degree,
                "field_of_study": e.field_of_study,
                "start_date": _iso(e.start_date),
                "end_date": _iso(e.end_date),
                "description": e.description,
            }
            for e in profile.educations
        ],
        "certifications": [
            {"title": c.title, "obtain_date": _iso(c.obtain_date)}
            for c in profile.certifications
        ],
        "skills": [s.skill_name for s in profile.skills],
    }


def read_job(db: Session, job_id: uuid.UUID) -> JobORM | None:
    """Đọc job (để lấy JD) theo id. None nếu không tồn tại."""
    return db.get(JobORM, job_id)
