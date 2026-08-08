"""ORM models cho profile-service — khớp infra/init-db/01_schema.sql.

Profile là root; experiences/educations/skills/preferences là bảng con
(profile_id → profiles.id, ON DELETE CASCADE).
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.db import Base

TEMPLATES = ("classic", "modern", "academic")

# TEXT[] trên Postgres; JSON fallback trên SQLite (test) — cùng interface list[str].
StringArray = ARRAY(String).with_variant(JSON, "sqlite")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), unique=True, nullable=False
    )
    headline: Mapped[str | None] = mapped_column(String)
    summary: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    github_url: Mapped[str | None] = mapped_column(String)
    linkedin_url: Mapped[str | None] = mapped_column(String)
    preferred_template: Mapped[str] = mapped_column(
        String, nullable=False, default="classic"
    )
    completeness_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    experiences: Mapped[list["ProfileExperience"]] = relationship(
        cascade="all, delete-orphan",
        order_by="ProfileExperience.display_order",
    )
    educations: Mapped[list["ProfileEducation"]] = relationship(
        cascade="all, delete-orphan",
        order_by="ProfileEducation.display_order",
    )
    certifications: Mapped[list["ProfileCertification"]] = relationship(
        cascade="all, delete-orphan",
        order_by="ProfileCertification.display_order",
    )
    skills: Mapped[list["ProfileSkill"]] = relationship(
        cascade="all, delete-orphan",
        order_by="ProfileSkill.display_order",
    )
    preference: Mapped["ProfilePreference | None"] = relationship(
        cascade="all, delete-orphan", uselist=False
    )


class ProfileExperience(Base):
    __tablename__ = "profile_experiences"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    organization: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ProfileEducation(Base):
    __tablename__ = "profile_educations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    school: Mapped[str] = mapped_column(String, nullable=False)
    degree: Mapped[str | None] = mapped_column(String)
    field_of_study: Mapped[str | None] = mapped_column(String)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ProfileCertification(Base):
    __tablename__ = "profile_certifications"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    obtain_date: Mapped[date] = mapped_column(Date, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ProfileSkill(Base):
    __tablename__ = "profile_skills"
    __table_args__ = (UniqueConstraint("profile_id", "skill_name"),)

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    skill_name: Mapped[str] = mapped_column(String, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0)


class ProfilePreference(Base):
    __tablename__ = "profile_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        unique=True,
    )
    target_role: Mapped[str] = mapped_column(String, nullable=False)
    preferred_locations: Mapped[list[str] | None] = mapped_column(StringArray)
    remote_preference: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
