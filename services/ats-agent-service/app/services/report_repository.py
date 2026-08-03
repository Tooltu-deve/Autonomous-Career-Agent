"""Tầng ghi DB của ats-agent: ats_reports (sở hữu) + applications.generation_status.

Gom mọi thao tác GHI vào một chỗ — consumer và API đều gọi qua đây.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import ApplicationORM
from app.models.report import AtsReportORM
from libs.schemas.models import ATSReport, GenerationStatus


def get_report_by_cv(db: Session, cv_generation_id: uuid.UUID) -> AtsReportORM | None:
    """Đọc report theo cv_generation_id (1:1). None nếu chưa chấm."""
    return db.scalar(
        select(AtsReportORM).where(AtsReportORM.cv_generation_id == cv_generation_id)
    )


def upsert_report(
    db: Session, cv_generation_id: uuid.UUID, report: ATSReport
) -> AtsReportORM:
    """Ghi report cho bản CV (1:1). Đã có -> ghi đè (retry); chưa -> tạo mới."""
    row = get_report_by_cv(db, cv_generation_id)
    if row is None:
        row = AtsReportORM(cv_generation_id=cv_generation_id)
        db.add(row)
    row.overall_score = report.overall_score
    row.score_breakdown = report.score_breakdown
    row.matched_keywords = list(report.matched_keywords)
    row.missing_keywords = list(report.missing_keywords)
    row.recommendations = [r.model_dump() for r in report.recommendations]
    row.cover_letter_text = report.cover_letter_text
    row.model_used = report.model_used
    db.commit()
    db.refresh(row)
    return row


def set_generation_status(
    db: Session, application: ApplicationORM, status: GenerationStatus
) -> None:
    """Cập nhật generation_status của application (ngoại lệ single-writer)."""
    application.generation_status = status
    db.commit()
