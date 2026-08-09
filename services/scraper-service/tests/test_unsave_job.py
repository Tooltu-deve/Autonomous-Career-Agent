"""Tests unsave_job (service-level, SQLite thật).

Khoá hai bất biến: chỉ xoá dòng `user_jobs` của đúng user, và tuyệt đối không
đụng bảng `jobs` — đó là kho dùng chung giữa mọi user.
"""

import uuid

import pytest
from app.core.database import Base
from app.models.application import ApplicationDB
from app.models.job import JobDB
from app.models.user_job import UserJobDB
from app.services import scraper_service
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

USER_ID = uuid.uuid4()
OTHER_USER_ID = uuid.uuid4()
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


def _seed(
    db,
    *,
    on_radar_of=(USER_ID,),
    with_application=False,
    application_owner=USER_ID,
) -> None:
    db.add(
        JobDB(
            id=JOB_ID,
            source="manual",
            title="Backend Engineer",
            company="ACME",
            description="Build APIs",
            status="active",
        )
    )
    for uid in on_radar_of:
        db.add(UserJobDB(user_id=uid, job_id=JOB_ID))
    if with_application:
        db.add(
            ApplicationDB(
                id=uuid.uuid4(),
                user_id=application_owner,
                job_id=JOB_ID,
                generation_status="completed",
                pipeline_stage="saved",
                attempt=1,
            )
        )
    db.commit()


def _radar(db, user_id) -> list[UserJobDB]:
    return list(db.scalars(select(UserJobDB).where(UserJobDB.user_id == user_id)).all())


def test_unsave_removes_only_the_radar_row(db):
    _seed(db)

    scraper_service.unsave_job(db=db, user_id=str(USER_ID), job_id=JOB_ID)

    assert _radar(db, USER_ID) == []
    # Bảng jobs là kho dùng chung — không được đụng tới.
    assert db.get(JobDB, JOB_ID) is not None


def test_unsave_does_not_touch_other_users_radar(db):
    _seed(db, on_radar_of=(USER_ID, OTHER_USER_ID))

    scraper_service.unsave_job(db=db, user_id=str(USER_ID), job_id=JOB_ID)

    assert _radar(db, USER_ID) == []
    assert len(_radar(db, OTHER_USER_ID)) == 1


def test_unsave_job_with_application_raises(db):
    _seed(db, with_application=True)

    with pytest.raises(PermissionError):
        scraper_service.unsave_job(db=db, user_id=str(USER_ID), job_id=JOB_ID)

    assert len(_radar(db, USER_ID)) == 1


def test_unsave_job_not_on_radar_raises(db):
    _seed(db, on_radar_of=())

    with pytest.raises(LookupError):
        scraper_service.unsave_job(db=db, user_id=str(USER_ID), job_id=JOB_ID)


def test_unsave_allowed_when_application_belongs_to_other_user(db):
    """Chốt filter user_id trong check application: application của
    OTHER_USER_ID không được phép chặn USER_ID gỡ job của chính họ. Nếu sau
    này ai đó lỡ bỏ điều kiện `ApplicationDB.user_id == user_uuid` (chỉ còn
    lọc theo job_id), test này sẽ đỏ dù 4 test còn lại (dùng chung
    USER_ID cho cả actor lẫn application) vẫn xanh.
    """
    _seed(
        db,
        on_radar_of=(USER_ID, OTHER_USER_ID),
        with_application=True,
        application_owner=OTHER_USER_ID,
    )

    scraper_service.unsave_job(db=db, user_id=str(USER_ID), job_id=JOB_ID)

    assert _radar(db, USER_ID) == []
    assert len(_radar(db, OTHER_USER_ID)) == 1
