"""Kết nối Postgres qua SQLAlchemy, dùng chung trong profile-service."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from libs.common.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base cho mọi ORM model trong service."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: mở session cho mỗi request, đóng khi xong."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
