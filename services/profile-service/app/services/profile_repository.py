"""Business logic profile-service: CRUD profile lồng + preferences.

PUT /profile là idempotent (contract §A2): thay TOÀN BỘ profile + bảng con.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.profile import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfilePreference,
    ProfileSkill,
)
from app.schemas.profile import PreferencesUpdate, ProfileUpdate


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
    pref.preferred_locations = data.preferred_locations
    pref.remote_preference = data.remote_preference

    db.commit()
    db.refresh(pref)
    return pref
