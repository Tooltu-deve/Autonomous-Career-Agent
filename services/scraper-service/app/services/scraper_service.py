"""Business logic chính của scraper-service.

Hai nhiệm vụ:
1. search_and_save  — cào Indeed + LinkedIn, normalize, upsert vào DB, trả list job.
2. select_jobs      — upsert applications (idempotent), publish cv.requested.
"""

import uuid
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.application import ApplicationDB
from app.models.job import JobDB
from app.services import apify_client
from app.services.job_normalizer import normalize_linkedin
from libs.common.logging import get_logger
from libs.messaging.rabbitmq import QUEUE_CV_REQUESTED, publish
from libs.schemas.models import CvRequest, Job

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Search & Save
# ---------------------------------------------------------------------------


def search_and_save(
    target_role: str,
    locations: list[str],
    limit: int,
    db: Session,
    remote_preference: str | None = None,
) -> list[JobDB]:
    """Cào Indeed + LinkedIn theo tiêu chí, upsert vào DB, trả list JobDB.

    Cào tuần tự để tránh timeout đồng thời. Dùng upsert (ON CONFLICT DO NOTHING)
    theo (source, external_job_id) để tránh trùng lặp.
    """
    all_jobs: list[Job] = []

    from concurrent.futures import ThreadPoolExecutor

    with ThreadPoolExecutor(max_workers=1) as executor:
        future_linkedin = executor.submit(
            apify_client.fetch_linkedin_jobs,
            target_role,
            locations,
            limit,
            remote_preference,
        )

        linkedin_raws = future_linkedin.result()

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
            "posted_at": job.posted_at,
            "scraped_at": job.scraped_at,
            "status": job.status,
            "expires_at": job.expires_at,
            "raw_data": job.raw_data,
        }
        for job in all_jobs
    ]

    stmt = (
        pg_insert(JobDB)
        .values(rows)
        .on_conflict_do_nothing(index_elements=["source", "external_job_id"])
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

    return list(saved)


# ---------------------------------------------------------------------------
# Select Jobs
# ---------------------------------------------------------------------------


def select_jobs(
    user_id: str,
    job_ids: list[UUID],
    db: Session,
) -> list[ApplicationDB]:
    """Upsert applications cho (user_id, job_id), publish cv.requested.

    Idempotent: nếu application đã tồn tại thì trả lại cái cũ, không tạo trùng.
    Publish mỗi job vào queue cv.requested (scraper là producer).
    """
    # Kiểm tra job tồn tại
    existing_jobs = db.scalars(select(JobDB).where(JobDB.id.in_(job_ids))).all()
    existing_job_ids = {j.id for j in existing_jobs}

    missing = [str(jid) for jid in job_ids if jid not in existing_job_ids]
    if missing:
        raise ValueError(f"Job không tồn tại: {missing}")

    applications: list[ApplicationDB] = []
    user_uuid = uuid.UUID(user_id)

    for job_id in job_ids:
        # Upsert: ON CONFLICT (user_id, job_id) DO NOTHING
        stmt = (
            pg_insert(ApplicationDB)
            .values(
                id=uuid.uuid4(),
                user_id=user_uuid,
                job_id=job_id,
                generation_status="cv_queued",
                pipeline_stage="saved",
                attempt=1,
            )
            .on_conflict_do_nothing(index_elements=["user_id", "job_id"])
        )
        db.execute(stmt)

    db.commit()

    # Load lại tất cả application (mới tạo hoặc đã tồn tại)
    apps = db.scalars(
        select(ApplicationDB).where(
            ApplicationDB.user_id == user_uuid,
            ApplicationDB.job_id.in_(job_ids),
        )
    ).all()
    applications = list(apps)

    # Publish cv.requested cho các application mới (generation_status = cv_queued)
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


def list_jobs(db: Session, page: int = 1, limit: int = 20) -> tuple[list[JobDB], int]:
    """Trả (jobs, total) phân trang, chỉ job có status=active."""
    total: int = (
        db.scalar(
            select(func.count()).select_from(JobDB).where(JobDB.status == "active")
        )
        or 0
    )
    jobs = db.scalars(
        select(JobDB)
        .where(JobDB.status == "active")
        .order_by(JobDB.scraped_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return list(jobs), total


def get_job(job_id: UUID, db: Session) -> JobDB | None:
    """Trả một job theo id, hoặc None nếu không tìm thấy."""
    return db.get(JobDB, job_id)
