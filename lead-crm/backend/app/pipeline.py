"""The jobs: each phase's work, runnable by hand ("Run now") or by the daily schedule."""
import logging
import threading

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import db as database
from .config import env
from .models import JobRun, Lead, now
from .services import email_finder, outreach, places, preview, replies, scoring
from .settings_store import get_settings

log = logging.getLogger("leadcrm.jobs")


# ---------- one lead at a time (also used by the buttons on a lead's page) ----------


def find_email_for(db: Session, lead: Lead) -> dict:
    result = email_finder.find_email(lead.website) if lead.website else {"email": "", "verified": False, "source": ""}
    lead.email_checked = True
    if result["email"]:
        lead.email = result["email"]
        lead.email_verified = result["verified"]
        lead.email_source = result["source"]
        if lead.status == "No Email":
            lead.status = "New"
    elif lead.status == "New":
        lead.status = "No Email"
    db.commit()
    return result


def score_and_preview(db: Session, lead: Lead, settings: dict) -> dict:
    """Score the lead's website; a weak site (or none) gets a preview page."""
    result = scoring.score_website(lead.website)
    lead.site_score = result["score"]
    lead.site_score_reason = result["reason"]
    if result["score"] < settings["score_threshold"]:
        preview.build_preview(lead, settings["preview_photo_count"])
        if lead.status in ("New", "No Email", "Good Site"):
            lead.status = "Preview Built" if lead.email else lead.status
    elif lead.status == "New":
        lead.status = "Good Site"
    db.commit()
    return result


# ---------- the jobs ----------


def job_search(db: Session, settings: dict) -> str:
    if not env().google_places_api_key:
        return "Skipped: GOOGLE_PLACES_API_KEY is not set."
    totals = {"added": 0, "updated": 0, "skipped_closed": 0}
    searches = 0
    for category in settings["categories"]:
        for borough in settings["boroughs"]:
            found = places.search_places(f"{category} in {borough}, New York, NY", settings["max_pages_per_search"])
            for key, value in places.save_places(db, found, category, borough).items():
                totals[key] += value
            searches += 1
    return f"{searches} searches: {totals['added']} new leads, {totals['updated']} updated, {totals['skipped_closed']} closed businesses skipped."


def job_emails(db: Session, settings: dict) -> str:
    leads = db.scalars(
        select(Lead).where(Lead.status == "New", Lead.email == "", Lead.email_checked.is_(False)).limit(settings["batch_limit"])
    ).all()
    found = verified = 0
    for lead in leads:
        result = find_email_for(db, lead)
        found += bool(result["email"])
        verified += bool(result["verified"])
    note = "" if env().neverbounce_api_key else " (No NeverBounce key, so none could be verified.)"
    return f"Checked {len(leads)} leads: {found} emails found, {verified} verified, {len(leads) - found} marked No Email.{note}"


def job_score(db: Session, settings: dict) -> str:
    leads = db.scalars(
        select(Lead).where(Lead.status == "New", Lead.email != "", Lead.site_score.is_(None)).limit(settings["batch_limit"])
    ).all()
    previews = 0
    for lead in leads:
        score_and_preview(db, lead, settings)
        previews += lead.status == "Preview Built"
    method = "Claude" if env().anthropic_api_key else "the basic checklist (no ANTHROPIC_API_KEY)"
    return f"Scored {len(leads)} websites with {method}: {previews} previews built, {len(leads) - previews} sites good enough to skip."


def job_outreach(db: Session, settings: dict) -> str:
    result = outreach.run_outreach(db, settings)
    mode = "DRY RUN, nothing really sent" if env().outreach_provider == "dry_run" else "sent through Instantly"
    return f"{result['sent']} first emails and {result['followups']} follow-ups ({mode}). {result['skipped']} skipped."


def job_replies(db: Session, settings: dict) -> str:
    result = replies.pull_replies(db)
    if "note" in result:
        return result["note"]
    return f"{result['new']} new replies sorted, {result['unmatched']} from addresses that match no lead."


JOBS = {
    "search": ("Search Google Maps", job_search),
    "emails": ("Find emails", job_emails),
    "score": ("Score websites and build previews", job_score),
    "outreach": ("Send emails", job_outreach),
    "replies": ("Read replies", job_replies),
}
DAILY_ORDER = [("replies", "auto_replies"), ("search", "auto_search"), ("emails", "auto_find_emails"), ("score", "auto_score"), ("outreach", "auto_outreach")]

_running = threading.Lock()


def is_running() -> bool:
    return _running.locked()


def run_job(name: str) -> dict | None:
    """Run one job now. Returns None if another job is already running."""
    if not _running.acquire(blocking=False):
        return None
    db = database.session()
    run = JobRun(job=name)
    db.add(run)
    db.commit()
    try:
        run.summary = JOBS[name][1](db, get_settings(db))
        run.ok = True
    except Exception as error:  # a failed job must never crash the app
        log.exception("Job %s failed", name)
        db.rollback()
        run = db.get(JobRun, run.id)
        run.summary = f"Failed: {error}"
        run.ok = False
    finally:
        run.finished_at = now()
        db.commit()
        result = run.to_dict()
        db.close()
        _running.release()
    return result


def run_daily() -> None:
    """The daily schedule: run each step that is switched on in Settings."""
    db = database.session()
    settings = get_settings(db)
    db.close()
    for name, switch in DAILY_ORDER:
        if settings[switch]:
            run_job(name)
