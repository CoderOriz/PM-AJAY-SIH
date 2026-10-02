export const API = location.port === "8000" ? "" : "http://localhost:8000";

// ponytail: Kokoro TTS (v1.0, 82M params) is the model upgrade — requires Python 3.11/3.12
// (pip install kokoro-tts); native SpeechSynthesis covers the demo.
export async function api(path, opts) {
  const token = sessionStorage.getItem("admin_token"); // Q3/RBAC — attached when present
  const headers = { ...(opts && opts.headers), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const r = await fetch(API + path, { ...opts, headers });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

export async function login(username, password) {
  const r = await fetch(API + "/admin/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) throw new Error(r.status);
  const data = await r.json();
  sessionStorage.setItem("admin_token", data.token);
  sessionStorage.setItem("admin_user", data.username);
  return data;
}

export function logout() {
  sessionStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_user");
}
