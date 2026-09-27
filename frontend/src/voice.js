// Day 3 voice layer: TTS read-back + mic with confidence gate (C1: <0.75 re-prompts once).

// Chrome loads voices ASYNC — getVoices() is empty until voiceschanged fires. Preload + cache.
let cachedVoices = [];

export function preloadVoices() {
  if (!("speechSynthesis" in window)) return;
  const load = () => { cachedVoices = window.speechSynthesis.getVoices() || []; };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

function bestVoice(lang) {
  // Fallback chain: exact -> prefix -> any Indic voice.
  // Hindi voices render Marathi fine (same Devanagari script) — cross-fallback matters when
  // the OS has no Marathi voice installed.
  const code = lang === "mr" ? "mr" : "hi";
  return (
    cachedVoices.find(v => v.lang === code + "-IN") ||
    cachedVoices.find(v => v.lang === code) ||
    cachedVoices.find(v => v.lang.startsWith(code)) ||
    cachedVoices.find(v => /^(hi|mr)-IN?$/i.test(v.lang)) ||
    cachedVoices.find(v => /^(hi|mr)/i.test(v.lang)) ||
    null
  );
}

export function speak(txt, lang) {
  if (!("speechSynthesis" in window)) return;
  try {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) synth.cancel(); // avoid queue pileup between slots
    const u = new SpeechSynthesisUtterance(txt);
    const v = bestVoice(lang);
    if (v) u.voice = v;
    u.lang = v ? v.lang : (lang === "mr" ? "mr-IN" : "hi-IN");
    u.rate = 0.9;
    synth.speak(u);
  } catch (e) { /* silent — input fallbacks still work */ }
}

export const hasSR = () =>
  typeof window.SpeechRecognition !== "undefined" ||
  typeof window.webkitSpeechRecognition !== "undefined";

export function startListen(onDone, lang) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  const rec = new SR();
  rec.lang = lang === "mr" ? "mr-IN" : "hi-IN";
  rec.onresult = e => onDone(e.results[0][0].transcript, e.results[0][0].confidence);
  rec.onerror = () => { /* input remains as fallback */ };
  rec.start();
}
