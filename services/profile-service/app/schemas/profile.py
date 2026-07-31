"""Pydantic request/response profile-service — khớp API_CONTRACT §A2, §A3."""

import uuid
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

TemplateName = Literal["classic", "modern", "academic"]


# ---- Sub-items ----
class ExperienceIn(BaseModel):
    title: str
    organization: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    display_order: int = 0


class EducationIn(BaseModel):
    school: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    display_order: int = 0


class ExperienceOut(ExperienceIn):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class EducationOut(EducationIn):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    skill_name: str


# ---- Profile ----
class ProfileUpdate(BaseModel):
    """Body PUT /profile (không kèm id/user_id — lấy từ token)."""

    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    preferred_template: TemplateName = "classic"
    experiences: list[ExperienceIn] = []
    educations: list[EducationIn] = []
    skills: list[str] = []


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    preferred_template: TemplateName
    experiences: list[ExperienceOut] = []
    educations: list[EducationOut] = []
    skills: list[SkillOut] = []


# ---- Preferences ----
class PreferencesUpdate(BaseModel):
    target_role: str = Field(min_length=1)
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    currency: Optional[str] = "VND"
    preferred_locations: list[str] = []
    remote_preference: Optional[Literal["remote", "hybrid", "onsite"]] = None


class PreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    profile_id: uuid.UUID
    target_role: str
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    currency: Optional[str] = None
    preferred_locations: list[str] = []
    remote_preference: Optional[str] = None
