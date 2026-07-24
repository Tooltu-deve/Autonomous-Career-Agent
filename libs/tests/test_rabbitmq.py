"""Tests cho wrapper RabbitMQ (mock pika, không cần broker thật)."""

import json
from unittest.mock import MagicMock, patch

import pytest

from libs.messaging.rabbitmq import (
    QUEUE_CV_GENERATED,
    QUEUE_CV_REQUESTED,
    consume,
    publish,
)


def test_queue_names():
    assert QUEUE_CV_REQUESTED == "cv.requested"
    assert QUEUE_CV_GENERATED == "cv.generated"


@patch("pika.BlockingConnection")
def test_publish_sends_persistent_json(mock_conn_cls):
    channel = MagicMock()
    mock_conn_cls.return_value.channel.return_value = channel

    publish(QUEUE_CV_REQUESTED, {"user_id": "u1", "attempt": 1})

    channel.queue_declare.assert_called_once_with(
        queue=QUEUE_CV_REQUESTED, durable=True
    )
    _, kwargs = channel.basic_publish.call_args
    assert kwargs["routing_key"] == QUEUE_CV_REQUESTED
    assert json.loads(kwargs["body"]) == {"user_id": "u1", "attempt": 1}
    assert kwargs["properties"].delivery_mode == 2
    mock_conn_cls.return_value.close.assert_called_once()


@patch("pika.BlockingConnection")
def test_consume_acks_on_success(mock_conn_cls):
    channel = MagicMock()
    mock_conn_cls.return_value.channel.return_value = channel
    received = []

    consume(QUEUE_CV_GENERATED, lambda msg: received.append(msg))

    # Lấy callback đã đăng ký rồi mô phỏng một message đến.
    on_message = channel.basic_consume.call_args.kwargs["on_message_callback"]
    method = MagicMock(delivery_tag=7)
    on_message(channel, method, None, json.dumps({"job_id": "j1"}).encode())

    assert received == [{"job_id": "j1"}]
    channel.basic_ack.assert_called_once_with(delivery_tag=7)
    channel.basic_nack.assert_not_called()


@patch("pika.BlockingConnection")
def test_consume_nacks_and_requeues_on_error(mock_conn_cls):
    channel = MagicMock()
    mock_conn_cls.return_value.channel.return_value = channel

    def boom(_msg):
        raise RuntimeError("db down")

    consume(QUEUE_CV_GENERATED, boom)
    on_message = channel.basic_consume.call_args.kwargs["on_message_callback"]
    method = MagicMock(delivery_tag=9)

    with pytest.raises(RuntimeError):
        on_message(channel, method, None, json.dumps({"x": 1}).encode())

    channel.basic_nack.assert_called_once_with(delivery_tag=9, requeue=True)
    channel.basic_ack.assert_not_called()


@patch("pika.BlockingConnection")
def test_consume_nacks_without_requeue_on_bad_json(mock_conn_cls):
    channel = MagicMock()
    mock_conn_cls.return_value.channel.return_value = channel
    received = []

    consume(QUEUE_CV_GENERATED, lambda msg: received.append(msg))
    on_message = channel.basic_consume.call_args.kwargs["on_message_callback"]
    method = MagicMock(delivery_tag=11)

    # Payload không phải JSON hợp lệ: bỏ qua, không requeue, không crash consumer.
    on_message(channel, method, None, b"not-json{")

    assert received == []  # handler không được gọi
    channel.basic_nack.assert_called_once_with(delivery_tag=11, requeue=False)
    channel.basic_ack.assert_not_called()
