"""SQLAlchemy engine + session factory cho scraper-service."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from libs.common.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Base class cho mọi SQLAlchemy model của scraper-service."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: cung cấp DB session, đảm bảo close sau request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
