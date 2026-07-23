"""Unit test cho libs.messaging.rabbitmq — mock pika, không cần RabbitMQ thật.

Kiểm các quy tắc trong API contract (Phần B):
- publish: queue durable + message persistent
- consume: ack sau khi handler xong; handler lỗi -> nack + requeue;
  JSON hỏng -> nack, KHÔNG requeue (tránh poison-message loop).
"""

import json
from unittest.mock import MagicMock, patch

from libs.messaging import rabbitmq


@patch("libs.messaging.rabbitmq.pika.BlockingConnection")
def test_publish_declares_durable_and_persistent(mock_conn_cls):
    channel = MagicMock()
    mock_conn_cls.return_value.channel.return_value = channel

    rabbitmq.publish("jobs.scraped", {"application_id": "app-1"})

    # queue được declare durable
    channel.queue_declare.assert_called_once_with(queue="jobs.scraped", durable=True)
    # message publish đúng routing key + body JSON + persistent (delivery_mode=2)
    _, kwargs = channel.basic_publish.call_args
    assert kwargs["routing_key"] == "jobs.scraped"
    assert json.loads(kwargs["body"]) == {"application_id": "app-1"}
    assert kwargs["properties"].delivery_mode == 2
    # đóng kết nối sau khi xong
    mock_conn_cls.return_value.close.assert_called_once()


def _run_one_message(body):
    """Dựng consume(), bắt callback _on_message, gọi nó với 1 message rồi trả (ch, method)."""
    channel = MagicMock()
    with patch("libs.messaging.rabbitmq.pika.BlockingConnection") as mock_conn_cls:
        mock_conn_cls.return_value.channel.return_value = channel
        handler = MagicMock()
        # start_consuming là vòng lặp blocking -> chặn lại để consume() trả về
        channel.start_consuming.side_effect = lambda: None
        rabbitmq.consume("jobs.scraped", handler)

    # lấy callback đã đăng ký
    _, kwargs = channel.basic_consume.call_args
    on_message = kwargs["on_message_callback"]

    ch = MagicMock()
    method = MagicMock(delivery_tag=42)
    return ch, method, handler, on_message, body


def test_consume_acks_after_successful_handler():
    ch, method, handler, on_message, body = _run_one_message(
        json.dumps({"application_id": "a"}).encode()
    )
    on_message(ch, method, None, body)

    handler.assert_called_once_with({"application_id": "a"})
    ch.basic_ack.assert_called_once_with(delivery_tag=42)
    ch.basic_nack.assert_not_called()


def test_consume_nacks_and_requeues_on_handler_error():
    ch, method, handler, on_message, body = _run_one_message(
        json.dumps({"application_id": "a"}).encode()
    )
    handler.side_effect = RuntimeError("LLM timeout")

    # handler raise -> callback cũng raise (để lỗi nổi lên), nhưng phải nack+requeue trước
    try:
        on_message(ch, method, None, body)
    except RuntimeError:
        pass

    ch.basic_nack.assert_called_once_with(delivery_tag=42, requeue=True)
    ch.basic_ack.assert_not_called()


def test_consume_nacks_without_requeue_on_bad_json():
    ch, method, handler, on_message, _ = _run_one_message(b"{ this is not json")
    on_message(ch, method, None, b"{ this is not json")

    # JSON hỏng -> nack không requeue, không gọi handler
    ch.basic_nack.assert_called_once_with(delivery_tag=42, requeue=False)
    handler.assert_not_called()
    ch.basic_ack.assert_not_called()
