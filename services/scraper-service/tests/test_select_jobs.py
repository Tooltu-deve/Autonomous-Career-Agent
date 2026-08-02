"""Tests select_jobs (service-level, SQLite): tạo mới + reset trạng thái terminal.

Khoá fix bug "ngõ cụt needs_review/failed": user chọn lại job có application
kẹt ở trạng thái terminal thì pipeline phải chạy lại (reset + republish);
application đang chạy dở hoặc đã completed thì không được đụng vào.
"""

import uuid

import pytest
from app.core.database import Base
from app.models.application import ApplicationDB
from app.models.job import JobDB
from app.services import scraper_service
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

USER_ID = uuid.uuid4()
JOB_ID = uuid.uuid4()


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


@pytest.fixture(autouse=True)
def mock_publish(monkeypatch):
    """Chặn publish thật; ghi lại các lần gọi (queue, message)."""
    calls: list = []
    monkeypatch.setattr(scraper_service, "publish", lambda q, m: calls.append((q, m)))
    return calls


def _seed_job(db) -> None:
    db.add(
        JobDB(
            id=JOB_ID,
            source="manual",
            title="Backend Engineer",
            company="ACME",
            description="Build APIs",
        )
    )
    db.commit()


def _seed_application(db, status: str, attempt: int = 3) -> ApplicationDB:
    row = ApplicationDB(
        id=uuid.uuid4(),
        user_id=USER_ID,
        job_id=JOB_ID,
        generation_status=status,
        pipeline_stage="saved",
        attempt=attempt,
        error_message="lỗi cũ",
    )
    db.add(row)
    db.commit()
    return row


def test_select_new_job_creates_and_publishes(db, mock_publish):
    _seed_job(db)

    apps = scraper_service.select_jobs(str(USER_ID), [JOB_ID], db)

    assert apps[0].generation_status == "cv_queued"
    assert apps[0].attempt == 1
    assert len(mock_publish) == 1
    assert mock_publish[0][1]["attempt"] == 1


@pytest.mark.parametrize("status", ["needs_review", "failed", "saved"])
def test_reselect_terminal_resets_and_republishes(db, mock_publish, status):
    _seed_job(db)
    row = _seed_application(db, status=status)

    scraper_service.select_jobs(str(USER_ID), [JOB_ID], db)

    db.refresh(row)
    assert row.generation_status == "cv_queued"
    assert row.attempt == 1
    assert row.error_message is None
    assert len(mock_publish) == 1
    assert mock_publish[0][1]["attempt"] == 1


@pytest.mark.parametrize(
    "status", ["cv_generating", "cv_generated", "ats_scoring", "completed"]
)
def test_reselect_inflight_or_completed_untouched(db, mock_publish, status):
    _seed_job(db)
    row = _seed_application(db, status=status)

    scraper_service.select_jobs(str(USER_ID), [JOB_ID], db)

    db.refresh(row)
    assert row.generation_status == status
    assert row.attempt == 3  # không bị reset
    assert mock_publish == []


def test_select_missing_job_raises(db, mock_publish):
    with pytest.raises(ValueError):
        scraper_service.select_jobs(str(USER_ID), [uuid.uuid4()], db)
    assert mock_publish == []
