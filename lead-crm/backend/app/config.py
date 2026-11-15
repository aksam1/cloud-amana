"""Settings that come from the .env file (API keys and a few switches).

Nothing secret lives in the code: every key is read from the environment.
"""
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# lead-crm/ (the project root, where .env lives)
ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")


def _get(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


@dataclass(frozen=True)
class Env:
    database_url: str
    public_base_url: str
    admin_password: str
    google_places_api_key: str
    hunter_api_key: str
    neverbounce_api_key: str
    anthropic_api_key: str
    claude_model: str
    outreach_provider: str  # "dry_run" or "instantly"
    instantly_api_key: str
    instantly_campaign_id: str
    alert_webhook_url: str
    scheduler_enabled: bool


def env() -> Env:
    """Read the environment fresh each time (cheap, and easy to test)."""
    default_db = f"sqlite:///{ROOT / 'data' / 'leads.db'}"
    return Env(
        database_url=_get("DATABASE_URL", default_db),
        public_base_url=_get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/"),
        admin_password=_get("ADMIN_PASSWORD"),
        google_places_api_key=_get("GOOGLE_PLACES_API_KEY"),
        hunter_api_key=_get("HUNTER_API_KEY"),
        neverbounce_api_key=_get("NEVERBOUNCE_API_KEY"),
        anthropic_api_key=_get("ANTHROPIC_API_KEY"),
        claude_model=_get("CLAUDE_MODEL", "claude-opus-5-5"),
        outreach_provider=_get("OUTREACH_PROVIDER", "dry_run").lower(),
        instantly_api_key=_get("INSTANTLY_API_KEY"),
        instantly_campaign_id=_get("INSTANTLY_CAMPAIGN_ID"),
        alert_webhook_url=_get("ALERT_WEBHOOK_URL"),
        scheduler_enabled=_get("SCHEDULER_ENABLED", "1") not in ("0", "false", "no"),
    )


def public_url(path: str) -> str:
    return f"{env().public_base_url}{path}"


def base_url_is_local() -> bool:
    base = env().public_base_url
    return any(h in base for h in ("localhost", "127.0.0.1", "0.0.0.0"))
