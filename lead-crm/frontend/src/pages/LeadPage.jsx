import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatDate, statusClass } from "../api.js";

const STATUSES = ["New", "No Email", "Good Site", "Preview Built", "Contacted", "Replied", "Yes", "No", "Unsubscribed"];
const FIELDS = ["name", "category", "borough", "address", "phone", "website", "email", "notes"];

export default function LeadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [replyText, setReplyText] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.lead(id);
      setLead(data);
      setForm(Object.fromEntries(FIELDS.map((f) => [f, data[f] ?? ""])));
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Run an action, show what happened, then reload the lead.
  async function run(name, action, done) {
    setBusy(name);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (done) setNotice(done(result));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  if (error && !lead) return <p className="error">{error}</p>;
  if (!lead || !form) return <p className="muted">Loading…</p>;

  const locked = lead.status === "Unsubscribed";
  const dirty = FIELDS.some((f) => form[f] !== (lead[f] ?? ""));
  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });
  const alreadySent = ["Contacted", "Replied", "Yes", "No"].includes(lead.status);

  return (
    <>
      <Link to="/" className="back">← All leads</Link>
      <div className="page-head">
        <div>
          <h1>{lead.name}</h1>
          <p className="muted">
            Added {formatDate(lead.date_added)}
            {lead.last_contacted && ` · Last contacted ${formatDate(lead.last_contacted)}`}
            {lead.followup_sent && " · Follow-up sent"}
          </p>
        </div>
        <label className="status-pick">
          <span className={statusClass(lead.status)}>{lead.status}</span>
          <select
            value={lead.status}
            disabled={locked}
            aria-label="Change status"
            onChange={(e) => {
              const status = e.target.value;
              if (status === "Unsubscribed" && !window.confirm("Mark as unsubscribed? This cannot be undone: they will never be emailed again.")) return;
              run("status", () => api.updateLead(id, { status }));
            }}
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {locked && <p className="banner">This lead unsubscribed. They are never emailed again, and this cannot be undone.</p>}
      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <div className="columns">
        <form
          className="card form"
          onSubmit={(e) => {
            e.preventDefault();
            run("save", () => api.updateLead(id, form), () => "Saved.");
          }}
        >
          <h2>Details</h2>
          <label>Business name<input required value={form.name} onChange={set("name")} /></label>
          <div className="two">
            <label>Category<input value={form.category} onChange={set("category")} /></label>
            <label>Borough<input value={form.borough} onChange={set("borough")} /></label>
          </div>
          <label>Address<input value={form.address} onChange={set("address")} /></label>
          <div className="two">
            <label>Phone<input value={form.phone} onChange={set("phone")} /></label>
            <label>
              Email {lead.email && (lead.email_verified ? <span className="tick">✓ verified</span> : <span className="muted">(not verified)</span>)}
              <input type="email" value={form.email} onChange={set("email")} />
            </label>
          </div>
          <label>Website<input value={form.website} onChange={set("website")} placeholder="https://" /></label>
          <label>Notes<textarea rows="5" value={form.notes} onChange={set("notes")} /></label>
          <div className="row between">
            <button
              type="button"
              className="danger ghost"
              disabled={locked}
              onClick={async () => {
                if (!window.confirm(`Delete ${lead.name}? This cannot be undone.`)) return;
                try {
                  await api.deleteLead(id);
                  navigate("/");
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Delete lead
            </button>
            <button className="primary" disabled={!dirty || busy === "save"}>{busy === "save" ? "Saving…" : "Save changes"}</button>
          </div>
          <dl className="facts">
            {lead.rating != null && (<><dt>Google rating</dt><dd>{lead.rating}{lead.rating_count ? ` (${lead.rating_count} reviews)` : ""}</dd></>)}
            {lead.maps_url && (<><dt>Google Maps</dt><dd><a href={lead.maps_url} target="_blank" rel="noreferrer">Open listing</a></dd></>)}
            {lead.email_source && (<><dt>Email found by</dt><dd>{lead.email_source}</dd></>)}
          </dl>
        </form>

        <div className="stack">
          <section className="card">
            <h2>Website and preview</h2>
            <p>
              {lead.website
                ? <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">{lead.website}</a>
                : <span className="muted">No website listed.</span>}
            </p>
            {lead.site_score != null && (
              <p className="score">
                <span className={lead.site_score < 6 ? "score-num weak" : "score-num"}>{lead.site_score}<small>/10</small></span>
                <span>{lead.site_score_reason}</span>
              </p>
            )}
            {lead.preview_url && (
              <p>
                <a className="button" href={`/preview/${lead.id}`} target="_blank" rel="noreferrer">Open preview</a>
                <span className="muted link-text"> {lead.preview_url}</span>
              </p>
            )}
            <div className="row wrap">
              <button
                disabled={!!busy || !lead.website}
                onClick={() => run("email", () => api.findEmail(id), (r) => (r.result.email ? `Found ${r.result.email}${r.result.verified ? " (verified)" : " (not verified)"}.` : "No email found."))}
              >
                {busy === "email" ? "Looking…" : "Find email"}
              </button>
              <button
                disabled={!!busy}
                onClick={() => run("score", () => api.score(id), (r) => `Scored ${r.result.score}/10${r.lead.preview_url ? ", and a preview is ready." : "."}`)}
              >
                {busy === "score" ? "Scoring…" : "Score website"}
              </button>
              <button disabled={!!busy} onClick={() => run("preview", () => api.buildPreview(id), () => "Preview built.")}>
                {busy === "preview" ? "Building…" : lead.preview_url ? "Rebuild preview" : "Build preview"}
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Outreach</h2>
            {!alreadySent && !locked && (
              <>
                {lead.send_problem && <p className="muted">Cannot email yet: {lead.send_problem}</p>}
                {!lead.send_problem && !lead.preview_url && <p className="muted">Build a preview first.</p>}
                {lead.email && !lead.email_verified && (
                  <p>
                    <button
                      className="small"
                      onClick={() => {
                        if (window.confirm(`Mark ${lead.email} as verified? Only do this if you know the address is real.`)) {
                          run("verify", () => api.updateLead(id, { email_verified: true }), () => "Marked as verified.");
                        }
                      }}
                    >
                      Mark email as verified
                    </button>
                  </p>
                )}
                <button
                  className="primary"
                  disabled={!!busy || !!lead.send_problem || !lead.preview_url}
                  onClick={() => run("send", () => api.send(id), (r) => (r.email.provider === "dry_run" ? "Dry run: the email was written to the list below, not sent." : "Sent to your sending tool."))}
                >
                  {busy === "send" ? "Sending…" : "Send offer email"}
                </button>
              </>
            )}
            {lead.emails.length === 0 && alreadySent && <p className="muted">No emails recorded for this lead.</p>}
            {lead.emails.map((email) => (
              <details key={email.id} className="mail">
                <summary>
                  <span className="pill">{email.kind === "followup" ? "Follow-up" : "First email"}</span>
                  {email.provider === "dry_run" && <span className="pill s-no-email">Dry run, not sent</span>}
                  <span>{email.subject}</span>
                  <span className="muted">{formatDate(email.created_at, true)}</span>
                </summary>
                <p className="muted">To: {email.to_email}</p>
                <pre>{email.body}</pre>
              </details>
            ))}
          </section>

          <section className="card">
            <h2>Replies</h2>
            {lead.replies.map((reply) => (
              <div key={reply.id} className="reply">
                <div className="row wrap">
                  <span className={statusClass(reply.category === "Question" || reply.category === "Other" ? "Replied" : reply.category === "Unsubscribe" ? "Unsubscribed" : reply.category)}>{reply.category}</span>
                  <span className="muted">{reply.reason} · sorted by {reply.classifier === "claude" ? "Claude" : "keyword rules"} · {formatDate(reply.received_at, true)}</span>
                </div>
                <pre>{reply.body}</pre>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run("reply", () => api.addReply(id, replyText), (r) => {
                  setReplyText("");
                  return `Sorted as ${r.reply.category}.`;
                });
              }}
            >
              <label>
                Paste a reply you received
                <textarea rows="3" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Paste the text of their email here" />
              </label>
              <button disabled={!replyText.trim() || !!busy}>{busy === "reply" ? "Sorting…" : "Sort this reply"}</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
