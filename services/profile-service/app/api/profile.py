"""Route handlers profile-service — mỏng: lấy user_id từ gateway, gọi repository.

Gateway đã verify JWT và truyền user_id qua header X-User-Id (xem api-gateway
proxy). Service KHÔNG tự verify token lại — gateway là điểm auth duy nhất.
"""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.profile import (
    PreferencesResponse,
    PreferencesUpdate,
    ProfileResponse,
    ProfileUpdate,
)
from app.services import profile_repository

router = APIRouter(tags=["profile"])


def current_user_id(x_user_id: str = Header(...)) -> uuid.UUID:
    """user_id do gateway truyền qua header X-User-Id."""
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="X-User-Id không hợp lệ"
        )


@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    user_id: uuid.UUID = Depends(current_user_id), db: Session = Depends(get_db)
) -> ProfileResponse:
    try:
        profile = profile_repository.get_profile(db, user_id)
    except profile_repository.ProfileNotFound:
        raise HTTPException(status_code=404, detail="Chưa có profile")
    return ProfileResponse.model_validate(profile)


@router.put("/profile", response_model=ProfileResponse)
def put_profile(
    data: ProfileUpdate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = profile_repository.upsert_profile(db, user_id, data)
    return ProfileResponse.model_validate(profile)


@router.get("/profile/preferences", response_model=PreferencesResponse)
def get_preferences(
    user_id: uuid.UUID = Depends(current_user_id), db: Session = Depends(get_db)
) -> PreferencesResponse:
    try:
        pref = profile_repository.get_preferences(db, user_id)
    except profile_repository.ProfileNotFound:
        raise HTTPException(status_code=404, detail="Chưa có preferences")
    return PreferencesResponse.model_validate(pref)


@router.put("/profile/preferences", response_model=PreferencesResponse)
def put_preferences(
    data: PreferencesUpdate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> PreferencesResponse:
    try:
        pref = profile_repository.upsert_preferences(db, user_id, data)
    except profile_repository.ProfileNotFound:
        raise HTTPException(
            status_code=404, detail="Chưa có profile — tạo profile trước"
        )
    return PreferencesResponse.model_validate(pref)
