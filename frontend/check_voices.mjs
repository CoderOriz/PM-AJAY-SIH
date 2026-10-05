// Deterministic pickVoice checks with fake OS voice lists. Run: node check_voices.mjs
// Delete before committing.
import { pickVoice } from "./src/voice.js";

const V = (lang, name) => ({ lang, name });
let fail = 0;
function eq(got, want, label) {
  const g = got ? `${got.lang}|${got.name}` : "null";
  const ok = g === want;
  if (!ok) fail++;
  console.log(ok ? "ok  " : "FAIL", label, "->", g);
}

// Machine like the test box: en + hi voices only
const box = [V("en-US", "David"), V("en-IN", "Ravi"), V("hi-IN", "Hemant"), V("hi-IN", "Kalpana")];
eq(pickVoice(box, "hi"), "hi-IN|Hemant", "hindi exact");
eq(pickVoice(box, "mr"), "hi-IN|Hemant", "marathi same-script fallback");
eq(pickVoice(box, "ta"), "hi-IN|Hemant", "tamil indic fallback (no tamil voice)");
eq(pickVoice(box, "ur"), "hi-IN|Hemant", "urdu indic fallback");

// Rich device: exact voices win over fallbacks
const rich = [V("hi-IN", "Hemant"), V("mr-IN", "Madhur"), V("ta-IN", "Valluvar"), V("bn-IN", "Basu")];
eq(pickVoice(rich, "mr"), "mr-IN|Madhur", "marathi exact beats hindi");
eq(pickVoice(rich, "ta"), "ta-IN|Valluvar", "tamil exact");
eq(pickVoice(rich, "bn"), "bn-IN|Basu", "bengali exact");

// Same-script beats cross-script: bn voice serves as (assamese script family)
const scripts = [V("hi-IN", "Hemant"), V("bn-IN", "Basu")];
eq(pickVoice(scripts, "as"), "bn-IN|Basu", "assamese uses bengali-script voice");
eq(pickVoice(scripts, "te"), "hi-IN|Hemant", "telugu indic fallback");

// Prefix match: voice tagged mr-Deva serves mr
eq(pickVoice([V("mr-Deva", "X")], "mr"), "mr-Deva|X", "prefix match");

// Nothing usable -> null (browser default + correct lang tag)
eq(pickVoice([V("en-US", "David")], "ta"), "null", "no indic voice -> null");
eq(pickVoice([], "hi"), "null", "empty list -> null");

console.log(fail ? `FAILURES: ${fail}` : "ALL VOICE CHECKS PASSED");
process.exit(fail ? 1 : 0);
