"""Business logic profile-service: CRUD profile lồng + preferences.

PUT /profile là idempotent (contract §A2): thay TOÀN BỘ profile + bảng con.
Sau khi ghi, gọi qdrant_sync (side-effect, hiện stub).
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.profile import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfilePreference,
    ProfileSkill,
)
from app.schemas.profile import PreferencesUpdate, ProfileUpdate
from app.services import qdrant_sync


class ProfileNotFound(Exception):
    """Chưa có profile cho user (→ 404)."""


def get_profile(db: Session, user_id: uuid.UUID) -> Profile:
    profile = db.scalar(select(Profile).where(Profile.user_id == user_id))
    if profile is None:
        raise ProfileNotFound
    return profile


def upsert_profile(db: Session, user_id: uuid.UUID, data: ProfileUpdate) -> Profile:
    """Tạo mới hoặc thay toàn bộ profile + bảng con (idempotent)."""
    profile = db.scalar(select(Profile).where(Profile.user_id == user_id))
    if profile is None:
        profile = Profile(user_id=user_id)
        db.add(profile)

    profile.headline = data.headline
    profile.summary = data.summary
    profile.location = data.location
    profile.phone = data.phone
    profile.github_url = data.github_url
    profile.linkedin_url = data.linkedin_url
    profile.preferred_template = data.preferred_template

    # replace bảng con (cascade delete-orphan xoá bản cũ khi gán list mới)
    profile.experiences = [
        ProfileExperience(**e.model_dump()) for e in data.experiences
    ]
    profile.educations = [ProfileEducation(**e.model_dump()) for e in data.educations]
    profile.skills = [ProfileSkill(skill_name=s) for s in data.skills]

    db.commit()
    db.refresh(profile)

    # Side-effect: embed lên Qdrant. Lỗi KHÔNG làm hỏng PUT (đã lưu Postgres ở trên).
    # Chỉ đánh dấu embedding_synced_at khi upsert thành công.
    if qdrant_sync.sync_profile_embedding(profile.id, _profile_text(profile)):
        profile.embedding_synced_at = func.now()
        db.commit()
        db.refresh(profile)
    return profile


def get_preferences(db: Session, user_id: uuid.UUID) -> ProfilePreference:
    profile = get_profile(db, user_id)
    if profile.preference is None:
        raise ProfileNotFound
    return profile.preference


def upsert_preferences(
    db: Session, user_id: uuid.UUID, data: PreferencesUpdate
) -> ProfilePreference:
    """Tạo/cập nhật preferences của profile (idempotent, 1:1 với profile)."""
    profile = get_profile(db, user_id)
    pref = profile.preference
    if pref is None:
        pref = ProfilePreference(profile_id=profile.id)
        db.add(pref)

    pref.target_role = data.target_role
    pref.expected_salary_min = data.expected_salary_min
    pref.expected_salary_max = data.expected_salary_max
    pref.currency = data.currency
    pref.preferred_locations = data.preferred_locations
    pref.remote_preference = data.remote_preference

    db.commit()
    db.refresh(pref)
    return pref


def _profile_text(profile: Profile) -> str:
    """Ghép text profile để embed (dùng cho Qdrant sync)."""
    parts = [profile.headline or "", profile.summary or ""]
    parts += [s.skill_name for s in profile.skills]
    parts += [f"{e.title} {e.organization}" for e in profile.experiences]
    return " ".join(p for p in parts if p)
