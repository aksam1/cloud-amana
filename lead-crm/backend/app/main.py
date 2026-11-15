"""Starts the app: the API, the public preview pages, and the dashboard.

Run it with:  uvicorn app.main:app --reload   (from the backend folder)
"""
import base64
import logging
import secrets
from contextlib import asynccontextmanager
from html import escape
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import db as database
from . import scheduler
from .api import router
from .config import ROOT, env
from .db import get_db
from .models import Lead
from .services import outreach
from .services.preview import render_preview
from .settings_store import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s")
FRONTEND = ROOT / "frontend" / "dist"

# Pages strangers are allowed to open without the password.
PUBLIC_PREFIXES = ("/preview/", "/unsubscribe/", "/health")


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.configure()
    if env().scheduler_enabled:
        session = database.session()
        hour = get_settings(session)["daily_run_hour"]
        session.close()
        scheduler.start(hour)
    yield
    scheduler.stop()


app = FastAPI(title="Lead CRM", lifespan=lifespan)


@app.middleware("http")
async def password_gate(request: Request, call_next):
    """If ADMIN_PASSWORD is set, the dashboard and API ask for it (any username)."""
    password = env().admin_password
    if password and not request.url.path.startswith(PUBLIC_PREFIXES):
        given = ""
        header = request.headers.get("authorization", "")
        if header.lower().startswith("basic "):
            try:
                given = base64.b64decode(header[6:]).decode().partition(":")[2]
            except Exception:
                given = ""
        if not secrets.compare_digest(given.encode(), password.encode()):
            return Response("Password needed.", status_code=401, headers={"WWW-Authenticate": 'Basic realm="Lead CRM"'})
    return await call_next(request)


app.include_router(router)


@app.get("/health")
def health():
    return {"ok": True}


# ---------- public pages ----------


@app.get("/preview/{lead_id}", response_class=HTMLResponse)
def preview_page(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if lead is None or not lead.preview_url:
        raise HTTPException(404, "Preview not found")
    return render_preview(lead)


def _simple_page(title: str, body: str) -> str:
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>{escape(title)}</title>
<style>body{{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f5f6f8;color:#1c2330;display:grid;place-items:center;min-height:100vh;margin:0}}
main{{background:#fff;padding:36px;border-radius:14px;max-width:440px;margin:16px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.06)}}
h1{{font-size:22px;margin:0 0 10px}}p{{margin:0 0 18px;line-height:1.5}}
button{{font:inherit;font-weight:600;background:#1c2330;color:#fff;border:0;border-radius:999px;padding:12px 24px;cursor:pointer}}</style>
</head><body><main><h1>{escape(title)}</h1>{body}</main></body></html>"""


@app.get("/unsubscribe/{token}", response_class=HTMLResponse)
def unsubscribe_ask(token: str, db: Session = Depends(get_db)):
    lead = db.scalar(select(Lead).where(Lead.unsubscribe_token == token))
    if lead is None:
        raise HTTPException(404, "Link not found")
    if lead.status == "Unsubscribed":
        return _simple_page("You're unsubscribed", "<p>You will not get any more emails from us.</p>")
    # A button (not an instant unsubscribe) so that email scanners that open
    # every link do not unsubscribe people by accident.
    return _simple_page(
        "Unsubscribe?",
        f"<p>Stop all emails to {escape(lead.email or 'this address')}?</p>"
        '<form method="post"><button type="submit">Yes, unsubscribe me</button></form>',
    )


@app.post("/unsubscribe/{token}", response_class=HTMLResponse)
def unsubscribe_do(token: str, db: Session = Depends(get_db)):
    lead = db.scalar(select(Lead).where(Lead.unsubscribe_token == token))
    if lead is None:
        raise HTTPException(404, "Link not found")
    lead.status = "Unsubscribed"
    db.commit()
    outreach.instantly_block(lead.email)
    return _simple_page("You're unsubscribed", "<p>You will not get any more emails from us. Sorry for the bother.</p>")


# ---------- the dashboard (the built React app) ----------

if (FRONTEND / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND / "assets"), name="assets")


@app.get("/{path:path}", include_in_schema=False)
def dashboard(path: str):
    if path.startswith("api/"):
        raise HTTPException(404, "Not found")
    file = FRONTEND / path
    if path and file.is_file() and FRONTEND in file.resolve().parents:
        return FileResponse(file)
    index = FRONTEND / "index.html"
    if index.is_file():
        return FileResponse(index)
    return HTMLResponse(
        _simple_page(
            "Dashboard not built yet",
            "<p>The API is running. To see the dashboard, open a second terminal, go to the "
            "<code>frontend</code> folder and run <code>npm install</code> then <code>npm run dev</code>.</p>",
        )
    )
