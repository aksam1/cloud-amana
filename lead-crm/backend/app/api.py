"""The API the dashboard talks to. Everything here sits under /api."""
import threading
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from . import ai, pipeline
from .config import base_url_is_local, env
from .db import get_db
from .models import STATUSES, JobRun, Lead, OutboxEmail, Reply
from .services import outreach, preview, replies
from .settings_store import get_settings, save_settings

router = APIRouter(prefix="/api")


# ---------- leads ----------


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=300)
    category: str = Field(default="", max_length=120)
    address: str = Field(default="", max_length=400)
    borough: str = Field(default="", max_length=80)
    phone: str = Field(default="", max_length=60)
    website: str = Field(default="", max_length=500)
    rating: float | None = Field(default=None, ge=0, le=5)
    email: str = Field(default="", max_length=320)
    email_verified: bool = False
    status: str = "New"
    notes: str = ""

    @field_validator("name", "category", "address", "borough", "phone", "website", "email")
    @classmethod
    def strip(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("status")
    @classmethod
    def known_status(cls, value: str) -> str:
        if value not in STATUSES:
            raise ValueError(f"status must be one of: {', '.join(STATUSES)}")
        return value

    @field_validator("email")
    @classmethod
    def email_shape(cls, value: str) -> str:
        if not value:
            return value or ""
        if "@" not in value or " " in value:
            raise ValueError("that does not look like an email address")
        return value.lower()


class LeadPatch(LeadIn):
    name: str | None = Field(default=None, min_length=1, max_length=300)
    status: str | None = None
    last_contacted: datetime | None = None

    @field_validator("status")
    @classmethod
    def known_status(cls, value):
        if value is not None and value not in STATUSES:
            raise ValueError(f"status must be one of: {', '.join(STATUSES)}")
        return value


def _lead_or_404(db: Session, lead_id: int) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(404, "Lead not found")
    return lead


@router.get("/leads")
def list_leads(
    status: str = "",
    category: str = "",
    borough: str = "",
    q: str = "",
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    query = select(Lead)
    if status:
        query = query.where(Lead.status == status)
    if category:
        query = query.where(Lead.category == category)
    if borough:
        query = query.where(Lead.borough == borough)
    if q.strip():
        like = f"%{q.strip()}%"
        query = query.where(or_(Lead.name.ilike(like), Lead.email.ilike(like), Lead.address.ilike(like)))
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    page_size = max(1, min(page_size, 200))
    page = max(1, page)
    rows = db.scalars(query.order_by(Lead.date_added.desc(), Lead.id.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return {"items": [lead.to_dict() for lead in rows], "total": total, "page": page, "page_size": page_size}


@router.post("/leads", status_code=201)
def create_lead(data: LeadIn, db: Session = Depends(get_db)):
    lead = Lead(**data.model_dump())
    db.add(lead)
    db.commit()
    return lead.to_dict()


@router.get("/leads/{lead_id}")
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    emails = db.scalars(select(OutboxEmail).where(OutboxEmail.lead_id == lead_id).order_by(OutboxEmail.id.desc())).all()
    lead_replies = db.scalars(select(Reply).where(Reply.lead_id == lead_id).order_by(Reply.id.desc())).all()
    return {
        **lead.to_dict(),
        "emails": [e.to_dict() for e in emails],
        "replies": [r.to_dict() for r in lead_replies],
        "send_problem": outreach.lead_problem(db, lead),
    }


@router.patch("/leads/{lead_id}")
def update_lead(lead_id: int, data: LeadPatch, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    changes = data.model_dump(exclude_unset=True)
    if changes.get("name") is None:
        changes.pop("name", None)
    if changes.get("status") is None:
        changes.pop("status", None)
    if lead.status == "Unsubscribed" and changes.get("status", "Unsubscribed") != "Unsubscribed":
        raise HTTPException(409, "This lead unsubscribed. That cannot be undone, so they are never emailed again.")
    if "email" in changes and changes["email"] != lead.email and "email_verified" not in changes:
        lead.email_verified = False  # a changed address has to be verified again
        lead.email_source = "manual" if changes["email"] else ""
    for field, value in changes.items():
        setattr(lead, field, value)
    if changes.get("status") == "Unsubscribed":
        outreach.instantly_block(lead.email)
    db.commit()
    return lead.to_dict()


@router.delete("/leads/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    if lead.status == "Unsubscribed":
        raise HTTPException(409, "Unsubscribed leads are kept so they are never emailed again.")
    for model in (OutboxEmail, Reply):
        for row in db.scalars(select(model).where(model.lead_id == lead_id)).all():
            db.delete(row)
    db.delete(lead)
    db.commit()


# ---------- actions on one lead ----------


@router.post("/leads/{lead_id}/find-email")
def lead_find_email(lead_id: int, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    if not lead.website:
        raise HTTPException(400, "This lead has no website to look at.")
    result = pipeline.find_email_for(db, lead)
    return {"result": result, "lead": lead.to_dict()}


@router.post("/leads/{lead_id}/score")
def lead_score(lead_id: int, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    result = pipeline.score_and_preview(db, lead, get_settings(db))
    return {"result": result, "lead": lead.to_dict()}


@router.post("/leads/{lead_id}/build-preview")
def lead_build_preview(lead_id: int, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    preview.build_preview(lead, get_settings(db)["preview_photo_count"])
    if lead.status in ("New", "Good Site"):
        lead.status = "Preview Built"
    db.commit()
    return {"lead": lead.to_dict()}


@router.post("/leads/{lead_id}/send")
def lead_send(lead_id: int, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    settings = get_settings(db)
    problems = outreach.setup_problems(settings)
    if problems:
        raise HTTPException(400, " ".join(problems))
    if not lead.preview_url:
        raise HTTPException(400, "Build a preview for this lead first.")
    if lead.status in ("Contacted", "Replied", "Yes", "No"):
        raise HTTPException(409, "This lead was already emailed.")
    if outreach.sent_today(db) >= settings["daily_email_cap"]:
        raise HTTPException(409, "Today's email limit is reached.")
    try:
        record = outreach.send_initial(db, lead, settings)
    except outreach.OutreachError as error:
        raise HTTPException(400, str(error))
    return {"email": record.to_dict(), "lead": lead.to_dict()}


class ReplyIn(BaseModel):
    body: str = Field(min_length=1, max_length=20000)
    subject: str = Field(default="", max_length=400)


@router.post("/leads/{lead_id}/replies", status_code=201)
def lead_add_reply(lead_id: int, data: ReplyIn, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    reply = replies.record_reply(db, lead, data.body, subject=data.subject)
    return {"reply": reply.to_dict(), "lead": lead.to_dict()}


@router.post("/leads/{lead_id}/seen")
def lead_seen(lead_id: int, db: Session = Depends(get_db)):
    lead = _lead_or_404(db, lead_id)
    lead.yes_seen = True
    db.commit()
    return {"ok": True}


# ---------- numbers for the dashboard ----------


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(Lead.status, func.count()).group_by(Lead.status)).all())
    by_status = {status: counts.get(status, 0) for status in STATUSES}
    total = sum(by_status.values())
    contacted = db.scalar(select(func.count()).select_from(Lead).where(Lead.last_contacted.is_not(None)))
    replied = db.scalar(select(func.count(func.distinct(Reply.lead_id))))
    categories = [c for c in db.scalars(select(Lead.category).distinct().order_by(Lead.category)).all() if c]
    boroughs = [b for b in db.scalars(select(Lead.borough).distinct().order_by(Lead.borough)).all() if b]
    new_yes = db.scalars(select(Lead).where(Lead.status == "Yes", Lead.yes_seen.is_(False))).all()
    return {
        "total": total,
        "by_status": by_status,
        "contacted": contacted,
        "replied": replied,
        "yes": by_status["Yes"],
        "categories": categories,
        "boroughs": boroughs,
        "statuses": STATUSES,
        "new_yes": [{"id": lead.id, "name": lead.name} for lead in new_yes],
        "sent_today": outreach.sent_today(db),
    }


# ---------- settings and connections ----------


@router.get("/settings")
def read_settings(db: Session = Depends(get_db)):
    return get_settings(db)


@router.put("/settings")
def write_settings(changes: dict, db: Session = Depends(get_db)):
    try:
        saved = save_settings(db, changes)
    except ValueError as error:
        raise HTTPException(400, str(error))
    from .scheduler import reschedule

    reschedule(saved["daily_run_hour"])
    return saved


@router.get("/connections")
def connections(db: Session = Depends(get_db)):
    """Which services are set up in .env. Never returns the keys themselves."""
    e = env()
    return {
        "google_places": bool(e.google_places_api_key),
        "hunter": bool(e.hunter_api_key),
        "neverbounce": bool(e.neverbounce_api_key),
        "claude": ai.is_configured(),
        "claude_model": e.claude_model,
        "outreach_provider": e.outreach_provider,
        "instantly": bool(e.instantly_api_key and e.instantly_campaign_id),
        "alert_webhook": bool(e.alert_webhook_url),
        "public_base_url": e.public_base_url,
        "public_base_url_is_local": base_url_is_local(),
        "password_protected": bool(e.admin_password),
        "outreach_problems": outreach.setup_problems(get_settings(db)),
    }


# ---------- jobs ----------


@router.get("/jobs")
def list_jobs(db: Session = Depends(get_db)):
    runs = db.scalars(select(JobRun).order_by(JobRun.id.desc()).limit(30)).all()
    return {
        "jobs": [{"name": name, "label": label} for name, (label, _) in pipeline.JOBS.items()],
        "running": pipeline.is_running(),
        "runs": [run.to_dict() for run in runs],
    }


@router.post("/jobs/{name}/run", status_code=202)
def start_job(name: str):
    if name not in pipeline.JOBS:
        raise HTTPException(404, "Unknown job")
    if pipeline.is_running():
        raise HTTPException(409, "Another job is still running. Wait for it to finish.")
    threading.Thread(target=pipeline.run_job, args=(name,), daemon=True).start()
    return {"started": name}


# ---------- sample data for trying Phase 1 ----------

SAMPLE_LEADS = [
    ("Sample: Marigold Pizza", "restaurant", "Brooklyn", "101 Example Ave, Brooklyn, NY 11201", "(718) 555-0101", 4.4),
    ("Sample: Corner Cut Barbers", "barber shop", "Queens", "22 Sample St, Queens, NY 11354", "(718) 555-0102", 4.8),
    ("Sample: Lotus Nail Studio", "nail salon", "Brooklyn", "305 Demo Blvd, Brooklyn, NY 11215", "(718) 555-0103", 4.1),
    ("Sample: Hudson Plumbing Co", "plumber", "Manhattan", "48 Placeholder Rd, New York, NY 10027", "(212) 555-0104", 4.6),
    ("Sample: Sunrise Bagels", "bakery", "Queens", "9 Test Plaza, Queens, NY 11101", "(718) 555-0105", 4.3),
    ("Sample: Greenpoint Auto Repair", "auto repair", "Brooklyn", "77 Mock Ln, Brooklyn, NY 11222", "(718) 555-0106", 3.9),
    ("Sample: Bella Hair Salon", "hair salon", "Bronx", "514 Fake Ave, Bronx, NY 10458", "(718) 555-0107", 4.7),
    ("Sample: Astoria Dry Cleaners", "dry cleaner", "Queens", "31 Pretend St, Queens, NY 11106", "(718) 555-0108", 4.0),
    ("Sample: Harbor Coffee House", "cafe", "Staten Island", "6 Sample Pier, Staten Island, NY 10301", "(718) 555-0109", 4.5),
    ("Sample: Uptown Flower Shop", "florist", "Manhattan", "250 Example Pl, New York, NY 10031", "(212) 555-0110", 4.9),
]


@router.post("/sample-leads", status_code=201)
def add_sample_leads(db: Session = Depends(get_db)):
    """Adds 10 made-up leads for trying the dashboard. They have no email, so they can never be emailed."""
    for name, category, borough, address, phone, rating in SAMPLE_LEADS:
        db.add(Lead(name=name, category=category, borough=borough, address=address, phone=phone, rating=rating,
                    notes="Made-up sample lead. Safe to delete."))
    db.commit()
    return {"added": len(SAMPLE_LEADS)}
