// Every call the dashboard makes to the backend goes through here.

async function request(method, path, body) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  let data = null;
  try {
    data = await response.json();
  } catch {
    // an empty or non-JSON answer; handled below
  }
  if (!response.ok) {
    let message = `Something went wrong (${response.status}).`;
    if (typeof data?.detail === "string") message = data.detail;
    else if (Array.isArray(data?.detail)) message = data.detail.map((d) => d.msg.replace(/^Value error, /, "")).join(" ");
    throw new Error(message);
  }
  return data;
}

function query(params) {
  const clean = Object.entries(params).filter(([, value]) => value !== "" && value != null);
  return clean.length ? `?${new URLSearchParams(clean)}` : "";
}

export const api = {
  leads: (params) => request("GET", `/leads${query(params)}`),
  lead: (id) => request("GET", `/leads/${id}`),
  createLead: (data) => request("POST", "/leads", data),
  updateLead: (id, data) => request("PATCH", `/leads/${id}`, data),
  deleteLead: (id) => request("DELETE", `/leads/${id}`),
  findEmail: (id) => request("POST", `/leads/${id}/find-email`),
  score: (id) => request("POST", `/leads/${id}/score`),
  buildPreview: (id) => request("POST", `/leads/${id}/build-preview`),
  send: (id) => request("POST", `/leads/${id}/send`),
  addReply: (id, body) => request("POST", `/leads/${id}/replies`, { body }),
  markSeen: (id) => request("POST", `/leads/${id}/seen`),
  stats: () => request("GET", "/stats"),
  settings: () => request("GET", "/settings"),
  saveSettings: (data) => request("PUT", "/settings", data),
  connections: () => request("GET", "/connections"),
  jobs: () => request("GET", "/jobs"),
  runJob: (name) => request("POST", `/jobs/${name}/run`),
  addSamples: () => request("POST", "/sample-leads"),
};

export function formatDate(iso, withTime = false) {
  if (!iso) return "";
  const options = { month: "short", day: "numeric", year: "numeric" };
  if (withTime) Object.assign(options, { hour: "numeric", minute: "2-digit" });
  return new Date(iso).toLocaleString("en-US", options);
}

export const statusClass = (status) => `pill s-${status.toLowerCase().replace(/\s+/g, "-")}`;
