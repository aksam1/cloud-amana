"""The database tables."""
import json
import secrets
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base

STATUSES = [
    "New",
    "No Email",
    "Good Site",
    "Preview Built",
    "Contacted",
    "Replied",
    "Yes",
    "No",
    "Unsubscribed",
]


def now() -> datetime:
    return datetime.now().replace(microsecond=0)


def _token() -> str:
    return secrets.token_urlsafe(16)


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    google_place_id: Mapped[str | None] = mapped_column(String(200), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(300))
    category: Mapped[str] = mapped_column(String(120), default="")
    address: Mapped[str] = mapped_column(String(400), default="")
    borough: Mapped[str] = mapped_column(String(80), default="")
    phone: Mapped[str] = mapped_column(String(60), default="")
    website: Mapped[str] = mapped_column(String(500), default="")
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    rating_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    maps_url: Mapped[str] = mapped_column(String(500), default="")

    email: Mapped[str] = mapped_column(String(320), default="")
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_source: Mapped[str] = mapped_column(String(40), default="")
    email_checked: Mapped[bool] = mapped_column(Boolean, default=False)

    site_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    site_score_reason: Mapped[str] = mapped_column(Text, default="")
    preview_url: Mapped[str] = mapped_column(String(500), default="")

    status: Mapped[str] = mapped_column(String(30), default="New", index=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    date_added: Mapped[datetime] = mapped_column(DateTime, default=now)
    last_contacted: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    followup_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    # Extras used to build the preview page (stored as JSON text).
    hours_json: Mapped[str] = mapped_column(Text, default="[]")
    photos_json: Mapped[str] = mapped_column(Text, default="[]")  # Google photo references
    preview_photos_json: Mapped[str] = mapped_column(Text, default="[]")  # resolved URLs

    unsubscribe_token: Mapped[str] = mapped_column(String(64), default=_token, index=True)
    yes_seen: Mapped[bool] = mapped_column(Boolean, default=False)
    external_id: Mapped[str] = mapped_column(String(120), default="")  # id in the sending tool

    @property
    def hours(self) -> list:
        return json.loads(self.hours_json or "[]")

    @property
    def photos(self) -> list:
        return json.loads(self.photos_json or "[]")

    @property
    def preview_photos(self) -> list:
        return json.loads(self.preview_photos_json or "[]")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "google_place_id": self.google_place_id,
            "name": self.name,
            "category": self.category,
            "address": self.address,
            "borough": self.borough,
            "phone": self.phone,
            "website": self.website,
            "rating": self.rating,
            "rating_count": self.rating_count,
            "maps_url": self.maps_url,
            "email": self.email,
            "email_verified": self.email_verified,
            "email_source": self.email_source,
            "email_checked": self.email_checked,
            "site_score": self.site_score,
            "site_score_reason": self.site_score_reason,
            "preview_url": self.preview_url,
            "status": self.status,
            "notes": self.notes,
            "date_added": self.date_added.isoformat() if self.date_added else None,
            "last_contacted": self.last_contacted.isoformat() if self.last_contacted else None,
            "followup_sent": self.followup_sent,
            "hours": self.hours,
        }


class Setting(Base):
    """One row holding all the dashboard settings as JSON."""

    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data_json: Mapped[str] = mapped_column(Text, default="{}")


class JobRun(Base):
    """A record of each time a job ran, shown on the Automation page."""

    __tablename__ = "job_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job: Mapped[str] = mapped_column(String(40))
    started_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    summary: Mapped[str] = mapped_column(Text, default="")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "job": self.job,
            "started_at": self.started_at.isoformat(),
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "ok": self.ok,
            "summary": self.summary,
        }


class OutboxEmail(Base):
    """Every email the app sent, or would have sent in dry-run mode."""

    __tablename__ = "outbox"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))  # "initial" or "followup"
    provider: Mapped[str] = mapped_column(String(20))
    to_email: Mapped[str] = mapped_column(String(320))
    subject: Mapped[str] = mapped_column(String(400))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "kind": self.kind,
            "provider": self.provider,
            "to_email": self.to_email,
            "subject": self.subject,
            "body": self.body,
            "created_at": self.created_at.isoformat(),
        }


class Reply(Base):
    __tablename__ = "replies"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
    external_id: Mapped[str | None] = mapped_column(String(200), unique=True, nullable=True)
    from_email: Mapped[str] = mapped_column(String(320), default="")
    subject: Mapped[str] = mapped_column(String(400), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    received_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    category: Mapped[str] = mapped_column(String(20), default="")
    reason: Mapped[str] = mapped_column(Text, default="")
    classifier: Mapped[str] = mapped_column(String(20), default="")  # "claude" or "keywords"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "from_email": self.from_email,
            "subject": self.subject,
            "body": self.body,
            "received_at": self.received_at.isoformat(),
            "category": self.category,
            "reason": self.reason,
            "classifier": self.classifier,
        }
