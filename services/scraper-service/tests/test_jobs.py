"""Tests cho scraper-service — jobs endpoints.

Dùng TestClient (sync) + FastAPI dependency_overrides để mock JWT và DB.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.main import app
from fastapi.testclient import TestClient

_FAKE_USER_ID = "00000000-0000-0000-0000-000000000001"
_FAKE_DB = MagicMock()
_AUTH_HEADER = {"Authorization": "Bearer fake-token"}


# Override FastAPI dependencies trước khi tạo TestClient
app.dependency_overrides[get_current_user_id] = lambda: _FAKE_USER_ID
app.dependency_overrides[get_db] = lambda: _FAKE_DB

client = TestClient(app, raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health():
    """GET /health luôn trả 200 status=ok."""
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# POST /jobs/search
# ---------------------------------------------------------------------------


def test_search_jobs_returns_200(monkeypatch):
    """POST /jobs/search → 200 với danh sách jobs."""
    from app.models.job import JobDB

    fake_job = MagicMock(spec=JobDB)
    fake_job.id = uuid.uuid4()
    fake_job.source = "indeed"
    fake_job.external_job_id = "indeed-001"
    fake_job.title = "Backend Engineer"
    fake_job.company = "ACME"
    fake_job.location = "Ho Chi Minh City"
    fake_job.url = "https://indeed.com/job/001"
    fake_job.description = "Build cool APIs"
    fake_job.posted_at = None
    fake_job.scraped_at = datetime.now(tz=timezone.utc)
    fake_job.status = "active"
    fake_job.expires_at = None

    monkeypatch.setattr(
        "app.api.jobs.scraper_service.search_and_save",
        lambda **kwargs: [fake_job],
    )

    body = {
        "target_role": "Backend Engineer",
        "preferred_locations": ["Ho Chi Minh City"],
    }
    r = client.post("/jobs/search", json=body, headers=_AUTH_HEADER)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert data["items"][0]["title"] == "Backend Engineer"


def test_search_jobs_empty_role_rejected():
    """POST /jobs/search với target_role rỗng → 422."""
    r = client.post(
        "/jobs/search",
        json={"target_role": "", "preferred_locations": ["HCM"]},
        headers=_AUTH_HEADER,
    )
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# POST /jobs/select
# ---------------------------------------------------------------------------


def test_select_jobs_returns_202(monkeypatch):
    """POST /jobs/select → 202 Accepted với danh sách applications."""
    from app.models.application import ApplicationDB

    fake_app = MagicMock(spec=ApplicationDB)
    fake_app.id = uuid.uuid4()
    fake_app.job_id = uuid.uuid4()
    fake_app.generation_status = "cv_queued"

    monkeypatch.setattr(
        "app.api.jobs.scraper_service.select_jobs",
        lambda **kwargs: [fake_app],
    )

    body = {"job_ids": [str(uuid.uuid4())]}
    r = client.post("/jobs/select", json=body, headers=_AUTH_HEADER)
    assert r.status_code == 202
    data = r.json()
    assert "applications" in data
    assert data["applications"][0]["generation_status"] == "cv_queued"


def test_select_jobs_404_on_missing(monkeypatch):
    """POST /jobs/select với job_id không tồn tại → 404."""

    monkeypatch.setattr(
        "app.api.jobs.scraper_service.select_jobs",
        lambda **kwargs: (_ for _ in ()).throw(ValueError("Job không tồn tại")),
    )

    body = {"job_ids": [str(uuid.uuid4())]}
    r = client.post("/jobs/select", json=body, headers=_AUTH_HEADER)
    assert r.status_code == 404


def test_select_jobs_empty_list_rejected():
    """POST /jobs/select với job_ids rỗng → 422."""
    r = client.post("/jobs/select", json={"job_ids": []}, headers=_AUTH_HEADER)
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# GET /jobs
# ---------------------------------------------------------------------------


def test_list_jobs(monkeypatch):
    """GET /jobs → 200 với danh sách phân trang."""
    monkeypatch.setattr(
        "app.api.jobs.scraper_service.list_jobs",
        lambda **kwargs: ([], 0),
    )
    r = client.get("/jobs", headers=_AUTH_HEADER)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert data["total"] == 0


# ---------------------------------------------------------------------------
# GET /jobs/{job_id}
# ---------------------------------------------------------------------------


def test_get_job_not_found(monkeypatch):
    """GET /jobs/{id} với id không tồn tại → 404."""

    monkeypatch.setattr(
        "app.api.jobs.scraper_service.get_job",
        lambda **kwargs: None,
    )
    r = client.get(f"/jobs/{uuid.uuid4()}", headers=_AUTH_HEADER)
    assert r.status_code == 404
