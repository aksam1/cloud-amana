import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../api.js";

// Each step: the job to run, the Settings switch for the daily schedule, and what it needs.
const STEPS = [
  { job: "search", toggle: "auto_search", title: "1. Search Google Maps", text: "Finds businesses for your categories and boroughs and adds new ones as leads.", needs: ["google_places"] },
  { job: "emails", toggle: "auto_find_emails", title: "2. Find emails", text: "Reads each new lead's website for an email, then asks Hunter, then checks it with NeverBounce.", needs: [] },
  { job: "score", toggle: "auto_score", title: "3. Score websites and build previews", text: "Scores each lead's current website. Weak or missing sites get a preview page.", needs: [] },
  { job: "outreach", toggle: "auto_outreach", title: "4. Send emails", text: "Emails leads that have a verified address and a preview, up to the daily limit, plus one follow-up.", needs: [] },
  { job: "replies", toggle: "auto_replies", title: "5. Read replies", text: "Pulls replies from your sending tool and sorts them into Yes, No, Question or Unsubscribe.", needs: [] },
];

export default function AutomationPage() {
  const [settings, setSettings] = useState(null);
  const [connections, setConnections] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await api.jobs());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    Promise.all([api.settings(), api.connections()])
      .then(([s, c]) => { setSettings(s); setConnections(c); })
      .catch((e) => setError(e.message));
    loadJobs();
  }, [loadJobs]);

  // While a job is running, check on it every two seconds.
  useEffect(() => {
    if (!jobs?.running) return;
    const timer = setInterval(loadJobs, 2000);
    return () => clearInterval(timer);
  }, [jobs?.running, loadJobs]);

  async function runNow(job) {
    setError("");
    try {
      await api.runJob(job);
      setJobs((j) => ({ ...j, running: true }));
      setTimeout(loadJobs, 600);
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggle(name, value) {
    if (name === "auto_outreach" && value && connections.outreach_provider !== "dry_run"
      && !window.confirm("Turn on automatic sending? Real emails will go out every day, up to your daily limit.")) return;
    try {
      setSettings(await api.saveSettings({ [name]: value }));
    } catch (e) {
      setError(e.message);
    }
  }

  if (!settings || !connections || !jobs) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const dryRun = connections.outreach_provider === "dry_run";
  const hour = settings.daily_run_hour;
  const hourText = `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Automation</h1>
          <p className="muted">Run a step by hand, or switch it on to run every day at {hourText}.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {dryRun && (
        <p className="banner">
          <strong>Dry run mode.</strong> No real emails are sent. Each email is written to the lead's page so you can read it first.
        </p>
      )}
      {!dryRun && connections.outreach_problems.length > 0 && (
        <p className="banner warn"><strong>Sending is blocked:</strong> {connections.outreach_problems.join(" ")}</p>
      )}

      <div className="columns wide-left">
        <div className="stack">
          {STEPS.map((step) => (
            <section className="card step" key={step.job}>
              <div>
                <h2>{step.title}</h2>
                <p className="muted">{step.text}</p>
                {step.job === "outreach" && (
                  <p className="muted">Limit: {settings.daily_email_cap} first emails per day.</p>
                )}
              </div>
              <div className="step-actions">
                <button disabled={jobs.running} onClick={() => runNow(step.job)}>Run now</button>
                <label className="switch">
                  <input type="checkbox" checked={settings[step.toggle]} onChange={(e) => toggle(step.toggle, e.target.checked)} />
                  Run daily
                </label>
              </div>
            </section>
          ))}
        </div>

        <div className="stack">
          <section className="card">
            <h2>Connections</h2>
            <p className="muted">Keys go in the <code>.env</code> file. Restart the backend after changing it.</p>
            <ul className="checks">
              <Check ok={connections.google_places} label="Google Places" hint="Needed to search Google Maps" />
              <Check ok={connections.hunter} label="Hunter.io" hint="Optional: finds emails the website does not show" />
              <Check ok={connections.neverbounce} label="NeverBounce" hint="Needed to mark emails as verified" />
              <Check ok={connections.claude} label="Claude" hint={connections.claude ? `Using ${connections.claude_model}` : "Without it, a basic checklist and keyword rules are used"} />
              <Check ok={connections.instantly} label="Instantly" hint={dryRun ? "Not in use: dry run mode" : "Sends the emails"} />
              <Check ok={!connections.public_base_url_is_local} label="Public address" hint={connections.public_base_url} />
              <Check ok={connections.password_protected} label="Password" hint={connections.password_protected ? "Dashboard is protected" : "Set ADMIN_PASSWORD before putting this online"} />
            </ul>
          </section>

          <section className="card">
            <h2>Recent runs</h2>
            {jobs.running && <p className="notice">A job is running…</p>}
            {jobs.runs.length === 0 && <p className="muted">Nothing has run yet.</p>}
            <ul className="runs">
              {jobs.runs.map((run) => (
                <li key={run.id}>
                  <div className="row between">
                    <strong>{jobs.jobs.find((j) => j.name === run.job)?.label ?? run.job}</strong>
                    <span className="muted">{formatDate(run.started_at, true)}</span>
                  </div>
                  <div className={run.ok === false ? "error-text" : ""}>{run.finished_at ? run.summary : "Running…"}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function Check({ ok, label, hint }) {
  return (
    <li>
      <span className={ok ? "check on" : "check"} aria-hidden="true">{ok ? "✓" : "–"}</span>
      <span>
        <strong>{label}</strong> <span className="sr-only">{ok ? "(connected)" : "(not set)"}</span>
        <div className="muted">{hint}</div>
      </span>
    </li>
  );
}
