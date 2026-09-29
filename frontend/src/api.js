export const API = location.port === "8000" ? "" : "http://localhost:8000";

// ponytail: Kokoro TTS (v1.0, 82M params) is the model upgrade — requires Python 3.11/3.12
// (pip install kokoro-tts); native SpeechSynthesis covers the demo.
export async function api(path, opts) {
  const r = await fetch(API + path, opts);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
