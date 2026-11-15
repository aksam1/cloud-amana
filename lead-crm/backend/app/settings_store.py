"""Dashboard settings (what to search for, limits, email wording), kept in the database."""
import json

from sqlalchemy.orm import Session

from .models import Setting

DEFAULT_SUBJECT = "A website preview for {{companyName}}"
DEFAULT_BODY = """Hi,

I'm {{sender_name}}. I build websites for local businesses, and I put together a quick preview of what a new site for {{companyName}} could look like:

{{preview_url}}

If you like it, I can turn it into your finished website for a flat ${{price}}. If not, no problem at all. Just reply to this email with any questions.

Thanks,
{{sender_name}}
{{business_name}}
{{business_address}}

Don't want to hear from me again? Unsubscribe here: {{unsubscribe_url}}
"""
DEFAULT_FOLLOWUP_SUBJECT = "Re: A website preview for {{companyName}}"
DEFAULT_FOLLOWUP_BODY = """Hi,

Just checking you saw the website preview I made for {{companyName}}:

{{preview_url}}

The offer of a finished site for ${{price}} still stands. This is my last email about it, so I won't bother you again.

Thanks,
{{sender_name}}
{{business_name}}
{{business_address}}

Unsubscribe here: {{unsubscribe_url}}
"""

DEFAULTS = {
    # Phase 2: what to search for
    "categories": ["restaurant", "barber shop", "nail salon"],
    "boroughs": ["Brooklyn", "Queens"],
    "max_pages_per_search": 1,  # 20 businesses per page, up to 3 pages
    # Daily schedule
    "daily_run_hour": 9,
    "auto_search": False,
    "auto_find_emails": False,
    "auto_score": False,
    "auto_outreach": False,
    "auto_replies": False,
    "batch_limit": 40,  # most leads handled per step per run (keeps API costs bounded)
    # Phase 4
    "score_threshold": 6,  # a score below this gets a preview
    "preview_photo_count": 3,
    # Phase 5
    "daily_email_cap": 30,
    "followup_days": 4,
    "offer_price": 500,
    "sender_name": "",
    "business_name": "",
    "business_address": "",
    "email_subject": DEFAULT_SUBJECT,
    "email_body": DEFAULT_BODY,
    "followup_subject": DEFAULT_FOLLOWUP_SUBJECT,
    "followup_body": DEFAULT_FOLLOWUP_BODY,
}

_INT_LIMITS = {
    "max_pages_per_search": (1, 3),
    "daily_run_hour": (0, 23),
    "batch_limit": (1, 500),
    "score_threshold": (1, 10),
    "preview_photo_count": (0, 6),
    "daily_email_cap": (0, 500),
    "followup_days": (1, 30),
    "offer_price": (0, 1_000_000),
}


def get_settings(db: Session) -> dict:
    row = db.get(Setting, 1)
    stored = json.loads(row.data_json) if row else {}
    return {**DEFAULTS, **{k: v for k, v in stored.items() if k in DEFAULTS}}


def save_settings(db: Session, changes: dict) -> dict:
    current = get_settings(db)
    for key, value in changes.items():
        if key not in DEFAULTS:
            continue
        default = DEFAULTS[key]
        if isinstance(default, bool):
            value = bool(value)
        elif isinstance(default, int):
            try:
                value = int(value)
            except (TypeError, ValueError):
                raise ValueError(f"{key} must be a whole number")
            low, high = _INT_LIMITS[key]
            if not low <= value <= high:
                raise ValueError(f"{key} must be between {low} and {high}")
        elif isinstance(default, list):
            if not isinstance(value, list):
                raise ValueError(f"{key} must be a list")
            cleaned = []
            for item in value:
                item = str(item).strip()
                if item and item not in cleaned:
                    cleaned.append(item)
            value = cleaned
        else:
            value = str(value)
        current[key] = value
    row = db.get(Setting, 1)
    if row is None:
        row = Setting(id=1)
        db.add(row)
    row.data_json = json.dumps(current)
    db.commit()
    return current
