"""Tests report_repository: upsert 1:1 ghi đè, set_generation_status."""

from app.models.report import AtsReportORM
from app.services import report_repository
from sqlalchemy import func, select

from libs.schemas.models import ATSReport, Recommendation
from tests.conftest import CV_ID, seed_pipeline


def _report(score: int = 82) -> ATSReport:
    return ATSReport(
        overall_score=score,
        score_breakdown={"keywords": 70, "experience": 90},
        matched_keywords=["python", "fastapi"],
        missing_keywords=["kubernetes"],
        recommendations=[
            Recommendation(type="add", title="CI/CD", body="Thêm mục CI/CD")
        ],
        cover_letter_text="Dear Hiring Manager, ...",
        model_used="claude-opus-4-8",
    )


def test_upsert_creates_report(db):
    seed_pipeline(db)
    row = report_repository.upsert_report(db, CV_ID, _report())
    assert row.overall_score == 82
    assert row.matched_keywords == ["python", "fastapi"]
    assert row.recommendations[0]["title"] == "CI/CD"


def test_upsert_overwrites_existing(db):
    seed_pipeline(db)
    report_repository.upsert_report(db, CV_ID, _report(score=40))
    row = report_repository.upsert_report(db, CV_ID, _report(score=90))
    assert row.overall_score == 90
    assert db.scalar(select(func.count()).select_from(AtsReportORM)) == 1


def test_set_generation_status(db):
    app_row = seed_pipeline(db)
    report_repository.set_generation_status(db, app_row, "ats_scoring")
    db.refresh(app_row)
    assert app_row.generation_status == "ats_scoring"
