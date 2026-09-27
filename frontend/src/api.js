export const API = location.port === "8000" ? "" : "http://localhost:8000";

export async function api(path, opts) {
  const r = await fetch(API + path, opts);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

// H5: fire-and-forget persist after every confirmed slot
export const saveSlots = (sid, slots) =>
  api(`/session/${sid}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slots }),
  }).catch(() => {});
