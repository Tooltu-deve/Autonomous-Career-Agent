"""Normalize raw Apify payload → libs.schemas.models.Job.

Mỗi actor trả về một structure khác nhau;
module này chuẩn hoá thành Job schema dùng chung.

Field mapping được kiểm chứng từ mock_indeed_jobs_api.json
và mock_linkedin_jobs_api.json (output thực tế từ Apify actors).
"""

from datetime import datetime, timezone
from typing import Optional

from libs.schemas.models import Job


def _parse_dt(value: Optional[str | int]) -> Optional[datetime]:
    """Parse timestamp string/int → datetime UTC. Trả None nếu không parse được."""
    if not value:
        return None
    try:
        if isinstance(value, int):
            return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, OSError):
        return None


def normalize_linkedin(raw: dict) -> Optional[Job]:
    """Chuyển raw dict từ worldunboxer/rapid-linkedin-scraper sang Job.

    Field mapping (kiểm chứng từ mock_linkedin_jobs_api.json):
      - title       → raw["job_title"]
      - company     → raw["company_name"]
      - external_id → raw["job_id"]
      - url         → raw["job_url"]
      - description → raw["job_description"]
      - location    → raw["location"]
      - posted_at   → None  (actor trả "5 days ago" dạng text, không parse được)
      - apply_url   → raw["apply_url"]  (fallback)

    Trả None nếu thiếu field bắt buộc (title hoặc company).
    """
    title: str = raw.get("job_title") or raw.get("title") or ""
    company: str = raw.get("company_name") or raw.get("company") or ""

    if not title or not company:
        return None

    description: str = raw.get("job_description") or raw.get("description") or ""

    # "time_posted" là text kiểu "5 days ago" — không parse được thành datetime.
    # posted_at để None; raw_data vẫn giữ nguyên để truy vết sau.
    posted_at: Optional[datetime] = None

    return Job(
        source="linkedin",
        external_job_id=str(raw.get("job_id") or raw.get("jobId") or ""),
        title=title.strip(),
        company=company.strip(),
        location=raw.get("location"),
        url=raw.get("job_url") or raw.get("apply_url") or raw.get("url"),
        description=description.strip(),
        posted_at=posted_at,
        scraped_at=datetime.now(tz=timezone.utc),
        raw_data=raw,
    )
