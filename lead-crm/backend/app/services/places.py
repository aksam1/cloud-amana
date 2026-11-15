"""Phase 2: find businesses with the Google Places API (Text Search, "New" version)."""
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import http
from ..config import env
from ..models import Lead

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
        "places.businessStatus",
        "places.regularOpeningHours.weekdayDescriptions",
        "places.photos",
        "nextPageToken",
    ]
)


class PlacesError(Exception):
    pass


def search_places(query: str, max_pages: int = 1) -> list[dict]:
    """Run one text search and return the raw places Google sends back."""
    key = env().google_places_api_key
    if not key:
        raise PlacesError("GOOGLE_PLACES_API_KEY is not set in .env")
    places, token = [], None
    with http.client(timeout=20) as client:
        for _ in range(max_pages):
            body = {"textQuery": query, "pageSize": 20}
            if token:
                body["pageToken"] = token
            response = client.post(
                SEARCH_URL,
                json=body,
                headers={"X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS},
            )
            if response.status_code != 200:
                try:
                    message = response.json()["error"]["message"]
                except Exception:
                    message = response.text[:200]
                raise PlacesError(f"Google Places said {response.status_code}: {message}")
            data = response.json()
            places.extend(data.get("places", []))
            token = data.get("nextPageToken")
            if not token:
                break
    return places


def _photo_refs(place: dict) -> list[dict]:
    refs = []
    for photo in (place.get("photos") or [])[:6]:
        authors = photo.get("authorAttributions") or []
        refs.append({"name": photo.get("name", ""), "credit": authors[0].get("displayName", "") if authors else ""})
    return [r for r in refs if r["name"]]


def save_places(db: Session, places: list[dict], category: str, borough: str) -> dict:
    """Add new businesses as leads; update phone, website and rating on ones we already have."""
    added = updated = skipped = 0
    for place in places:
        place_id = place.get("id")
        name = (place.get("displayName") or {}).get("text", "").strip()
        if not place_id or not name:
            continue
        if place.get("businessStatus") not in (None, "OPERATIONAL"):
            skipped += 1  # closed businesses are not worth contacting
            continue
        fresh = {
            "phone": place.get("nationalPhoneNumber") or "",
            "website": place.get("websiteUri") or "",
            "rating": place.get("rating"),
            "rating_count": place.get("userRatingCount"),
        }
        lead = db.scalar(select(Lead).where(Lead.google_place_id == place_id))
        if lead is None:
            db.add(
                Lead(
                    google_place_id=place_id,
                    name=name,
                    category=category,
                    borough=borough,
                    address=place.get("formattedAddress") or "",
                    maps_url=place.get("googleMapsUri") or "",
                    hours_json=json.dumps((place.get("regularOpeningHours") or {}).get("weekdayDescriptions") or []),
                    photos_json=json.dumps(_photo_refs(place)),
                    **fresh,
                )
            )
            db.flush()
            added += 1
            continue
        changed = False
        for field, value in fresh.items():
            if value not in (None, "") and getattr(lead, field) != value:
                setattr(lead, field, value)
                changed = True
        if changed:
            updated += 1
    db.commit()
    return {"added": added, "updated": updated, "skipped_closed": skipped}


def resolve_photo_urls(photo_refs: list[dict], count: int) -> list[dict]:
    """Turn Google photo references into image links for the preview page.

    Each photo is one paid Places API call, so `count` is kept small.
    """
    key = env().google_places_api_key
    if not key or count <= 0:
        return []
    photos = []
    with http.client(timeout=20) as client:
        for ref in photo_refs[:count]:
            response = client.get(
                f"https://places.googleapis.com/v1/{ref['name']}/media",
                params={"maxWidthPx": 1400, "skipHttpRedirect": "true", "key": key},
            )
            if response.status_code == 200 and response.json().get("photoUri"):
                photos.append({"url": response.json()["photoUri"], "credit": ref.get("credit", "")})
    return photos
