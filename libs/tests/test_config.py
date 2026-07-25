"""Tests cho Settings dùng chung."""

from libs.common.config import settings


def test_ats_gate_defaults():
    assert settings.ats_pass_threshold == 70
    assert settings.ats_max_attempts == 3


def test_default_llm_model():
    assert settings.llm_model == "claude-opus-4-8"


def test_database_url_shape():
    url = settings.database_url
    assert url.startswith("postgresql+psycopg://")
    assert settings.postgres_db in url
