"""Tests consumer._handle: validate payload, mỗi message một session."""

from unittest.mock import MagicMock

from app.services import consumer


def test_handle_valid_message_calls_process(monkeypatch):
    called = {}

    def fake_process(db, req):
        called["cv_generation_id"] = req.cv_generation_id

    monkeypatch.setattr(consumer.ats_agent, "process", fake_process)
    monkeypatch.setattr(consumer, "SessionLocal", MagicMock())

    consumer._handle({"schema_version": 1, "cv_generation_id": "abc-123"})

    assert called["cv_generation_id"] == "abc-123"


def test_handle_invalid_payload_skips(monkeypatch):
    """Payload sai schema -> bỏ qua (return bình thường -> libs ack)."""
    process = MagicMock()
    monkeypatch.setattr(consumer.ats_agent, "process", process)

    consumer._handle({"schema_version": 1})  # thiếu cv_generation_id

    process.assert_not_called()
