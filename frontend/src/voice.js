// Day 3 voice layer: TTS read-back + mic with confidence gate (C1: <0.75 re-prompts once).
// Addon A: generic BCP-47 tags per language; no hard-coded language list.
import { speechTag } from "./dialogue";

// Chrome loads voices ASYNC — getVoices() is empty until voiceschanged fires. Preload + cache.
let cachedVoices = [];

export function preloadVoices() {
  if (!("speechSynthesis" in window)) return;
  const load = () => { cachedVoices = window.speechSynthesis.getVoices() || []; };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

function bestVoice(lang) {
  // Fallback chain: exact BCP-47 -> bare code -> prefix -> any Indic voice.
  // Cross-script fallback matters when the OS lacks a voice for the language
  // (e.g. Hindi voices render Marathi fine — same Devanagari script).
  const tag = speechTag(lang);
  const code = tag.split("-")[0];
  const indic = /^(hi|mr|bn|ta|te|gu|kn|ml|or|pa|as|ur|mai|sat|kok|doi|ne|sd|brx)/i;
  return (
    cachedVoices.find(v => v.lang === tag) ||
    cachedVoices.find(v => v.lang === code) ||
    cachedVoices.find(v => v.lang.startsWith(code)) ||
    cachedVoices.find(v => indic.test(v.lang)) ||
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
    // Always tag the REQUESTED language, even on fallback voices — tagging
    // Marathi text as hi-IN misleads pronunciation engines. The fallback voice
    // only renders audio (same-script voices read acceptably cross-language).
    u.lang = speechTag(lang);
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
  rec.lang = speechTag(lang);
  rec.onresult = e => onDone(e.results[0][0].transcript, e.results[0][0].confidence);
  rec.onerror = () => { /* input remains as fallback */ };
  rec.start();
}
