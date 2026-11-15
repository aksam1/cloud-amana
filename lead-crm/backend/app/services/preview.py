"""Phase 4 (part 2): build a one-page website preview for a lead from a template."""
import json
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from ..config import public_url
from ..models import Lead
from . import places

_templates = Environment(
    loader=FileSystemLoader(Path(__file__).resolve().parents[1] / "templates"),
    autoescape=select_autoescape(["html"]),
)

# Each kind of business gets its own colours and wording. The wording stays
# general on purpose: the page must not claim facts we do not know (licences,
# delivery, prices) about a real business.
THEMES = {
    "food": {
        "words": ("restaurant", "pizza", "cafe", "coffee", "bakery", "deli", "bar", "grill", "food", "diner", "taqueria", "bagel", "juice", "kitchen"),
        "accent": "#b4421d", "dark": "#2a1a12", "soft": "#fbf3ea",
        "tagline": "Good food, made fresh, right in the neighborhood.",
        "about": "We're a local spot serving the neighborhood. Stop by, or give us a call to place an order.",
        "services": ["Made fresh every day", "A neighborhood favorite", "Call ahead to order"], "cta": "Call to order",
    },
    "beauty": {
        "words": ("salon", "barber", "nail", "spa", "hair", "beauty", "lash", "brow", "wax", "tattoo", "massage"),
        "accent": "#8a3f6b", "dark": "#241a22", "soft": "#fbf2f7",
        "tagline": "Look good. Feel good. Walk out happy.",
        "about": "We're a neighborhood shop that takes time with every client. Give us a call to book your visit.",
        "services": ["A friendly, skilled team", "A clean, relaxed space", "Call to book your visit"], "cta": "Call to book",
    },
    "trades": {
        "words": ("plumb", "electric", "contractor", "roof", "hvac", "locksmith", "auto", "repair", "mechanic", "clean", "landscap", "paint", "moving", "handyman", "laundr", "tailor"),
        "accent": "#1f5f8b", "dark": "#14212b", "soft": "#eff6fb",
        "tagline": "Reliable work, fair prices, done right the first time.",
        "about": "We're a local, hands-on team. Tell us what you need and we'll give you a straight answer and a fair price.",
        "services": ["Straight answers", "Fair prices", "A local team you can reach"], "cta": "Call for a quote",
    },
    "default": {
        "words": (),
        "accent": "#2f6b4f", "dark": "#17231d", "soft": "#f1f8f4",
        "tagline": "Proudly serving the neighborhood.",
        "about": "We're a local business that cares about our customers. Come by, give us a call, or send a message. We'd love to hear from you.",
        "services": ["Friendly service", "Local and independent", "Here when you need us"], "cta": "Call us",
    },
}


def pick_theme(category: str) -> dict:
    category = (category or "").lower()
    # Beauty is checked before food so "barber" is not mistaken for "bar".
    for name in ("beauty", "trades", "food"):
        if any(word in category for word in THEMES[name]["words"]):
            return THEMES[name]
    return THEMES["default"]


def build_preview(lead: Lead, photo_count: int = 3) -> str:
    """Prepare a lead's preview: fetch photo links (if any) and save the preview link."""
    if lead.photos and not lead.preview_photos:
        try:
            photos = places.resolve_photo_urls(lead.photos, photo_count)
        except Exception:
            photos = []
        lead.preview_photos_json = json.dumps(photos)
    lead.preview_url = public_url(f"/preview/{lead.id}")
    return lead.preview_url


def render_preview(lead: Lead) -> str:
    theme = pick_theme(lead.category)
    hours = []
    for line in lead.hours:
        day, _, times = line.partition(": ")
        hours.append({"day": day, "times": times or "Hours vary"})
    return _templates.get_template("preview.html").render(
        lead=lead,
        theme=theme,
        photos=lead.preview_photos,
        hours=hours,
        phone_link=re.sub(r"[^\d+]", "", lead.phone or ""),
        initial=(lead.name or "?").strip()[:1].upper(),
    )
