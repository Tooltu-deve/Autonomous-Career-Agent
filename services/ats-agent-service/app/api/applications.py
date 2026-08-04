"""Router /applications — theo dõi pipeline. user_id lấy từ gateway (X-User-Id)."""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.application import ApplicationORM
from app.models.cv import CvGenerationORM
from app.models.job import JobORM
from app.schemas.applications import (
    ApplicationDetail,
    ApplicationListItem,
    ApplicationListResponse,
    ApplicationStageResponse,
    ApplicationStageUpdate,
)
from app.services import report_repository

router = APIRouter(prefix="/applications", tags=["applications"])


def current_user_id(x_user_id: str = Header(..., alias="X-User-Id")) -> uuid.UUID:
    """user_id do gateway verify JWT rồi truyền xuống."""
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "X-User-Id không hợp lệ")


def _cv_of(db: Session, application_id: uuid.UUID) -> CvGenerationORM | None:
    return db.scalar(
        select(CvGenerationORM).where(CvGenerationORM.application_id == application_id)
    )


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> ApplicationListResponse:
    base = select(ApplicationORM).where(ApplicationORM.user_id == user_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(ApplicationORM.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    items = []
    for app_row in rows:
        job = db.get(JobORM, app_row.job_id)
        cv = _cv_of(db, app_row.id)
        report = report_repository.get_report_by_cv(db, cv.id) if cv else None
        items.append(
            ApplicationListItem(
                id=app_row.id,
                job_id=app_row.job_id,
                job_title=job.title if job else "",
                company=job.company if job else "",
                generation_status=app_row.generation_status,
                pipeline_stage=app_row.pipeline_stage,
                overall_score=report.overall_score if report else None,
                created_at=app_row.created_at,
            )
        )
    return ApplicationListResponse(items=items, page=page, limit=limit, total=total)


@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(
    application_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> ApplicationDetail:
    app_row = db.get(ApplicationORM, application_id)
    if app_row is None or app_row.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application không tồn tại")

    cv = _cv_of(db, app_row.id)
    report = report_repository.get_report_by_cv(db, cv.id) if cv else None
    return ApplicationDetail(
        id=app_row.id,
        user_id=app_row.user_id,
        job_id=app_row.job_id,
        generation_status=app_row.generation_status,
        pipeline_stage=app_row.pipeline_stage,
        cv_generation=cv,
        ats_report=report,
        created_at=app_row.created_at,
    )


@router.patch("/{application_id}", response_model=ApplicationStageResponse)
def update_pipeline_stage(
    application_id: uuid.UUID,
    body: ApplicationStageUpdate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> ApplicationStageResponse:
    """User đổi trạng thái ứng tuyển (kéo-thả kanban trên FE).

    Chỉ đổi `pipeline_stage` (do user quản lý) — không đụng `generation_status`
    (pipeline AI, single-writer là consumer).
    """
    app_row = db.get(ApplicationORM, application_id)
    if app_row is None or app_row.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application không tồn tại")

    app_row.pipeline_stage = body.pipeline_stage
    db.commit()
    return ApplicationStageResponse(
        id=app_row.id, pipeline_stage=app_row.pipeline_stage
    )
