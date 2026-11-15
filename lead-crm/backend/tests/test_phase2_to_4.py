"""Phases 2 to 4: Google Maps search, email finding, website scoring and previews.

No real internet is used: the `web` fixture supplies made-up responses.
"""
from sqlalchemy import select

from app import ai, pipeline
from app.models import Lead
from app.services import email_finder, places, scoring
from app.settings_store import get_settings


def place(place_id, name, **extra):
    return {"id": place_id, "displayName": {"text": name}, "formattedAddress": "1 Main St, Brooklyn, NY", **extra}


# ---------- Phase 2 ----------


def test_search_adds_leads_without_duplicates_and_updates_changes(api, db, web, monkeypatch):
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "test-key")
    web.add(places.SEARCH_URL, json={"places": [
        place("p1", "Joe's Pizza", nationalPhoneNumber="(718) 555-0001", rating=4.2, websiteUri="https://joes.test",
              regularOpeningHours={"weekdayDescriptions": ["Monday: 9 AM – 5 PM"]},
              photos=[{"name": "places/p1/photos/abc", "authorAttributions": [{"displayName": "Sam"}]}]),
        place("p2", "Closed Cafe", businessStatus="CLOSED_PERMANENTLY"),
    ]})
    api.put("/api/settings", json={"categories": ["restaurant"], "boroughs": ["Brooklyn"]})

    first = pipeline.run_job("search")
    assert first["ok"], first["summary"]
    assert "1 new leads" in first["summary"] and "1 closed" in first["summary"]
    lead = db.scalar(select(Lead))
    assert (lead.name, lead.category, lead.borough, lead.phone) == ("Joe's Pizza", "restaurant", "Brooklyn", "(718) 555-0001")
    assert lead.hours == ["Monday: 9 AM – 5 PM"]
    assert lead.photos == [{"name": "places/p1/photos/abc", "credit": "Sam"}]

    # The request carried the key in a header and asked for the query we expect.
    request = web.requests[0]
    assert request.headers["X-Goog-Api-Key"] == "test-key"
    assert b"restaurant in Brooklyn, New York, NY" in request.content

    # Run again with a changed phone number: still one lead, phone updated.
    web.add(places.SEARCH_URL, json={"places": [place("p1", "Joe's Pizza", nationalPhoneNumber="(718) 555-9999", rating=4.2)]})
    second = pipeline.run_job("search")
    assert "0 new leads, 1 updated" in second["summary"]
    db.expire_all()
    leads = db.scalars(select(Lead)).all()
    assert len(leads) == 1 and leads[0].phone == "(718) 555-9999"
    assert leads[0].website == "https://joes.test"  # a blank from Google does not erase what we had


def test_search_follows_extra_pages(api, db, web, monkeypatch):
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "test-key")
    calls = {"n": 0}

    def paged(request):
        import httpx

        calls["n"] += 1
        if b"pageToken" in request.content:
            return httpx.Response(200, json={"places": [place("p2", "Second")]})
        return httpx.Response(200, json={"places": [place("p1", "First")], "nextPageToken": "tok"})

    import httpx

    from app import http

    monkeypatch.setattr(http, "transport", httpx.MockTransport(paged))
    assert [p["id"] for p in places.search_places("x", max_pages=3)] == ["p1", "p2"]
    assert calls["n"] == 2


def test_search_is_skipped_without_a_key_and_reports_google_errors(api, web, monkeypatch):
    assert "Skipped" in pipeline.run_job("search")["summary"]
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "bad")
    web.add(places.SEARCH_URL, status=403, json={"error": {"message": "API key not valid"}})
    failed = pipeline.run_job("search")
    assert failed["ok"] is False and "API key not valid" in failed["summary"]


# ---------- Phase 3 ----------

HOME = '<html><body><a href="/contact-us">Contact</a> made by <a href="mailto:hi@webagency.io">agency</a> <img src="logo@2x.png"></body></html>'


def test_email_found_on_the_contact_page(web):
    web.add("https://joes.test", html=HOME)
    web.add("https://joes.test/contact-us", html="<p>Write to INFO@joes.test or owner.joe@gmail.com</p>")
    # The business's own address wins; the web agency's address is ignored.
    assert email_finder.scrape_site_emails("joes.test") == ["info@joes.test", "owner.joe@gmail.com"]


def test_hunter_is_used_when_the_site_has_no_email_and_neverbounce_verifies(web, monkeypatch):
    monkeypatch.setenv("HUNTER_API_KEY", "h")
    monkeypatch.setenv("NEVERBOUNCE_API_KEY", "n")
    web.add("https://joes.test", html="<html><body>No email here</body></html>")
    web.add("https://api.hunter.io/v2/domain-search", json={"data": {"emails": [
        {"value": "bad@joes.test", "confidence": 99, "type": "personal"},
        {"value": "hello@joes.test", "confidence": 80, "type": "generic"},
    ]}})
    web.add("https://api.neverbounce.com/v4/single/check?key=n&email=hello%40joes.test", json={"status": "success", "result": "valid"})
    web.add("https://api.neverbounce.com/v4/single/check?key=n&email=bad%40joes.test", json={"status": "success", "result": "invalid"})
    assert email_finder.find_email("https://joes.test") == {"email": "hello@joes.test", "verified": True, "source": "hunter"}


def test_invalid_addresses_are_dropped_and_unknown_ones_kept_unverified(web, monkeypatch):
    monkeypatch.setenv("NEVERBOUNCE_API_KEY", "n")
    web.add("https://a.test", html="<p>info@a.test</p>")
    web.add("https://api.neverbounce.com", json={"status": "success", "result": "invalid"})
    assert email_finder.find_email("https://a.test")["email"] == ""
    web.add("https://api.neverbounce.com", json={"status": "success", "result": "catchall"})
    assert email_finder.find_email("https://a.test") == {"email": "info@a.test", "verified": False, "source": "website"}


def test_a_facebook_page_is_not_treated_as_a_website(web, monkeypatch):
    monkeypatch.setenv("HUNTER_API_KEY", "h")
    assert email_finder.is_platform_site("https://www.facebook.com/joespizza")
    assert email_finder.find_email("https://www.facebook.com/joespizza")["email"] == ""
    assert web.requests == []  # never asks Hunter for Facebook's own staff emails


def test_email_job_fills_emails_and_marks_no_email(api, db, web):
    web.add("https://joes.test", html="<p>info@joes.test</p>")
    web.add("https://none.test", html="<p>nothing</p>")
    a = api.post("/api/leads", json={"name": "Joe's", "website": "https://joes.test"}).json()
    b = api.post("/api/leads", json={"name": "None", "website": "https://none.test"}).json()
    c = api.post("/api/leads", json={"name": "No site"}).json()
    summary = pipeline.run_job("emails")["summary"]
    assert "Checked 3 leads: 1 emails found" in summary
    assert api.get(f"/api/leads/{a['id']}").json()["email"] == "info@joes.test"
    assert api.get(f"/api/leads/{a['id']}").json()["email_verified"] is False  # no NeverBounce key
    assert api.get(f"/api/leads/{b['id']}").json()["status"] == "No Email"
    assert api.get(f"/api/leads/{c['id']}").json()["status"] == "No Email"
    assert "Checked 0 leads" in pipeline.run_job("emails")["summary"]  # nobody is checked twice


# ---------- Phase 4 ----------

WEAK_SITE = "<html><head><title>Joes</title></head><body><table></table>Welcome</body></html>"


def test_weak_site_scored_by_claude_gets_a_preview(api, db, web, monkeypatch):
    web.add("https://joes.test", html=WEAK_SITE)
    asked = {}

    def fake_claude(system, user, schema):
        asked["user"] = user
        return {"score": 3, "reason": "Looks dated and has no contact details."}

    monkeypatch.setattr(ai, "ask_json", fake_claude)
    lead = api.post("/api/leads", json={"name": "Joe's <b>Pizza</b>", "website": "https://joes.test", "email": "info@joes.test",
                                        "category": "restaurant", "phone": "(718) 555-0001"}).json()
    assert "previews built" in pipeline.run_job("score")["summary"]

    lead = api.get(f"/api/leads/{lead['id']}").json()
    assert lead["site_score"] == 3
    assert lead["site_score_reason"] == "Looks dated and has no contact details."
    assert lead["status"] == "Preview Built"
    assert lead["preview_url"] == f"http://localhost:8000/preview/{lead['id']}"
    assert "mobile_viewport_tag: False" in asked["user"] and "Welcome" in asked["user"]

    page = api.get(f"/preview/{lead['id']}")
    assert page.status_code == 200
    assert "Joe&#39;s &lt;b&gt;Pizza&lt;/b&gt;" in page.text  # names are escaped, never run as HTML
    assert "<b>Pizza</b>" not in page.text
    assert "tel:7185550001" in page.text
    assert "noindex" in page.text


def test_good_site_is_skipped(api, web, monkeypatch):
    web.add("https://nice.test", html=WEAK_SITE)
    monkeypatch.setattr(ai, "ask_json", lambda *a: {"score": 8, "reason": "Modern and clear."})
    lead = api.post("/api/leads", json={"name": "Nice", "website": "https://nice.test", "email": "a@nice.test"}).json()
    pipeline.run_job("score")
    lead = api.get(f"/api/leads/{lead['id']}").json()
    assert (lead["status"], lead["site_score"], lead["preview_url"]) == ("Good Site", 8, "")
    assert api.get(f"/preview/{lead['id']}").status_code == 404


def test_no_site_broken_site_and_checklist_fallback(web):
    assert scoring.score_website("")["score"] == 0
    assert scoring.score_website("https://instagram.com/joes")["score"] == 1
    assert scoring.score_website("https://down.test") == {"score": 0, "reason": "The website returned an error (404).", "method": "none"}
    web.add("https://joes.test", html=WEAK_SITE)
    result = scoring.score_website("https://joes.test")  # no ANTHROPIC_API_KEY set
    assert result["method"] == "checklist" and result["score"] < 6
    assert "no AI" in result["reason"]
    good = '<html><head><meta name="viewport" content="x"><meta name="description" content="d"></head><body>' \
           + "word " * 200 + "<img><img><img> (718) 555-0001</body></html>"
    web.add("https://good.test", html=good)
    assert scoring.score_website("https://good.test")["score"] >= 6


def test_preview_uses_photos_and_hours_from_google(api, db, web, monkeypatch):
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "test-key")
    web.add("https://places.googleapis.com/v1/places/p1/photos/abc/media", json={"photoUri": "https://img.test/1.jpg"})
    lead = Lead(name="Corner Cuts", category="barber shop", email="a@b.test", google_place_id="p1",
                hours_json='["Monday: 9 AM – 5 PM"]', photos_json='[{"name": "places/p1/photos/abc", "credit": "Sam"}]')
    db.add(lead)
    db.commit()
    pipeline.score_and_preview(db, lead, get_settings(db))  # no website -> score 0 -> preview
    page = api.get(f"/preview/{lead.id}").text
    assert "https://img.test/1.jpg" in page and "Photos from Google Maps: Sam" in page
    assert "Monday" in page and "9 AM – 5 PM" in page
    assert "Call to book" in page  # the barber theme, not the "bar" (food) theme
