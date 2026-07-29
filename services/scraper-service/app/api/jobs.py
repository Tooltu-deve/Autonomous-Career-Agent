"""Router /jobs — scraper-service (A4 trong API_CONTRACT.md).

Endpoints:
  POST /jobs/search  → 200  Cào LinkedIn/Indeed, lưu DB, trả danh sách
  POST /jobs/preview  → 200  Cào LinkedIn/Indeed, trả danh sách (dev only)
  POST /jobs/select  → 202  Tạo application, publish cv.requested
  GET  /jobs         → 200  Danh sách jobs phân trang
  GET  /jobs/{id}    → 200  Chi tiết một job
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.jobs import (
    ApplicationOut,
    JobListResponse,
    JobOut,
    JobPreviewItem,
    JobPreviewResponse,
    JobSearchRequest,
    JobSelectRequest,
    SelectResponse,
)
from app.services import scraper_service
from app.services.apify_client import fetch_indeed_jobs, fetch_linkedin_jobs
from app.services.job_normalizer import normalize_indeed, normalize_linkedin

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/search", response_model=JobListResponse)
def search_jobs(
    body: JobSearchRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
) -> JobListResponse:
    """Cào LinkedIn/Indeed theo tiêu chí từ profile_preferences.

    FE lấy criteria từ GET /profile rồi truyền vào body;
    scraper không đọc thẳng DB profile-service.
    """
    jobs = scraper_service.search_and_save(
        target_role=body.target_role,
        preferred_locations=body.preferred_locations,
        limit=10,  # mặc định 10 jobs/source — contract không expose limit ra ngoài
        db=db,
    )
    items = [JobOut.model_validate(j) for j in jobs]
    return JobListResponse(items=items, page=1, limit=10, total=len(items))


@router.post(
    "/select", status_code=status.HTTP_202_ACCEPTED, response_model=SelectResponse
)
def select_jobs(
    body: JobSelectRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
) -> SelectResponse:
    """User chọn job → tạo application + publish cv.requested.

    Idempotent: nếu (user_id, job_id) đã tồn tại thì trả lại cái cũ.
    """
    try:
        apps = scraper_service.select_jobs(
            user_id=current_user_id,
            job_ids=body.job_ids,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    return SelectResponse(applications=[ApplicationOut.model_validate(a) for a in apps])


@router.get("", response_model=JobListResponse)
def list_jobs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
) -> JobListResponse:
    """Danh sách jobs phân trang (chỉ status=active)."""
    jobs, total = scraper_service.list_jobs(db=db, page=page, limit=limit)
    items = [JobOut.model_validate(j) for j in jobs]
    return JobListResponse(items=items, page=page, limit=limit, total=total)


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
) -> JobOut:
    """Chi tiết một job theo id. 404 nếu không tồn tại."""
    job = scraper_service.get_job(job_id=job_id, db=db)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job không tồn tại."
        )
    return JobOut.model_validate(job)


# ---------------------------------------------------------------------------
# DEV / TEST ONLY — không cần DB, không cần Auth
# Mục đích: kiểm tra Apify scraping + normalize hoạt động đúng
# ---------------------------------------------------------------------------


@router.post(
    "/preview",
    response_model=JobPreviewResponse,
    tags=["dev"],
    summary="[DEV] Cào + normalize, không lưu DB",
)
def preview_jobs(body: JobSearchRequest) -> JobPreviewResponse:
    """[DEV ONLY] Gọi Apify thật, normalize, trả kết quả — không lưu DB, không cần JWT.

    Dùng endpoint này để kiểm tra:
    - Apify actor có chạy được không
    - Normalize trả đúng các fields không
    - Response format khớp API_CONTRACT.md không

    ⚠ï¸ Không dùng trong production — không persist data.
    """
    location = (
        body.preferred_locations[0] if body.preferred_locations else "Ho Chi Minh City"
    )
    limit = 10  # mặc định cho preview — limit không có trong contract request

    indeed_raws = fetch_indeed_jobs(
        title=body.target_role, location=location, limit=limit
    )
    linkedin_raws = fetch_linkedin_jobs(
        title=body.target_role, location=location, limit=limit
    )

    items: list[JobPreviewItem] = []

    for raw in indeed_raws:
        job = normalize_indeed(raw)
        if job:
            items.append(
                JobPreviewItem(
                    source=job.source,
                    external_job_id=job.external_job_id,
                    title=job.title,
                    company=job.company,
                    location=job.location,
                    url=job.url,
                    description=job.description,
                    posted_at=job.posted_at,
                    scraped_at=job.scraped_at,
                    status=job.status or "active",
                    expires_at=job.expires_at,
                )
            )

    for raw in linkedin_raws:
        job = normalize_linkedin(raw)
        if job:
            items.append(
                JobPreviewItem(
                    source=job.source,
                    external_job_id=job.external_job_id,
                    title=job.title,
                    company=job.company,
                    location=job.location,
                    url=job.url,
                    description=job.description,
                    posted_at=job.posted_at,
                    scraped_at=job.scraped_at,
                    status=job.status or "active",
                    expires_at=job.expires_at,
                )
            )

    return JobPreviewResponse(
        indeed_count=len([i for i in items if i.source == "indeed"]),
        linkedin_count=len([i for i in items if i.source == "linkedin"]),
        total=len(items),
        items=items,
    )
