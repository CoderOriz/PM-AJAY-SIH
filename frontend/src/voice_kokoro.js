// Day 3 voice layer — Kokoro v1.0 upgrade path (82M params).
// ponytail: Kokoro requires Python >=3.9,<3.13 (current 3.14.3 blocked). Add to pilot
// environment (3.11/3.12) with: pip install kokoro-tts. Native SpeechSynthesis
// (Kalpana hi-IN) renders Marathi fine — verified live.

export const KOKORO_BLOCKED = true; // upgrade when Python <3.13

export function kokoroTTS(text, lang, onStart) {
  // ponytail: Kokoro integration stub — full model loads here when env supports it.
  // Current: native SpeechSynthesis handles Marathi via hi-IN voice (verified).
  if (KOKORO_BLOCKED) {
    // Fallback to native TTS (Kalpana / Hemant hi-IN voices cover Marathi Devanagari).
    // No runtime overhead until Kokoro model is available.
    if (onStart) onStart();
    return false;
  }
  return true;
}
