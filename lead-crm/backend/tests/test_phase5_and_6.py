"""Phases 5 and 6: outreach rules, unsubscribes, follow-ups and reply sorting."""
import json
from datetime import timedelta

import pytest
from sqlalchemy import select

from app import ai, pipeline
from app.models import Lead, OutboxEmail, Reply, now
from app.services import outreach, replies

READY = {"sender_name": "Sam", "business_name": "Sam Web Design", "business_address": "1 Main St, New York, NY 10001"}


def ready_lead(db, name="Joe's Pizza", email="info@joes.test", verified=True, **extra):
    fields = {"status": "Preview Built", "preview_url": "http://localhost:8000/preview/1", **extra}
    lead = Lead(name=name, email=email, email_verified=verified, **fields)
    db.add(lead)
    db.commit()
    return lead


# ---------- Phase 5 ----------


def test_outreach_refuses_to_run_until_the_legal_basics_are_set(api, db):
    ready_lead(db)
    run = pipeline.run_job("outreach")
    assert run["ok"] is False and "business address" in run["summary"]
    assert db.scalar(select(Lead)).status == "Preview Built"

    api.put("/api/settings", json={**READY, "email_body": "Hi {{companyName}}, no way out of this email"})
    run = pipeline.run_job("outreach")
    assert run["ok"] is False and "unsubscribe_url" in run["summary"]


def test_dry_run_writes_the_email_to_the_outbox_and_marks_contacted(api, db):
    api.put("/api/settings", json=READY)
    lead = ready_lead(db)
    run = pipeline.run_job("outreach")
    assert run["ok"] and "1 first emails" in run["summary"] and "DRY RUN" in run["summary"]

    db.expire_all()
    assert lead.status == "Contacted" and lead.last_contacted is not None
    email = db.scalar(select(OutboxEmail))
    assert (email.kind, email.provider, email.to_email) == ("initial", "dry_run", "info@joes.test")
    assert email.subject == "A website preview for Joe's Pizza"
    assert f"http://localhost:8000/preview/{lead.id}" in email.body
    assert f"http://localhost:8000/unsubscribe/{lead.unsubscribe_token}" in email.body
    assert "1 Main St, New York, NY 10001" in email.body and "$500" in email.body
    assert "{{" not in email.body

    assert "0 first emails" in pipeline.run_job("outreach")["summary"]  # nobody is emailed twice


def test_only_verified_emails_are_sent_and_the_daily_cap_holds(api, db):
    api.put("/api/settings", json={**READY, "daily_email_cap": 2})
    ready_lead(db, name="Unverified", email="u@u.test", verified=False)
    for i in range(4):
        ready_lead(db, name=f"Lead {i}", email=f"l{i}@x.test")
    assert "2 first emails" in pipeline.run_job("outreach")["summary"]
    assert "0 first emails" in pipeline.run_job("outreach")["summary"]  # cap reached for today
    db.expire_all()
    statuses = {lead.name: lead.status for lead in db.scalars(select(Lead)).all()}
    assert statuses["Unverified"] == "Preview Built"
    assert sorted(statuses.values()).count("Contacted") == 2


def test_one_follow_up_after_four_days_then_stop(api, db):
    api.put("/api/settings", json=READY)
    lead = ready_lead(db)
    pipeline.run_job("outreach")
    assert "0 follow-ups" in pipeline.run_job("outreach")["summary"]  # too soon

    db.expire_all()
    lead.last_contacted = now() - timedelta(days=4, hours=1)
    db.commit()
    assert "1 follow-ups" in pipeline.run_job("outreach")["summary"]
    db.expire_all()
    assert lead.followup_sent is True

    lead.last_contacted = now() - timedelta(days=30)
    db.commit()
    assert "0 follow-ups" in pipeline.run_job("outreach")["summary"]  # never a second follow-up
    kinds = [e.kind for e in db.scalars(select(OutboxEmail).order_by(OutboxEmail.id)).all()]
    assert kinds == ["initial", "followup"]


def test_unsubscribe_link_is_permanent(api, db):
    api.put("/api/settings", json=READY)
    lead = ready_lead(db)
    twin = ready_lead(db, name="Same owner, second shop", email="INFO@joes.test")
    link = f"/unsubscribe/{lead.unsubscribe_token}"

    assert api.get("/unsubscribe/not-a-real-token").status_code == 404
    assert "Yes, unsubscribe me" in api.get(link).text
    db.expire_all()
    assert lead.status == "Preview Built"  # only opening the link changes nothing
    assert "unsubscribed" in api.post(link).text
    db.expire_all()
    assert lead.status == "Unsubscribed"

    # Never emailed again: not this lead, and not another lead with the same address.
    assert "0 first emails" in pipeline.run_job("outreach")["summary"]
    db.expire_all()
    assert twin.status == "Preview Built"
    # Cannot be undone or deleted from the dashboard.
    assert api.patch(f"/api/leads/{lead.id}", json={"status": "New"}).status_code == 409
    assert api.delete(f"/api/leads/{lead.id}").status_code == 409
    assert api.post(f"/api/leads/{lead.id}/send").status_code == 400


def test_no_follow_up_after_a_reply_or_unsubscribe(api, db):
    api.put("/api/settings", json=READY)
    replied, unsubscribed = ready_lead(db, name="A", email="a@a.test"), ready_lead(db, name="B", email="b@b.test")
    pipeline.run_job("outreach")
    api.post(f"/api/leads/{replied.id}/replies", json={"body": "What does it cost per month?"})
    api.post(f"/unsubscribe/{unsubscribed.unsubscribe_token}")
    db.expire_all()
    for lead in (replied, unsubscribed):
        lead.last_contacted = now() - timedelta(days=10)
    db.commit()
    assert "0 follow-ups" in pipeline.run_job("outreach")["summary"]


def test_instantly_needs_a_public_address_and_gets_the_right_lead(api, db, web, monkeypatch):
    monkeypatch.setenv("OUTREACH_PROVIDER", "instantly")
    monkeypatch.setenv("INSTANTLY_API_KEY", "inst-key")
    monkeypatch.setenv("INSTANTLY_CAMPAIGN_ID", "camp-1")
    api.put("/api/settings", json=READY)
    lead = ready_lead(db)
    run = pipeline.run_job("outreach")
    assert run["ok"] is False and "PUBLIC_BASE_URL" in run["summary"]  # localhost links would be dead

    monkeypatch.setenv("PUBLIC_BASE_URL", "https://crm.example.org")
    web.add("https://api.instantly.ai/api/v2/leads", json={"id": "inst-lead-9"})
    assert "1 first emails" in pipeline.run_job("outreach")["summary"]
    request = next(r for r in web.requests if r.url.path == "/api/v2/leads")
    sent = json.loads(request.content)
    assert request.headers["Authorization"] == "Bearer inst-key"
    assert (sent["campaign"], sent["email"], sent["company_name"]) == ("camp-1", "info@joes.test", "Joe's Pizza")
    assert sent["custom_variables"]["preview_url"] == f"https://crm.example.org/preview/{lead.id}"
    assert sent["custom_variables"]["unsubscribe_url"].startswith("https://crm.example.org/unsubscribe/")
    db.expire_all()
    assert lead.external_id == "inst-lead-9" and lead.status == "Contacted"

    # Unsubscribing also tells Instantly to block the address.
    web.add("https://api.instantly.ai/api/v2/block-lists-entries", json={"id": "b1"})
    api.post(f"/unsubscribe/{lead.unsubscribe_token}")
    block = next(r for r in web.requests if r.url.path == "/api/v2/block-lists-entries")
    assert json.loads(block.content) == {"bl_value": "info@joes.test"}


def test_instantly_error_stops_the_run_and_leaves_the_lead_alone(api, db, web, monkeypatch):
    monkeypatch.setenv("OUTREACH_PROVIDER", "instantly")
    monkeypatch.setenv("INSTANTLY_API_KEY", "k")
    monkeypatch.setenv("INSTANTLY_CAMPAIGN_ID", "c")
    monkeypatch.setenv("PUBLIC_BASE_URL", "https://crm.example.org")
    api.put("/api/settings", json=READY)
    lead = ready_lead(db)
    web.add("https://api.instantly.ai/api/v2/leads", status=401, json={"message": "Invalid API key"})
    run = pipeline.run_job("outreach")
    assert run["ok"] is False and "401" in run["summary"]
    db.expire_all()
    assert lead.status == "Preview Built" and db.scalar(select(OutboxEmail)) is None


# ---------- Phase 6 ----------


@pytest.mark.parametrize("text,expected", [
    ("Yes, let's do it. How do I pay?", "Question"),  # has a question mark: left for a person
    ("Sounds good, sign me up", "Yes"),
    ("Not interested, thanks.", "No"),
    ("Please remove me from your list", "Unsubscribe"),
    ("STOP EMAILING ME this is spam", "Unsubscribe"),
    ("I am out of the office until Monday.", "Other"),
    ("Who are you and how much is hosting?", "Question"),
    ("hmm", "Question"),
])
def test_keyword_sorting_without_ai(text, expected):
    assert replies.keyword_classify(text)[0] == expected


def test_quoted_original_email_is_ignored():
    body = "Not interested.\n\nOn Mon, Jan 5, 2026 at 9:00 AM Sam <sam@x.test> wrote:\n> yes sign me up for a website"
    assert replies.strip_quoted(body) == "Not interested."
    assert replies.classify(body)["category"] == "No"


def test_pasted_reply_sorted_by_claude_updates_the_lead_and_alerts(api, db, web, monkeypatch):
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://hooks.test/abc")
    web.add("https://hooks.test/abc", json={})
    seen = {}

    def fake_claude(system, user, schema):
        seen["user"] = user
        return {"category": "Yes", "reason": "They want to go ahead."}

    monkeypatch.setattr(ai, "ask_json", fake_claude)
    lead = ready_lead(db, status="Contacted")
    result = api.post(f"/api/leads/{lead.id}/replies", json={"body": "Love it. Let's go ahead!"}).json()
    assert result["reply"]["category"] == "Yes" and result["reply"]["classifier"] == "claude"
    assert result["lead"]["status"] == "Yes"
    assert "Love it" in seen["user"]

    stats = api.get("/api/stats").json()
    assert stats["new_yes"] == [{"id": lead.id, "name": "Joe's Pizza"}] and stats["replied"] == 1
    alert = next(r for r in web.requests if r.url.host == "hooks.test")
    assert "Joe's Pizza" in json.loads(alert.content)["text"]
    api.post(f"/api/leads/{lead.id}/seen")
    assert api.get("/api/stats").json()["new_yes"] == []


@pytest.mark.parametrize("category,status", [("No", "No"), ("Question", "Replied"), ("Unsubscribe", "Unsubscribed"), ("Other", "Replied")])
def test_each_category_sets_the_right_status(api, db, monkeypatch, category, status):
    monkeypatch.setattr(ai, "ask_json", lambda *a: {"category": category, "reason": "r"})
    lead = ready_lead(db)
    assert api.post(f"/api/leads/{lead.id}/replies", json={"body": "x"}).json()["lead"]["status"] == status


def test_an_unsubscribe_reply_can_never_be_overturned(api, db, monkeypatch):
    lead = ready_lead(db)
    monkeypatch.setattr(ai, "ask_json", lambda *a: {"category": "Unsubscribe", "reason": "r"})
    api.post(f"/api/leads/{lead.id}/replies", json={"body": "remove me"})
    monkeypatch.setattr(ai, "ask_json", lambda *a: {"category": "Yes", "reason": "r"})
    assert api.post(f"/api/leads/{lead.id}/replies", json={"body": "actually yes"}).json()["lead"]["status"] == "Unsubscribed"


def test_replies_are_pulled_from_instantly_once_each(api, db, web, monkeypatch):
    monkeypatch.setenv("OUTREACH_PROVIDER", "instantly")
    monkeypatch.setenv("INSTANTLY_API_KEY", "k")
    monkeypatch.setenv("INSTANTLY_CAMPAIGN_ID", "camp-1")
    lead = ready_lead(db, status="Contacted")
    web.add("https://api.instantly.ai/api/v2/emails", json={"items": [
        {"id": "e1", "from_address_email": "Info@Joes.test", "subject": "Re: preview", "body": {"text": "Not interested, thanks"}},
        {"id": "e2", "from_address_email": "stranger@else.test", "subject": "hi", "body": {"html": "<p>hello</p>"}},
    ]})
    assert "1 new replies sorted, 1 from addresses that match no lead" in pipeline.run_job("replies")["summary"]
    db.expire_all()
    assert lead.status == "No"
    assert "0 new replies" in pipeline.run_job("replies")["summary"]  # the same reply is not counted twice
    assert len(db.scalars(select(Reply)).all()) == 1


def test_replies_job_without_a_sending_tool_says_what_to_do(api):
    assert "Paste replies" in pipeline.run_job("replies")["summary"]
