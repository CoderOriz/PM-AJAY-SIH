const ENV_API = import.meta.env.VITE_API_URL;
const _host = location.hostname;
const _isLocal = _host === "localhost" || _host === "127.0.0.1";
// Same-origin on :8000 (backend-served) and on any deployed host — Vercel
// serves this same app's API at /api/* (api/index.py); local Vite dev
// (:5173) still talks to localhost:8000. Override with VITE_API_URL when
// the backend lives elsewhere (e.g. Render/Railway).
export const API = ENV_API || (location.port === "8000" ? "" : (_isLocal ? "http://localhost:8000" : "/api"));

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
