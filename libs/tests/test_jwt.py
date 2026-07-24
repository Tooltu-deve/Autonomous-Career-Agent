"""Tests cho JWT utils (roundtrip + lỗi)."""

import pytest
from jose import JWTError

from libs.common.jwt import create_access_token, decode_token


def test_roundtrip():
    token = create_access_token("user-1")
    assert decode_token(token)["sub"] == "user-1"


def test_expired_token_raises():
    token = create_access_token("user-1", expires_minutes=-1)
    with pytest.raises(JWTError):
        decode_token(token)


def test_tampered_token_raises():
    token = create_access_token("user-1")
    with pytest.raises(JWTError):
        decode_token(token + "tampered")
