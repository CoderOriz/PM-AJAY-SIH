// Day 3 voice layer: TTS read-back + mic with confidence gate (C1: <0.75 re-prompts once).
// Addon A: generic BCP-47 tags per language; no hard-coded language list.
import { speechTag, LANGS } from "./dialogue.js"; // explicit extension: keeps this pure-logic module directly testable in node

// Chrome loads voices ASYNC — getVoices() is empty until voiceschanged fires. Preload + cache.
let cachedVoices = [];

export function preloadVoices() {
  if (!("speechSynthesis" in window)) return;
  const load = () => { cachedVoices = window.speechSynthesis.getVoices() || []; };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

// Assamese uses the Bengali script — same family for fallback purposes.
function scriptOf(code) {
  const l = LANGS.find(x => x.code === (code || "").toLowerCase());
  const s = l ? l.script : "";
  return s === "Assamese" ? "Bengali" : s;
}

const INDIC = /^(hi|mr|bn|ta|te|gu|kn|ml|or|pa|as|ur|mai|sat|kok|doi|ne|sd|brx)/i;

// Pure voice picker (exported for tests): exact BCP-47 -> bare code ->
// prefix -> same-script voice -> any Indic voice -> null. Same-script
// fallback matters when the OS lacks a voice for the language (e.g. a Hindi
// voice renders Marathi acceptably — same Devanagari script — but must never
// be picked for a different script like Tamil when nothing closer exists;
// then the browser default renders with the correct lang tag instead).
export function pickVoice(voices, lang) {
  const list = voices || [];
  const tag = speechTag(lang);
  const code = tag.split("-")[0];
  const script = scriptOf(lang);
  return (
    list.find(v => v.lang === tag) ||
    list.find(v => v.lang === code) ||
    list.find(v => v.lang.startsWith(code)) ||
    (script
      ? list.find(v => {
          const vc = (v.lang || "").split("-")[0];
          return scriptOf(vc) === script;
        })
      : null) ||
    list.find(v => INDIC.test(v.lang)) ||
    null
  );
}

function bestVoice(lang) {
  return pickVoice(cachedVoices, lang);
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
