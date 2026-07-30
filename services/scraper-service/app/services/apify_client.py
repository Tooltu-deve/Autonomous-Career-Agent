"""Wrapper ApifyClient cho scraper-service — gọi Indeed và LinkedIn actor.

Đọc APIFY_API_TOKEN từ settings, không hardcode credential.
Actor IDs:
  - Indeed:   valig/indeed-jobs-scraper
  - LinkedIn: worldunboxer/rapid-linkedin-scraper
"""

from datetime import timedelta

from apify_client import ApifyClient

from libs.common.config import settings
from libs.common.logging import get_logger

logger = get_logger(__name__)

# Actor ID trên Apify
_LINKEDIN_ACTOR_ID = "worldunboxer/rapid-linkedin-scraper"

# Giới hạn timeout actor (phù hợp cho scrape nhỏ local/education)
_RUN_TIMEOUT = timedelta(minutes=10)
_WAIT_DURATION = timedelta(seconds=90)
_MEMORY_MB = 256


def _get_client() -> ApifyClient:
    """Tạo ApifyClient với token từ settings."""
    if not settings.apify_api_token:
        raise RuntimeError("APIFY_API_TOKEN chưa được cấu hình. Điền vào file .env.")
    return ApifyClient(settings.apify_api_token)


def fetch_linkedin_jobs(
    title: str,
    locations: list[str],
    limit: int = 10,
    remote_preference: str | None = None,
) -> list[dict]:
    """Cào jobs từ LinkedIn qua Apify actor.

    Args:
        title: Tên vị trí tìm kiếm (vd "Software Engineer").
        locations: Danh sách địa điểm (vd ["Ho Chi Minh", "Hanoi"]).
        limit: Số lượng job tối đa muốn lấy.
        remote_preference: Hình thức làm việc

    Returns:
        Danh sách raw dict từ Apify dataset (đã cắt đến limit).
    """
    client = _get_client()
    # Actor yêu cầu jobs_entries >= 10 — luôn gửi ít nhất 10, cắt kết quả sau
    actor_limit = max(limit, 10)
    run_input = {
        "jobs_titles": [title],
        "location": "Vietnam",  # Set broad location to Vietnam
        "cities": locations,  # Pass the array of cities
        "jobs_entries": actor_limit,
    }

    # Map remote_preference to LinkedIn expected values
    if remote_preference:
        work_arr_map = {
            "REMOTE": "Remote",
            "ON_SITE": "On-site",
            "ONSITE": "On-site",
            "onsite": "On-site",
            "HYBRID": "Hybrid",
        }
        mapped_arr = work_arr_map.get(remote_preference.upper())
        if mapped_arr:
            run_input["work_arrangement"] = mapped_arr

    logger.info(
        "Gọi LinkedIn actor | title=%s locations=%s limit=%d", title, locations, limit
    )
    try:
        run = client.actor(_LINKEDIN_ACTOR_ID).call(
            run_input=run_input,
            memory_mbytes=_MEMORY_MB,
            run_timeout=_RUN_TIMEOUT,
            wait_duration=_WAIT_DURATION,
            build="latest",
        )
    except Exception as exc:
        logger.error("LinkedIn actor lỗi: %s", exc)
        return []

    if not run:
        logger.warning("LinkedIn actor chưa hoàn tất trong thời gian chờ.")
        return []

    dataset_id = (
        run.get("defaultDatasetId")
        if isinstance(run, dict)
        else getattr(run, "default_dataset_id", None)
    )
    if not dataset_id:
        logger.warning("LinkedIn actor: không lấy được dataset ID.")
        return []
    items: list[dict] = client.dataset(dataset_id).list_items().items
    # Actor LinkedIn đôi khi trả dư — cắt về đúng limit
    result = items[:limit]
    logger.info("LinkedIn trả về %d items (sau cắt: %d)", len(items), len(result))
    return result
