"""Phase 1: the CRM itself (add, edit, filter, search, statuses, numbers)."""
from app.models import STATUSES


def make(api, **fields):
    response = api.post("/api/leads", json={"name": "Joe's Pizza", **fields})
    assert response.status_code == 201, response.text
    return response.json()


def test_add_and_read_a_lead(api):
    lead = make(api, category="restaurant", phone="(718) 555-0100", rating=4.5)
    assert lead["status"] == "New"
    assert lead["date_added"]
    fetched = api.get(f"/api/leads/{lead['id']}").json()
    assert fetched["name"] == "Joe's Pizza"
    assert fetched["emails"] == [] and fetched["replies"] == []


def test_a_lead_can_move_through_every_status(api):
    lead = make(api)
    for status in STATUSES:
        if status == "Unsubscribed":
            continue
        response = api.patch(f"/api/leads/{lead['id']}", json={"status": status})
        assert response.status_code == 200
        assert response.json()["status"] == status


def test_unknown_status_is_rejected(api):
    lead = make(api)
    assert api.patch(f"/api/leads/{lead['id']}", json={"status": "Banana"}).status_code == 422
    assert api.post("/api/leads", json={"name": ""}).status_code == 422
    assert api.post("/api/leads", json={"name": "X", "email": "not an email"}).status_code == 422


def test_filter_by_status_and_category_and_search_by_name(api):
    make(api, name="Joe's Pizza", category="restaurant", status="New")
    make(api, name="Corner Cuts", category="barber shop", status="Contacted")
    make(api, name="Pizza Palace", category="restaurant", status="Contacted")

    def names(**params):
        return sorted(lead["name"] for lead in api.get("/api/leads", params=params).json()["items"])

    assert names(status="Contacted") == ["Corner Cuts", "Pizza Palace"]
    assert names(category="restaurant") == ["Joe's Pizza", "Pizza Palace"]
    assert names(status="Contacted", category="restaurant") == ["Pizza Palace"]
    assert names(q="pizza") == ["Joe's Pizza", "Pizza Palace"]
    assert names(q="zzz") == []


def test_edit_and_delete(api):
    lead = make(api)
    edited = api.patch(f"/api/leads/{lead['id']}", json={"notes": "Called, ask for Maria", "phone": "555"}).json()
    assert edited["notes"] == "Called, ask for Maria"
    assert edited["name"] == "Joe's Pizza"  # untouched fields stay as they were
    assert api.delete(f"/api/leads/{lead['id']}").status_code == 204
    assert api.get(f"/api/leads/{lead['id']}").status_code == 404


def test_changing_the_email_clears_verified(api):
    lead = make(api, email="a@joes.com", email_verified=True)
    edited = api.patch(f"/api/leads/{lead['id']}", json={"email": "b@joes.com"}).json()
    assert edited["email"] == "b@joes.com"
    assert edited["email_verified"] is False


def test_stats_bar_counts_each_status(api):
    make(api)
    make(api, status="Yes")
    make(api, status="Yes")
    stats = api.get("/api/stats").json()
    assert stats["total"] == 3
    assert stats["by_status"]["New"] == 1
    assert stats["by_status"]["Yes"] == 2
    assert [lead["name"] for lead in stats["new_yes"]] == ["Joe's Pizza", "Joe's Pizza"]


def test_ten_sample_leads(api):
    assert api.post("/api/sample-leads").json()["added"] == 10
    leads = api.get("/api/leads").json()
    assert leads["total"] == 10
    assert all(lead["email"] == "" for lead in leads["items"])  # can never be emailed


def test_password_protects_the_dashboard_but_not_public_pages(api, monkeypatch):
    monkeypatch.setenv("ADMIN_PASSWORD", "s3cret")
    assert api.get("/api/leads").status_code == 401
    assert api.get("/api/leads", auth=("me", "wrong")).status_code == 401
    assert api.get("/api/leads", auth=("me", "s3cret")).status_code == 200
    assert api.get("/health").status_code == 200
    assert api.get("/preview/999").status_code == 404  # public: "not found", not "password needed"


def test_settings_are_saved_and_checked(api):
    saved = api.put("/api/settings", json={"categories": ["  florist ", "florist", ""], "daily_email_cap": 20}).json()
    assert saved["categories"] == ["florist"]
    assert api.get("/api/settings").json()["daily_email_cap"] == 20
    assert api.put("/api/settings", json={"daily_run_hour": 99}).status_code == 400
