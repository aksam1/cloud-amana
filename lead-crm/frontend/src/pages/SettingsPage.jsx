import { useEffect, useState } from "react";
import { api } from "../api.js";

const toLines = (list) => list.join("\n");
const fromLines = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean);

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function fill(settings) {
    setForm({ ...settings, categories: toLines(settings.categories), boroughs: toLines(settings.boroughs) });
  }

  useEffect(() => {
    api.settings().then(fill).catch((e) => setError(e.message));
  }, []);

  if (!form) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const set = (name) => (e) => { setForm({ ...form, [name]: e.target.value }); setNotice(""); };
  const searches = fromLines(form.categories).length * fromLines(form.boroughs).length;

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      fill(await api.saveSettings({ ...form, categories: fromLines(form.categories), boroughs: fromLines(form.boroughs) }));
      setNotice("Settings saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  const missingUnsub = !form.email_body.includes("{{unsubscribe_url}}") || !form.followup_body.includes("{{unsubscribe_url}}");
  const missingAddress = !form.email_body.includes("{{business_address}}") || !form.followup_body.includes("{{business_address}}");

  return (
    <form onSubmit={save}>
      <div className="page-head sticky">
        <h1>Settings</h1>
        <div className="row">
          {notice && <span className="tick">{notice}</span>}
          <button className="primary">Save settings</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="columns">
        <div className="stack">
          <section className="card form">
            <h2>What to search for</h2>
            <div className="two">
              <label>
                Categories (one per line)
                <textarea rows="6" value={form.categories} onChange={set("categories")} />
              </label>
              <label>
                Boroughs or neighborhoods (one per line)
                <textarea rows="6" value={form.boroughs} onChange={set("boroughs")} />
              </label>
            </div>
            <label>
              Pages per search (20 businesses each)
              <select value={form.max_pages_per_search} onChange={set("max_pages_per_search")}>
                <option value="1">1 page</option>
                <option value="2">2 pages</option>
                <option value="3">3 pages</option>
              </select>
            </label>
            <p className="muted">
              This makes {searches} {searches === 1 ? "search" : "searches"} a day, up to {searches * form.max_pages_per_search} paid
              Google requests. Check Google's current Places pricing before adding many.
            </p>
          </section>

          <section className="card form">
            <h2>Daily schedule and limits</h2>
            <div className="two">
              <label>
                Run every day at
                <select value={form.daily_run_hour} onChange={set("daily_run_hour")}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{`${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`}</option>
                  ))}
                </select>
              </label>
              <label>
                Most leads handled per step, per run
                <input type="number" min="1" max="500" value={form.batch_limit} onChange={set("batch_limit")} />
              </label>
            </div>
            <div className="two">
              <label>
                Build a preview when the site scores below
                <input type="number" min="1" max="10" value={form.score_threshold} onChange={set("score_threshold")} />
              </label>
              <label>
                Google photos per preview (each is a paid request)
                <input type="number" min="0" max="6" value={form.preview_photo_count} onChange={set("preview_photo_count")} />
              </label>
            </div>
            <p className="muted">Which steps run each day is chosen on the Automation page.</p>
          </section>
        </div>

        <div className="stack">
          <section className="card form">
            <h2>Your details</h2>
            <p className="muted">US law (CAN-SPAM) requires a real postal address and a working unsubscribe link in every email. Sending stays blocked until these are filled in.</p>
            <div className="two">
              <label>Your name<input value={form.sender_name} onChange={set("sender_name")} /></label>
              <label>Business name<input value={form.business_name} onChange={set("business_name")} /></label>
            </div>
            <label>Business postal address<input value={form.business_address} onChange={set("business_address")} /></label>
            <div className="three">
              <label>Offer price ($)<input type="number" min="0" value={form.offer_price} onChange={set("offer_price")} /></label>
              <label>First emails per day<input type="number" min="0" max="500" value={form.daily_email_cap} onChange={set("daily_email_cap")} /></label>
              <label>Follow up after (days)<input type="number" min="1" max="30" value={form.followup_days} onChange={set("followup_days")} /></label>
            </div>
            {Number(form.daily_email_cap) > 50 && (
              <p className="banner warn">More than 50 a day from one inbox risks getting it flagged as spam. Stay at 30 to 50 per inbox.</p>
            )}
          </section>

          <section className="card form">
            <h2>Email wording</h2>
            <p className="muted">
              These fill in automatically: <code>{"{{companyName}}"}</code> <code>{"{{preview_url}}"}</code> <code>{"{{price}}"}</code>{" "}
              <code>{"{{sender_name}}"}</code> <code>{"{{business_name}}"}</code> <code>{"{{business_address}}"}</code> <code>{"{{unsubscribe_url}}"}</code>
            </p>
            <label>First email: subject<input value={form.email_subject} onChange={set("email_subject")} /></label>
            <label>First email: body<textarea rows="12" value={form.email_body} onChange={set("email_body")} /></label>
            <label>Follow-up: subject<input value={form.followup_subject} onChange={set("followup_subject")} /></label>
            <label>Follow-up: body<textarea rows="10" value={form.followup_body} onChange={set("followup_body")} /></label>
            {(missingUnsub || missingAddress) && (
              <p className="banner warn">
                Both emails must keep {missingUnsub && <code>{"{{unsubscribe_url}}"}</code>}{missingUnsub && missingAddress && " and "}
                {missingAddress && <code>{"{{business_address}}"}</code>}. Sending is blocked without them.
              </p>
            )}
          </section>
        </div>
      </div>
    </form>
  );
}
