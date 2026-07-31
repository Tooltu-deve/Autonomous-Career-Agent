"""ORM đọc bảng `profiles` + bảng con (owned by profile-service).

cv-agent chỉ ĐỌC để dựng text profile đưa vào prompt. Cố tình KHÔNG map
phone/email/github/linkedin — theo DATA_PRIVACY, không gửi PII lên LLM.
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class ProfileORM(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), unique=True)
    headline: Mapped[str | None] = mapped_column(String)
    summary: Mapped[str | None] = mapped_column(Text)

    experiences: Mapped[list["ProfileExperienceORM"]] = relationship(
        order_by="ProfileExperienceORM.display_order"
    )
    educations: Mapped[list["ProfileEducationORM"]] = relationship(
        order_by="ProfileEducationORM.display_order"
    )
    skills: Mapped[list["ProfileSkillORM"]] = relationship()


class ProfileExperienceORM(Base):
    __tablename__ = "profile_experiences"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id"))
    title: Mapped[str] = mapped_column(String)
    organization: Mapped[str] = mapped_column(String)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer)


class ProfileEducationORM(Base):
    __tablename__ = "profile_educations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id"))
    school: Mapped[str] = mapped_column(String)
    degree: Mapped[str | None] = mapped_column(String)
    field_of_study: Mapped[str | None] = mapped_column(String)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer)


class ProfileSkillORM(Base):
    __tablename__ = "profile_skills"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id"))
    skill_name: Mapped[str] = mapped_column(String)
