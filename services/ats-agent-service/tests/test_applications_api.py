"""Tests API /applications: list + detail + ownership 404."""

import uuid

import pytest
from app.core.db import get_db
from app.main import app
from app.services import consumer, report_repository
from fastapi.testclient import TestClient

from libs.schemas.models import ATSReport, Recommendation
from tests.conftest import APP_ID, CV_ID, USER_ID, seed_pipeline


@pytest.fixture()
def client(db, monkeypatch):
    # Không chạy consumer thật trong test API.
    monkeypatch.setattr(consumer, "run", lambda: None)

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _headers(user_id=USER_ID) -> dict:
    return {"X-User-Id": str(user_id)}


def _seed_with_report(db) -> None:
    seed_pipeline(db)
    report_repository.upsert_report(
        db,
        CV_ID,
        ATSReport(
            overall_score=82,
            score_breakdown={"keywords": 70},
            matched_keywords=["python"],
            missing_keywords=["kubernetes"],
            recommendations=[
                Recommendation(type="add", title="CI/CD", body="Thêm mục CI/CD")
            ],
            cover_letter_text="Dear Hiring Manager, ...",
            model_used="claude-opus-4-8",
        ),
    )


def test_list_applications(client, db):
    _seed_with_report(db)
    r = client.get("/applications", headers=_headers())
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["job_title"] == "Backend Engineer"
    assert item["company"] == "ACME"
    assert item["overall_score"] == 82


def test_list_applications_empty_for_other_user(client, db):
    _seed_with_report(db)
    r = client.get("/applications", headers=_headers(uuid.uuid4()))
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_get_application_detail(client, db):
    _seed_with_report(db)
    r = client.get(f"/applications/{APP_ID}", headers=_headers())
    assert r.status_code == 200
    body = r.json()
    assert body["cv_generation"]["cv_json"]["summary"].startswith("Backend")
    assert body["ats_report"]["overall_score"] == 82
    assert body["ats_report"]["recommendations"][0]["title"] == "CI/CD"


def test_get_application_before_pipeline_done(client, db):
    """cv_generation/ats_report có thể null nếu pipeline chưa chạy xong."""
    seed_pipeline(db, with_cv=False)
    r = client.get(f"/applications/{APP_ID}", headers=_headers())
    assert r.status_code == 200
    assert r.json()["cv_generation"] is None
    assert r.json()["ats_report"] is None


def test_get_application_of_other_user_is_404(client, db):
    _seed_with_report(db)
    r = client.get(f"/applications/{APP_ID}", headers=_headers(uuid.uuid4()))
    assert r.status_code == 404


def test_missing_user_header_is_422(client, db):
    assert client.get("/applications").status_code == 422


def test_patch_pipeline_stage(client, db):
    seed_pipeline(db)
    r = client.patch(
        f"/applications/{APP_ID}",
        headers=_headers(),
        json={"pipeline_stage": "interview"},
    )
    assert r.status_code == 200
    assert r.json() == {"id": str(APP_ID), "pipeline_stage": "interview"}
    # đổi trạng thái phải được ghi xuống DB
    r2 = client.get(f"/applications/{APP_ID}", headers=_headers())
    assert r2.json()["pipeline_stage"] == "interview"


def test_patch_pipeline_stage_other_user_404(client, db):
    seed_pipeline(db)
    r = client.patch(
        f"/applications/{APP_ID}",
        headers=_headers(uuid.uuid4()),
        json={"pipeline_stage": "applied"},
    )
    assert r.status_code == 404


def test_patch_pipeline_stage_invalid_value_422(client, db):
    seed_pipeline(db)
    r = client.patch(
        f"/applications/{APP_ID}",
        headers=_headers(),
        json={"pipeline_stage": "ghosted"},
    )
    assert r.status_code == 422


# ---- DELETE /applications/{id} ----

IN_FLIGHT = ("cv_queued", "cv_generating", "cv_generated", "ats_scoring")
TERMINAL = ("saved", "completed", "needs_review", "failed")


def _set_status(db, status_value: str) -> None:
    from app.models.application import ApplicationORM

    row = db.get(ApplicationORM, APP_ID)
    row.generation_status = status_value
    db.commit()


def test_delete_application_removes_cv_and_report(client, db):
    """Xoá application phải dọn luôn cv_generation và ats_report của nó."""
    from app.models.application import ApplicationORM
    from app.models.cv import CvGenerationORM
    from app.models.report import AtsReportORM

    _seed_with_report(db)
    _set_status(db, "completed")

    r = client.delete(f"/applications/{APP_ID}", headers=_headers())

    assert r.status_code == 204
    assert r.content == b""
    assert db.get(ApplicationORM, APP_ID) is None
    assert db.get(CvGenerationORM, CV_ID) is None
    assert db.query(AtsReportORM).filter_by(cv_generation_id=CV_ID).first() is None


def test_delete_application_of_another_user_404(client, db):
    """Không phải của mình -> 404, và dòng đó vẫn còn nguyên."""
    from app.models.application import ApplicationORM

    _seed_with_report(db)
    _set_status(db, "completed")

    r = client.delete(f"/applications/{APP_ID}", headers=_headers(user_id=uuid.uuid4()))

    assert r.status_code == 404
    assert db.get(ApplicationORM, APP_ID) is not None


def test_delete_application_not_found_404(client, db):
    _seed_with_report(db)
    r = client.delete(f"/applications/{uuid.uuid4()}", headers=_headers())
    assert r.status_code == 404


@pytest.mark.parametrize("status_value", IN_FLIGHT)
def test_delete_application_in_flight_409(client, db, status_value):
    """Đang chạy pipeline -> 409, dữ liệu không mất."""
    from app.models.application import ApplicationORM

    _seed_with_report(db)
    _set_status(db, status_value)

    r = client.delete(f"/applications/{APP_ID}", headers=_headers())

    assert r.status_code == 409
    assert db.get(ApplicationORM, APP_ID) is not None


@pytest.mark.parametrize("status_value", TERMINAL)
def test_delete_application_terminal_204(client, db, status_value):
    from app.models.application import ApplicationORM

    _seed_with_report(db)
    _set_status(db, status_value)

    r = client.delete(f"/applications/{APP_ID}", headers=_headers())

    assert r.status_code == 204
    assert db.get(ApplicationORM, APP_ID) is None


def test_delete_application_without_cv_204(client, db):
    """Application ở trạng thái `saved` chưa có CV -> vẫn xoá được."""
    from app.models.application import ApplicationORM

    from tests.conftest import seed_pipeline

    seed_pipeline(db, with_cv=False)
    _set_status(db, "saved")

    r = client.delete(f"/applications/{APP_ID}", headers=_headers())

    assert r.status_code == 204
    assert db.get(ApplicationORM, APP_ID) is None
