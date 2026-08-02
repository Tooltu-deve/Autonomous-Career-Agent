"""Fixtures dùng chung: DB SQLite in-memory + seed chuỗi job→application→cv."""

import uuid

import pytest
from app.core.db import Base
from app.models.application import ApplicationORM
from app.models.cv import CvGenerationORM
from app.models.job import JobORM
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

USER_ID = uuid.uuid4()
JOB_ID = uuid.uuid4()
APP_ID = uuid.uuid4()
CV_ID = uuid.uuid4()

CV_JSON = {
    "summary": "Backend engineer 3 năm",
    "experience": [{"title": "Dev", "organization": "ACME"}],
    "education": [],
    "skills": ["python"],
}


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    s = Session()
    try:
        yield s
    finally:
        s.close()


def seed_pipeline(db, *, attempt: int = 1, with_cv: bool = True) -> ApplicationORM:
    """Seed job + application (+ cv_generation) như trạng thái sau khi cv-agent chạy."""
    db.add(
        JobORM(
            id=JOB_ID,
            title="Backend Engineer",
            company="ACME",
            location="HCMC",
            description="Build Python APIs with FastAPI and Kubernetes",
        )
    )
    app_row = ApplicationORM(
        id=APP_ID,
        user_id=USER_ID,
        job_id=JOB_ID,
        generation_status="cv_generated",
        pipeline_stage="saved",
        attempt=attempt,
    )
    db.add(app_row)
    if with_cv:
        db.add(
            CvGenerationORM(
                id=CV_ID,
                application_id=APP_ID,
                cv_json=CV_JSON,
                edit_status="draft",
                model_used="claude-opus-4-8",
            )
        )
    db.commit()
    return app_row
