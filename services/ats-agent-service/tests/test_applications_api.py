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
