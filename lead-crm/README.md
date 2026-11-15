# Lead CRM

Finds New York City businesses on Google Maps, saves them as leads, finds their email, scores their
website, builds a preview site for the ones that need it, emails them a website offer, and tracks who
says yes.

It works with no API keys at all. Each feature simply stays off until you add its key.

**Safe by default:** the app starts in *dry run* mode. No real email is sent until you change a setting
on purpose.

---

## 1. Start it (first time)

You need [Python 3.11+](https://www.python.org/downloads/) and [Node.js 20+](https://nodejs.org).

Open a terminal in this `lead-crm` folder and run these, one at a time.

**Mac or Linux**

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ../frontend
npm install
npm run build
cd ../backend
.venv/bin/uvicorn app.main:app
```

**Windows (PowerShell)**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
cd ..\frontend
npm install
npm run build
cd ..\backend
.venv\Scripts\uvicorn app.main:app
```

Then open **http://localhost:8000** in your browser.

To stop it, press `Ctrl+C` in the terminal. To start it again later, you only need the last two lines
(`cd backend`, then the `uvicorn` line).

## 2. Add your keys (when you reach each phase)

1. Copy the file `.env.example` and name the copy `.env`.
2. Paste each key after its `=` sign.
3. Stop and restart the app.

The **Automation** page shows a tick next to each service that is connected.

| Phase | Key in `.env` | Where to get it |
|---|---|---|
| 2 | `GOOGLE_PLACES_API_KEY` | Google Cloud Console: turn on "Places API (New)", then create an API key |
| 3 | `HUNTER_API_KEY`, `NEVERBOUNCE_API_KEY` | hunter.io and neverbounce.com |
| 4 and 6 | `ANTHROPIC_API_KEY` | console.anthropic.com (set a monthly spend limit there) |
| 5 | `INSTANTLY_API_KEY`, `INSTANTLY_CAMPAIGN_ID` | See `docs/instantly-setup.md` |

Never share the `.env` file. It is already excluded from git.

---

## 3. Test each phase, in order

Finish and test one phase before moving to the next.

### Phase 1: the CRM (no keys needed)

1. Open the **Leads** page and click **Add 10 sample leads**.
2. Type in the search box, and try the category and status filters.
3. Click a lead, change its notes, and click **Save changes**.
4. Use the status menu at the top right to move it through every status.

Done when: you can add leads and move them through every status.

### Phase 2: daily Google Maps search (needs the Google key)

1. On **Settings**, list your categories and boroughs, then **Save settings**.
2. On **Automation**, click **Run now** next to "Search Google Maps".
3. Check **Recent runs** for how many leads were added, then look at the Leads page.
4. Click **Run now** again. It should say `0 new leads`, because duplicates are skipped.
5. Tick **Run daily** to let it run on its own every day.

Google charges per search after a free monthly allowance. Start with few categories and 1 page.

### Phase 3: find emails (works without keys; better with them)

1. On **Automation**, click **Run now** next to "Find emails".
2. It reads each lead's own website first (free). With a Hunter key it also asks Hunter.
3. With a NeverBounce key, good addresses get a green ✓. Without it, no email is marked verified.
4. Leads with no email found are marked **No Email** and skipped from then on.

Only **verified** emails are ever sent to. You can also verify one by hand on a lead's page.

### Phase 4: website score and preview (better with the Claude key)

1. On **Automation**, click **Run now** next to "Score websites and build previews".
2. Each lead with an email gets a score from 0 to 10 and a one-line reason.
3. A score under 6 (or no website) gets a preview page. The lead becomes **Preview Built**.
4. Open a lead and click **Open preview** to see the page.

Without the Claude key, a basic checklist does the scoring. The reason will say "no AI".

### Phase 5: email outreach (dry run first)

1. On **Settings**, fill in your name, business name and **postal address**. Sending is blocked without them.
2. Read the two email templates and change the wording if you like. Keep `{{unsubscribe_url}}` and
   `{{business_address}}` in both.
3. On **Automation**, click **Run now** next to "Send emails".
4. Open a contacted lead. Under **Outreach** you can read exactly what would have been sent.

That is the dry run. To send for real, follow `docs/instantly-setup.md`. It needs the app to be online
at a public address, because the preview and unsubscribe links in the emails must open for other people.

### Phase 6: replies

1. Open a lead, paste a reply into **Paste a reply you received**, and click **Sort this reply**.
2. The reply is sorted into Yes, No, Question, Unsubscribe or Other, and the lead's status updates.
3. A **Yes** shows a green banner on the Leads page.
4. With Instantly connected, "Read replies" on the Automation page pulls replies in for you.

---

## The rules the app enforces

- **Dry run by default.** Nothing is sent until `OUTREACH_PROVIDER=instantly` is set in `.env`.
- **Only verified emails** are sent to.
- **Daily limit** on first emails (30 by default). Keep it at 30 to 50 per inbox.
- **One follow-up**, 4 days later, then no more.
- **Every email** must contain your postal address and an unsubscribe link (CAN-SPAM law).
- **Unsubscribed is permanent.** It cannot be undone or deleted, and that address is never emailed again.
- **Email only.** There are no automated texts or calls.

## Where things are

| Path | What it is |
|---|---|
| `backend/app/` | The Python backend. `services/` has one file per phase. |
| `backend/tests/` | Automated tests. Run them with `.venv/bin/python -m pytest` from `backend`. |
| `frontend/src/` | The React dashboard. `styles.css` is plain CSS. |
| `data/leads.db` | Your leads (created on first run). Back this file up. |
| `.env` | Your keys. Never share it. |

## Changing the dashboard

For live reloading while you edit the frontend, run the backend as above, then in a second terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. When you are happy, run `npm run build` so port 8000 shows the new version.

## Putting it online

Real sending needs a public address. In short:

1. Host the app on a server (for example Render, Railway or a small VPS).
2. In `.env` on the server, set `PUBLIC_BASE_URL` to that address and set `ADMIN_PASSWORD`.
3. The dashboard then asks for the password (any username). Preview and unsubscribe pages stay public.

## What has and has not been tested

- Tested automatically: all six phases, using made-up responses in place of the outside services.
- Tested by hand in a browser: the dashboard, previews, dry-run sending, reply sorting, unsubscribing.
- **Not yet tested against the real services:** Google Places, Hunter, NeverBounce, Claude and
  Instantly, because that needs your keys. The Instantly connection in particular was written without
  access to Instantly's documentation, so test it with one lead (your own address) before relying on it.
