"""Business logic chính của scraper-service.

Hai nhiệm vụ:
1. search_and_save  — cào Indeed + LinkedIn, normalize, upsert vào DB, trả list job.
2. select_jobs      — upsert applications (idempotent), publish cv.requested.
"""

import uuid
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.application import ApplicationDB
from app.models.job import JobDB
from app.models.user_job import UserJobDB
from app.services import apify_client
from app.services.job_normalizer import normalize_linkedin
from libs.common.logging import get_logger
from libs.messaging.rabbitmq import QUEUE_CV_REQUESTED, publish
from libs.schemas.models import CvRequest, Job

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Search & Save
# ---------------------------------------------------------------------------


def link_jobs_to_user(db: Session, user_uuid: uuid.UUID, job_ids: list[UUID]) -> None:
    """Gắn jobs vào radar của user (upsert user_jobs, idempotent)."""
    if not job_ids:
        return
    stmt = pg_insert(UserJobDB).values(
        [{"user_id": user_uuid, "job_id": job_id} for job_id in job_ids]
    )
    stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "job_id"])
    db.execute(stmt)
    db.commit()


def search_and_save(
    target_role: str,
    locations: list[str],
    limit: int,
    db: Session,
    remote_preference: str | None = None,
    user_id: str | None = None,
) -> list[JobDB]:
    """Cào LinkedIn theo tiêu chí, upsert vào DB, trả list JobDB.

    Cào tuần tự để tránh timeout đồng thời. Dùng upsert (ON CONFLICT DO NOTHING)
    theo (source, external_job_id) để tránh trùng lặp. Nếu có `user_id`,
    gắn các job tìm được vào radar của user đó (bảng user_jobs).
    """
    all_jobs: list[Job] = []

    linkedin_raws = apify_client.fetch_linkedin_jobs(
        target_role, locations, limit, remote_preference
    )

    # Normalize results
    for raw in linkedin_raws:
        job = normalize_linkedin(raw)
        if job:
            all_jobs.append(job)

    logger.info(
        "Scrape xong | linkedin=%d normalized=%d",
        len(linkedin_raws),
        len(all_jobs),
    )

    if not all_jobs:
        return []

    # --- Upsert vào DB (ON CONFLICT DO NOTHING để idempotent) ---
    rows = [
        {
            "id": uuid.uuid4(),
            "source": job.source,
            "external_job_id": job.external_job_id or None,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "url": job.url,
            "description": job.description,
            "employment_type": job.employment_type,
            "seniority_level": job.seniority_level,
            "posted_at": job.posted_at,
            "scraped_at": job.scraped_at,
            "status": job.status,
            "expires_at": job.expires_at,
            "raw_data": job.raw_data,
        }
        for job in all_jobs
    ]

    stmt = pg_insert(JobDB).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["source", "external_job_id"],
        set_={
            "employment_type": stmt.excluded.employment_type,
            "seniority_level": stmt.excluded.seniority_level,
            "raw_data": stmt.excluded.raw_data,
            "scraped_at": stmt.excluded.scraped_at,
        },
    )
    db.execute(stmt)
    db.commit()

    # Trả lại các job vừa cào (truy vấn lại để có id thật từ DB)
    external_ids = [r["external_job_id"] for r in rows if r["external_job_id"]]
    sources = list({r["source"] for r in rows})

    saved = db.scalars(
        select(JobDB).where(
            JobDB.external_job_id.in_(external_ids),
            JobDB.source.in_(sources),
            JobDB.status == "active",
        )
    ).all()

    if user_id is not None:
        link_jobs_to_user(db, uuid.UUID(user_id), [j.id for j in saved])

    return list(saved)


# ---------------------------------------------------------------------------
# Select Jobs
# ---------------------------------------------------------------------------

# Trạng thái terminal được phép chạy lại pipeline khi user chọn lại job.
# Đang chạy dở (cv_queued/cv_generating/cv_generated/ats_scoring) hoặc đã
# completed thì giữ nguyên — tránh double-publish và tránh đè CV user đã sửa.
RETRYABLE_STATUSES = {"saved", "needs_review", "failed"}


def _upsert_applications(
    db: Session, user_uuid: uuid.UUID, job_ids: list[UUID]
) -> None:
    """Tạo application còn thiếu; reset application kẹt ở trạng thái terminal."""
    for job_id in job_ids:
        app_row = db.scalar(
            select(ApplicationDB).where(
                ApplicationDB.user_id == user_uuid,
                ApplicationDB.job_id == job_id,
            )
        )
        if app_row is None:
            db.add(
                ApplicationDB(
                    id=uuid.uuid4(),
                    user_id=user_uuid,
                    job_id=job_id,
                    generation_status="cv_queued",
                    pipeline_stage="saved",
                    attempt=1,
                )
            )
        elif app_row.generation_status in RETRYABLE_STATUSES:
            app_row.generation_status = "cv_queued"
            app_row.attempt = 1
            app_row.error_message = None
    db.commit()


def select_jobs(
    user_id: str,
    job_ids: list[UUID],
    db: Session,
) -> list[ApplicationDB]:
    """Upsert applications cho (user_id, job_id), publish cv.requested.

    - Chưa có application -> tạo mới (cv_queued, attempt=1).
    - Đã có nhưng kẹt ở trạng thái terminal (saved/needs_review/failed)
      -> reset về cv_queued, attempt=1 để pipeline chạy lại (retry của user).
    - Đang chạy dở hoặc completed -> giữ nguyên, không publish lại.
    """
    # Kiểm tra job tồn tại
    existing_jobs = db.scalars(select(JobDB).where(JobDB.id.in_(job_ids))).all()
    existing_job_ids = {j.id for j in existing_jobs}

    missing = [str(jid) for jid in job_ids if jid not in existing_job_ids]
    if missing:
        raise ValueError(f"Job không tồn tại: {missing}")

    user_uuid = uuid.UUID(user_id)

    try:
        _upsert_applications(db, user_uuid, job_ids)
    except IntegrityError:
        # Race hiếm: 2 request song song cùng tạo một (user, job) -> UNIQUE nổ.
        # Chạy lại: lần này row đã tồn tại -> đi nhánh reset/giữ nguyên.
        db.rollback()
        _upsert_applications(db, user_uuid, job_ids)

    # Load lại tất cả application (mới tạo / vừa reset / giữ nguyên)
    apps = db.scalars(
        select(ApplicationDB).where(
            ApplicationDB.user_id == user_uuid,
            ApplicationDB.job_id.in_(job_ids),
        )
    ).all()
    applications = list(apps)

    # Publish cv.requested cho application sẵn sàng chạy (cv_queued)
    for app in applications:
        if app.generation_status == "cv_queued":
            msg = CvRequest(
                user_id=str(app.user_id),
                job_id=str(app.job_id),
                attempt=app.attempt,
            )
            try:
                publish(QUEUE_CV_REQUESTED, msg.model_dump())
                logger.info(
                    "Published cv.requested | user=%s job=%s",
                    app.user_id,
                    app.job_id,
                )
            except Exception as exc:
                logger.error(
                    "Không publish được cv.requested | user=%s job=%s | err=%s",
                    app.user_id,
                    app.job_id,
                    exc,
                )

    return applications


# ---------------------------------------------------------------------------
# List & Get
# ---------------------------------------------------------------------------


def list_jobs(
    db: Session, user_id: str, page: int = 1, limit: int = 20
) -> tuple[list[JobDB], int]:
    """Trả (jobs, total) phân trang — chỉ job active trên radar của user."""
    user_uuid = uuid.UUID(user_id)
    base = (
        select(JobDB)
        .join(UserJobDB, UserJobDB.job_id == JobDB.id)
        .where(UserJobDB.user_id == user_uuid, JobDB.status == "active")
    )
    total: int = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    jobs = db.scalars(
        base.order_by(JobDB.scraped_at.desc()).offset((page - 1) * limit).limit(limit)
    ).all()
    return list(jobs), total


def get_job(job_id: UUID, db: Session) -> JobDB | None:
    """Trả một job theo id, hoặc None nếu không tìm thấy."""
    return db.get(JobDB, job_id)
