import httpx
import pytest
from fastapi.testclient import TestClient

KEYS = [
    "GOOGLE_PLACES_API_KEY", "HUNTER_API_KEY", "NEVERBOUNCE_API_KEY", "ANTHROPIC_API_KEY",
    "INSTANTLY_API_KEY", "INSTANTLY_CAMPAIGN_ID", "ADMIN_PASSWORD", "ALERT_WEBHOOK_URL",
]


class FakeWeb:
    """Stands in for the internet: tests register a reply for each address."""

    def __init__(self):
        self.routes = {}
        self.requests = []

    def add(self, url_start, *, status=200, json=None, html=None):
        self.routes[url_start] = (status, json, html)

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        url = str(request.url)
        for start in sorted(self.routes, key=len, reverse=True):
            if url.startswith(start):
                status, json, html = self.routes[start]
                if json is not None:
                    return httpx.Response(status, json=json)
                return httpx.Response(status, html=html or "")
        return httpx.Response(404, html="not found")


@pytest.fixture
def web(monkeypatch):
    from app import http

    fake = FakeWeb()
    monkeypatch.setattr(http, "transport", httpx.MockTransport(fake.handler))
    return fake


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in KEYS:
        monkeypatch.setenv(key, "")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("SCHEDULER_ENABLED", "0")
    monkeypatch.setenv("OUTREACH_PROVIDER", "dry_run")
    monkeypatch.setenv("PUBLIC_BASE_URL", "http://localhost:8000")


@pytest.fixture
def api(web):
    """The running app, with a fresh empty database and no real internet."""
    from app.main import app

    with TestClient(app) as client:
        yield client


@pytest.fixture
def db(api):
    from app import db as database

    session = database.session()
    yield session
    session.close()
