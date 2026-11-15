import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatDate, statusClass } from "../api.js";

const PAGE_SIZE = 50;
const EMPTY_LEAD = { name: "", category: "", borough: "", address: "", phone: "", website: "", email: "", notes: "" };

export default function LeadsPage() {
  const [params, setParams] = useSearchParams();
  const filters = {
    status: params.get("status") || "",
    category: params.get("category") || "",
    borough: params.get("borough") || "",
    q: params.get("q") || "",
    page: Number(params.get("page") || 1),
  };
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(filters.q);
  const dialog = useRef(null);
  const key = params.toString();

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([api.stats(), api.leads({ ...filters, page_size: PAGE_SIZE })]);
      setStats(s);
      setLeads(l);
      setError("");
    } catch (e) {
      setError(e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  function setFilter(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    setParams(next);
  }

  // Search as you type, after a short pause.
  useEffect(() => {
    if (search === filters.q) return;
    const timer = setTimeout(() => setFilter("q", search), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function dismissYes(id) {
    await api.markSeen(id);
    load();
  }

  async function addSamples() {
    await api.addSamples();
    load();
  }

  const filtered = filters.status || filters.category || filters.borough || filters.q;
  const pages = leads ? Math.ceil(leads.total / PAGE_SIZE) : 0;

  return (
    <>
      {stats?.new_yes.map((lead) => (
        <div className="banner yes" key={lead.id}>
          <span>
            <strong>{lead.name}</strong> said yes.
          </span>
          <span className="row">
            <Link to={`/leads/${lead.id}`} className="button small">Open lead</Link>
            <button className="small ghost" onClick={() => dismissYes(lead.id)}>Dismiss</button>
          </span>
        </div>
      ))}

      <div className="page-head">
        <h1>Leads</h1>
        <button className="primary" onClick={() => dialog.current.showModal()}>Add lead</button>
      </div>

      {stats && (
        <>
          <div className="funnel">
            <Figure label="Leads" value={stats.total} />
            <Figure label="Contacted" value={stats.contacted} />
            <Figure label="Replied" value={stats.replied} />
            <Figure label="Said yes" value={stats.yes} good />
          </div>
          <div className="statusbar" role="group" aria-label="Filter by status">
            <button className={!filters.status ? "chip on" : "chip"} onClick={() => setFilter("status", "")}>
              All <b>{stats.total}</b>
            </button>
            {stats.statuses.map((status) => (
              <button
                key={status}
                className={filters.status === status ? "chip on" : "chip"}
                onClick={() => setFilter("status", filters.status === status ? "" : status)}
              >
                <span className={`dot ${statusClass(status)}`} /> {status} <b>{stats.by_status[status]}</b>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, email or address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search leads"
        />
        <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {stats?.categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.borough} onChange={(e) => setFilter("borough", e.target.value)} aria-label="Filter by borough">
          <option value="">All boroughs</option>
          {stats?.boroughs.map((b) => <option key={b}>{b}</option>)}
        </select>
        {filtered && (
          <button className="ghost" onClick={() => { setSearch(""); setParams({}); }}>Clear filters</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {leads && leads.total === 0 && !filtered && (
        <div className="empty card">
          <h2>No leads yet</h2>
          <p>Add one by hand, or load 10 made-up leads to try things out. Sample leads have no email, so they can never be emailed.</p>
          <button onClick={addSamples}>Add 10 sample leads</button>
        </div>
      )}
      {leads && leads.total === 0 && filtered && <p className="empty">No leads match these filters.</p>}

      {leads && leads.total > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Email</th>
                <th className="num">Rating</th>
                <th className="num">Site score</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {leads.items.map((lead) => <LeadRow key={lead.id} lead={lead} />)}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="pager">
          <button disabled={filters.page <= 1} onClick={() => setFilter("page", String(filters.page - 1))}>Previous</button>
          <span>Page {filters.page} of {pages}</span>
          <button disabled={filters.page >= pages} onClick={() => setFilter("page", String(filters.page + 1))}>Next</button>
        </div>
      )}

      <AddLeadDialog dialogRef={dialog} />
    </>
  );
}

function Figure({ label, value, good }) {
  return (
    <div className={good ? "figure good" : "figure"}>
      <div className="figure-value">{value}</div>
      <div className="figure-label">{label}</div>
    </div>
  );
}

function LeadRow({ lead }) {
  const navigate = useNavigate();
  return (
    <tr onClick={() => navigate(`/leads/${lead.id}`)}>
      <td>
        <Link to={`/leads/${lead.id}`} onClick={(e) => e.stopPropagation()} className="lead-name">{lead.name}</Link>
        {lead.borough && <div className="muted">{lead.borough}</div>}
      </td>
      <td>{lead.category}</td>
      <td className="nowrap">{lead.phone}</td>
      <td>
        {lead.email}
        {lead.email && lead.email_verified && <span className="tick" title="Verified"> ✓</span>}
      </td>
      <td className="num">{lead.rating ?? ""}</td>
      <td className="num">{lead.site_score ?? ""}</td>
      <td><span className={statusClass(lead.status)}>{lead.status}</span></td>
      <td className="nowrap muted">{formatDate(lead.date_added)}</td>
    </tr>
  );
}

function AddLeadDialog({ dialogRef }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_LEAD);
  const [error, setError] = useState("");
  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      const lead = await api.createLead(form);
      setForm(EMPTY_LEAD);
      dialogRef.current.close();
      navigate(`/leads/${lead.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <dialog ref={dialogRef} onClose={() => setError("")}>
      <form onSubmit={submit} className="form">
        <h2>Add a lead</h2>
        <label>Business name<input required value={form.name} onChange={set("name")} autoFocus /></label>
        <div className="two">
          <label>Category<input value={form.category} onChange={set("category")} placeholder="restaurant" /></label>
          <label>Borough<input value={form.borough} onChange={set("borough")} placeholder="Brooklyn" /></label>
        </div>
        <label>Address<input value={form.address} onChange={set("address")} /></label>
        <div className="two">
          <label>Phone<input value={form.phone} onChange={set("phone")} /></label>
          <label>Email<input type="email" value={form.email} onChange={set("email")} /></label>
        </div>
        <label>Website<input value={form.website} onChange={set("website")} placeholder="https://" /></label>
        {error && <p className="error">{error}</p>}
        <div className="row end">
          <button type="button" className="ghost" onClick={() => dialogRef.current.close()}>Cancel</button>
          <button className="primary">Add lead</button>
        </div>
      </form>
    </dialog>
  );
}
