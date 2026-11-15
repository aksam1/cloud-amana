"""Phase 5: email outreach.

Two ways to send, chosen by OUTREACH_PROVIDER in .env:

- "dry_run" (the default): nothing is sent. Each email is written to the Outbox
  so you can read exactly what would go out.
- "instantly": the lead is added to your Instantly campaign, and Instantly
  sends the emails from your warmed-up inboxes.

NOTE: the Instantly calls below follow Instantly's API v2 as best known when
this was written, but they have NOT been run against a real Instantly account.
Test with one lead (your own email address) before turning automation on.
"""
import re
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import http
from ..config import base_url_is_local, env, public_url
from ..models import Lead, OutboxEmail, now

INSTANTLY_API = "https://api.instantly.ai/api/v2"


class OutreachError(Exception):
    pass


def template_values(lead: Lead, settings: dict) -> dict:
    return {
        "companyName": lead.name,
        "preview_url": public_url(f"/preview/{lead.id}"),
        "unsubscribe_url": public_url(f"/unsubscribe/{lead.unsubscribe_token}"),
        "price": str(settings["offer_price"]),
        "sender_name": settings["sender_name"],
        "business_name": settings["business_name"],
        "business_address": settings["business_address"],
    }


def fill(template: str, values: dict) -> str:
    return re.sub(r"\{\{\s*(\w+)\s*\}\}", lambda m: str(values.get(m.group(1), m.group(0))), template)


def setup_problems(settings: dict) -> list[str]:
    """Reasons outreach must not run yet. An empty list means it is safe to send."""
    problems = []
    if not settings["business_address"].strip():
        problems.append("Add your business address in Settings (required by the CAN-SPAM law).")
    if not settings["sender_name"].strip():
        problems.append("Add your name in Settings so emails are signed.")
    for name in ("email_body", "followup_body"):
        body = settings[name]
        if "{{unsubscribe_url}}" not in body.replace(" ", ""):
            problems.append(f"The {name.replace('_', ' ')} must include {{{{unsubscribe_url}}}}.")
        if "{{business_address}}" not in body.replace(" ", ""):
            problems.append(f"The {name.replace('_', ' ')} must include {{{{business_address}}}}.")
    provider = env().outreach_provider
    if provider == "instantly":
        if not env().instantly_api_key or not env().instantly_campaign_id:
            problems.append("Set INSTANTLY_API_KEY and INSTANTLY_CAMPAIGN_ID in .env.")
        if base_url_is_local():
            problems.append(
                "PUBLIC_BASE_URL points at this computer, so people could not open the preview or unsubscribe links. "
                "Put the app online and set PUBLIC_BASE_URL first."
            )
    elif provider != "dry_run":
        problems.append(f"OUTREACH_PROVIDER is '{provider}'. Use 'dry_run' or 'instantly'.")
    return problems


def lead_problem(db: Session, lead: Lead) -> str | None:
    """Why this one lead cannot be emailed, or None if it can."""
    if lead.status == "Unsubscribed":
        return "This lead unsubscribed."
    if not lead.email:
        return "No email address."
    if not lead.email_verified:
        return "The email address is not verified."
    blocked = db.scalar(
        select(func.count()).select_from(Lead).where(func.lower(Lead.email) == lead.email.lower(), Lead.status == "Unsubscribed")
    )
    if blocked:
        return "This email address unsubscribed (on another lead)."
    return None


def sent_today(db: Session) -> int:
    midnight = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.scalar(
        select(func.count()).select_from(OutboxEmail).where(OutboxEmail.kind == "initial", OutboxEmail.created_at >= midnight)
    )


def _instantly_headers() -> dict:
    return {"Authorization": f"Bearer {env().instantly_api_key}", "Content-Type": "application/json"}


def _instantly_add_lead(lead: Lead, values: dict) -> str:
    payload = {
        "campaign": env().instantly_campaign_id,
        "email": lead.email,
        "company_name": lead.name,
        "website": lead.website,
        "phone": lead.phone,
        "skip_if_in_workspace": True,
        "custom_variables": {k: v for k, v in values.items() if k != "companyName"},
    }
    with http.client(timeout=30) as client:
        response = client.post(f"{INSTANTLY_API}/leads", json=payload, headers=_instantly_headers())
    if response.status_code >= 300:
        raise OutreachError(f"Instantly said {response.status_code}: {response.text[:200]}")
    return str(response.json().get("id", ""))


def instantly_block(email: str) -> bool:
    """Tell Instantly never to email this address again (used when someone unsubscribes)."""
    if env().outreach_provider != "instantly" or not env().instantly_api_key or not email:
        return False
    try:
        with http.client(timeout=30) as client:
            response = client.post(
                f"{INSTANTLY_API}/block-lists-entries", json={"bl_value": email}, headers=_instantly_headers()
            )
        return response.status_code < 300
    except Exception:
        return False


def send_initial(db: Session, lead: Lead, settings: dict) -> OutboxEmail:
    """Send (or dry-run) the first email to one lead and mark it Contacted."""
    problem = lead_problem(db, lead)
    if problem:
        raise OutreachError(problem)
    values = template_values(lead, settings)
    provider = env().outreach_provider
    if provider == "instantly":
        lead.external_id = _instantly_add_lead(lead, values)
    record = OutboxEmail(
        lead_id=lead.id,
        kind="initial",
        provider=provider,
        to_email=lead.email,
        subject=fill(settings["email_subject"], values),
        body=fill(settings["email_body"], values),
    )
    db.add(record)
    lead.status = "Contacted"
    lead.last_contacted = now()
    lead.followup_sent = False
    db.commit()
    return record


def run_outreach(db: Session, settings: dict) -> dict:
    """Email leads that have a verified address and a preview, up to today's cap."""
    problems = setup_problems(settings)
    if problems:
        raise OutreachError(" ".join(problems))
    remaining = settings["daily_email_cap"] - sent_today(db)
    sent = skipped = 0
    if remaining > 0:
        leads = db.scalars(
            select(Lead)
            .where(Lead.status == "Preview Built", Lead.email != "", Lead.email_verified.is_(True))
            .order_by(Lead.date_added)
        ).all()
        for lead in leads:
            if sent >= remaining:
                break
            if lead_problem(db, lead):
                skipped += 1
                continue
            send_initial(db, lead, settings)
            sent += 1
    return {"sent": sent, "skipped": skipped, "followups": run_followups(db, settings)}


def run_followups(db: Session, settings: dict) -> int:
    """One follow-up, a few days after the first email, then stop for good.

    With Instantly, the follow-up itself is step 2 of your campaign there
    (see docs/instantly-setup.md); here it is only recorded.
    """
    cutoff = datetime.now() - timedelta(days=settings["followup_days"])
    leads = db.scalars(
        select(Lead).where(Lead.status == "Contacted", Lead.followup_sent.is_(False), Lead.last_contacted <= cutoff)
    ).all()
    count = 0
    for lead in leads:
        if lead_problem(db, lead):
            continue
        values = template_values(lead, settings)
        db.add(
            OutboxEmail(
                lead_id=lead.id,
                kind="followup",
                provider=env().outreach_provider,
                to_email=lead.email,
                subject=fill(settings["followup_subject"], values),
                body=fill(settings["followup_body"], values),
            )
        )
        lead.followup_sent = True
        lead.last_contacted = now()
        count += 1
    db.commit()
    return count
