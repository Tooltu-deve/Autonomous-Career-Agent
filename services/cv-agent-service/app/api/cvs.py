"""Router /cvs — GET/PUT CV cho CV Editor. user_id lấy từ gateway (X-User-Id)."""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.application import ApplicationORM
from app.models.cv import CvGenerationORM
from app.schemas.cv import CvResponse, CvUpdateRequest
from app.services import cv_repository

router = APIRouter(prefix="/cvs", tags=["cvs"])


def current_user_id(x_user_id: str = Header(..., alias="X-User-Id")) -> uuid.UUID:
    """user_id do gateway verify JWT rồi truyền xuống."""
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "X-User-Id không hợp lệ")


def _get_owned_cv(db: Session, cv_id: uuid.UUID, user_id: uuid.UUID) -> CvGenerationORM:
    """Lấy CV nếu thuộc về user; 404 nếu không tồn tại HOẶC không thuộc user."""
    cv = cv_repository.get_cv(db, cv_id)
    if cv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV không tồn tại")
    application = db.get(ApplicationORM, cv.application_id)
    if application is None or application.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV không tồn tại")
    return cv


@router.get("/{cv_id}", response_model=CvResponse)
def get_cv(
    cv_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> CvResponse:
    cv = _get_owned_cv(db, cv_id, user_id)
    return CvResponse.model_validate(cv)


@router.put("/{cv_id}", response_model=CvResponse)
def update_cv(
    cv_id: uuid.UUID,
    body: CvUpdateRequest,
    user_id: uuid.UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> CvResponse:
    cv = _get_owned_cv(db, cv_id, user_id)
    updated = cv_repository.update_cv(db, cv, body.cv_json.model_dump())
    return CvResponse.model_validate(updated)
