"""Database connection (SQLite to start; set DATABASE_URL to switch to Postgres)."""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import env


class Base(DeclarativeBase):
    pass


_engine = None
_Session = None


def configure(url: str | None = None):
    """Create the engine and the tables. Called once at startup (and by tests)."""
    global _engine, _Session
    url = url or env().database_url
    kwargs = {}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in url:
            from sqlalchemy.pool import StaticPool

            kwargs["poolclass"] = StaticPool
        else:
            Path(url.split("///", 1)[1]).parent.mkdir(parents=True, exist_ok=True)
    _engine = create_engine(url, **kwargs)
    _Session = sessionmaker(bind=_engine, expire_on_commit=False)
    from . import models  # noqa: F401  (registers the tables)

    Base.metadata.create_all(_engine)
    return _engine


def session():
    if _Session is None:
        configure()
    return _Session()


def get_db():
    """FastAPI dependency: one database session per request."""
    db = session()
    try:
        yield db
    finally:
        db.close()
