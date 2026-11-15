# Lead CRM: project brief

This is its own project. It is unrelated to the Amanah story app in the parent folder, and the content
rules in the parent `CLAUDE.md` do not apply here.

## Goal

Every day, find small businesses in New York City on Google Maps, save them as leads, find their email,
score their website, build a preview website for those with a weak site or none, email them a $500
website offer with the preview link, and track replies.

## Stack

React + Vite frontend (plain CSS), Python FastAPI backend, SQLite to start (set `DATABASE_URL` to switch
to Postgres), APScheduler for the daily job. API keys live in `.env`, never in code.

## Lead fields

id, google_place_id (unique), name, category, address, borough, phone, website, rating, email,
email_verified, site_score, preview_url, status, notes, date_added, last_contacted, followup_sent.

Statuses: New, No Email, Good Site, Preview Built, Contacted, Replied, Yes, No, Unsubscribed.
("Good Site" was added for leads whose site scored well enough to skip.)

## Phases (all six are built)

1. CRM dashboard: lead table, filters, search, detail page, status changes, stats bar.
2. Daily Google Places search by category and borough from Settings. No duplicates (google_place_id).
3. Email finding: scrape homepage and contact page, then Hunter.io, verify with NeverBounce.
4. Website scoring with the Claude API (0 to 10 plus a reason). Under 6 or no site: preview at `/preview/{id}`.
5. Outreach through Instantly, with a daily cap, one follow-up after 4 days, CAN-SPAM footer.
   `OUTREACH_PROVIDER=dry_run` (the default) sends nothing and records each email instead.
6. Replies: pulled from Instantly or pasted by hand, sorted by Claude into Yes, No, Question,
   Unsubscribe or Other. Unsubscribed is permanent.

## Rules

- Explain what you are doing in plain language. The owner mostly knows HTML and CSS.
- After each change, say exactly how to run and test it.
- Ask before installing anything big or spending money on an API.
- Email only. Never add automated cold texts or calls.
- Never weaken the sending rules: verified emails only, the daily cap, one follow-up, the unsubscribe
  link and postal address in every email, and Unsubscribed can never be undone.
- Use an official Anthropic API key from console.anthropic.com. Do not point the app at a reseller.

## Commands

```
cd backend && .venv/bin/uvicorn app.main:app --reload   # the app, on http://localhost:8000
cd backend && .venv/bin/python -m pytest                # tests (no internet or keys needed)
cd frontend && npm run dev                              # dashboard with live reload, port 5173
cd frontend && npm run build                            # rebuild what port 8000 serves
```

## Map

- `backend/app/main.py`: starts the app, password gate, public preview and unsubscribe pages.
- `backend/app/api.py`: every `/api` route the dashboard uses.
- `backend/app/pipeline.py`: the five jobs and the daily run.
- `backend/app/services/`: one file per phase (places, email_finder, scoring, preview, outreach, replies).
- `backend/app/ai.py`: the only place that calls Claude. Returns None on any failure, and callers fall
  back to a checklist (scoring) or keyword rules (replies).
- `backend/app/http.py`: all outgoing web requests. Tests replace `http.transport` with fake responses.
- `frontend/src/pages/`: Leads, Lead, Automation, Settings.

## Known gaps

- The Instantly calls (`outreach.py`, `replies.py`) were written without access to Instantly's docs and
  have not run against a real account. Verify field names against the live API first.
- Nothing has run against the real Google Places, Hunter, NeverBounce or Claude APIs yet (no keys).
- No database migrations: a changed table needs a new column added by hand or a fresh `data/leads.db`.
