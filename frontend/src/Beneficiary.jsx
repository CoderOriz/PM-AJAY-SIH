import { useState, useEffect, useRef } from "react";
import { D, DATA, DISTRICTS, SLOTS, VOICE_LANGS, slotOptions, slotChips, dispOf } from "./dialogue";
import { api } from "./api";
import { speak, startListen, hasSR, preloadVoices } from "./voice";
import { RecCard } from "./components/Beneficiary/RecCard";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, Input } from "./components/ui";


export default function Beneficiary({ opMode, opId, setOpMode, setOpId }) {
  const [screen, setScreen] = useState("phone");
  const [lang, setLang] = useState("mr");
  const [sid, setSid] = useState(null);
  const [confirmed, setConfirmed] = useState({});
  const [slotIdx, setSlotIdx] = useState(0);
  const [reAsks, setReAsks] = useState(0);
  const [pending, setPending] = useState(null);
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [recs, setRecs] = useState(null);
  const [textVal, setTextVal] = useState("");
  const [contactedDone, setContactedDone] = useState(false);
  const [followupDone, setFollowupDone] = useState(false);
  const micTries = useRef(0);

  const t = k => D[lang][k];
  const d = DATA[lang];
  const recsList = recs && Array.isArray(recs.recommendations)
    ? recs.recommendations.map((r, i) => <RecCard key={i} r={r} t={t} lang={lang} />)
    : null;

  useEffect(() => { preloadVoices(); }, []);
  useEffect(() => {
    if (screen === "consent") speak(t("consent"), lang);
    else if (screen === "resume") speak(t("resume_q"), lang);
    else if (screen === "slot") speak(SLOTS[slotIdx].q[lang], lang);
    else if (screen === "partial") speak(t("partial_title") + ". " + t("partial_note"), lang);
    else if (screen === "recs") speak(t("recs_title"), lang);
  }, [screen, slotIdx, lang]);

  // Inactivity re-prompt (7-8s): repeat the question on slot screens, or the
  // given answer on the echo screen. Typing, errors, and navigation restart
  // the window; capped at 2 repeats per idle stretch so it never nags forever.
  useEffect(() => {
    if (screen !== "slot" && screen !== "echo") return;
    let alive = true;
    let repeats = 0;
    let timer = 0;
    const reprompt = () => {
      if (!alive) return;
      if (screen === "slot") speak(SLOTS[slotIdx].q[lang], lang);
      else if (pending) speak(t("said") + " " + pending.display, lang);
      if (++repeats < 2) timer = setTimeout(reprompt, 7500);
    };
    timer = setTimeout(reprompt, 7500);
    return () => { alive = false; clearTimeout(timer); };
  }, [screen, slotIdx, lang, textVal, err, pending]);

  async function startSession() {
    setErr("");
    if (!/^\d{10}$/.test(phone)) { setErr(d.phone_err); return; }
    try {
      const res = await api("/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      setSid(res.session_id);
      if (opMode) {
        try {
          await api(`/session/${res.session_id}/profile`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slots: { assisted_session: true, operator_id: Number(opId) } }),
          });
        } catch { setErr(t("op_not_certified")); return; }
      }
      setConfirmed(res.confirmed_slots || {});
      if (res.confirmed_slots && res.confirmed_slots.language) {
        setLang(res.confirmed_slots.language);
        setScreen("resume");
      } else setScreen("lang");
    } catch { setErr(t("err")); }
  }

  function pickLang(l) { setLang(l); api(`/session/${sid}/profile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slots: { language: l } }) }).catch(() => {}); const hasSlots = Object.keys(confirmed).some(k => SLOTS.some(s => s.key === k)); setScreen(hasSlots ? "resume" : "consent"); }
  function consent() { api(`/session/${sid}/profile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slots: { consent_given: true } }) }).catch(() => {}); startSlots(confirmed); }
  function startSlots(conf) { const idx = SLOTS.findIndex(s => !(s.key in conf)); if (idx === -1) { finish(); return; } setSlotIdx(idx); setReAsks(0); setScreen("slot"); }
  function resumeOk(same) { startSlots(same ? confirmed : {}); }
  function echo(val, display) { setPending({ val, display }); speak(t("said") + " " + display, lang); setScreen("echo"); }
  async function confirmSlot(ok) {
    if (!ok) { setReAsks(r => r + 1); setTextVal(""); setScreen("slot"); return; }
    const key = SLOTS[slotIdx].key;
    const nc = { ...confirmed, [key]: pending.val };
    setConfirmed(nc);
    const payload = { [key]: pending.val };
    if (key === "district_name") payload.district_lgd = String((DISTRICTS.find(x => x[0] === pending.val) || [, ""])[1]);
    await api(`/session/${sid}/profile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slots: payload }) }).catch(() => {});
    setTextVal("");
    if (slotIdx + 1 >= SLOTS.length) finish();
    else if (SLOTS[slotIdx].call === 1 && SLOTS[slotIdx + 1].call === 2) {
      try { setRecs(await api(`/session/${sid}/recommendations`)); } catch { /* optional */ }
      setScreen("partial");
    } else { setSlotIdx(slotIdx + 1); setScreen("slot"); }
  }
  async function finish() {
    try { setRecs(await api(`/session/${sid}/recommendations`)); setScreen("recs"); } catch { setErr(t("err")); }
  }
  function onMic() {
    micTries.current = 0;
    const onDone = (txt, conf) => {
      if ((conf || 0) < 0.75 && micTries.current < 1) { micTries.current++; setErr(t("speak_slow")); startListen(onDone, lang); return; }
      setErr("");
      setTextVal(txt);
      echo(txt, txt);
    };
    startListen(onDone, lang);
  }
  async function onContacted() { await api(`/session/${sid}/contacted`, { method: "POST" }).catch(() => {}); setContactedDone(true); }
  async function onFollowup(result) { await api(`/session/${sid}/followup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ result }) }).catch(() => {}); setFollowupDone(true); }

  // Phone screen
  if (screen === "phone") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("phone_q")}</CardTitle></CardHeader>
        <CardContent>
          <Input type="tel" placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
          <Button onClick={startSession}>{d.phone_btn}</Button>
          <label className="flex items-center gap-2 mt-3 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={opMode} onChange={e => setOpMode(e.target.checked)} />{t("op_mode")}
          </label>
          {opMode && <Input type="text" placeholder={t("op_id_q")} value={opId} onChange={e => setOpId(e.target.value)} className="mt-2" />}
          {opMode && <div className="mt-2 text-center"><Badge variant="secondary">{t("assisted_badge")}{opId ? ` — #${opId}` : ""}</Badge></div>}
          {err && <p className="err text-destructive text-center text-sm mt-3">{err}</p>}
        </CardContent>
      </Card>
    </div>
  );

  // Lang screen (only if no language confirmed yet — C4 profile reuse skips this)
  if (screen === "lang") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>तुम्ही कोणत्या भाषेत बोलू इच्छिता?<br />आप किस भाषा में बात करना चाहेंगे?</CardTitle>
        </CardHeader>
        <CardContent>
          {VOICE_LANGS.map(l => (
            <Button key={l.code} variant={l.code === "mr" ? undefined : "outline"}
              onClick={() => pickLang(l.code)}>{l.name}</Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // Consent (only when language selected but consent not yet given)
  if (screen === "consent") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("consent")}</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={consent}>{t("consent_btn")}</Button>
          <Button variant="ghost" onClick={() => setNoticeOpen(!noticeOpen)}>{t("consent_more")}</Button>
          {noticeOpen && <p className="notice">{t("notice")}</p>}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {[t("priv_1"), t("priv_2"), t("priv_3")].map(p => <Badge key={p} variant="outline">{p}</Badge>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Resume screen (C4)
  if (screen === "resume") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("resume_q")}</CardTitle></CardHeader>
        <CardContent>
          <p className="summary">
            {Object.entries(confirmed).map(([k, v]) => d.slot_label[k] ? <div key={k}><b>{d.slot_label[k]}:</b> {dispOf(k, v, lang)}</div> : null)}
          </p>
          <Button onClick={() => resumeOk(true)}>{t("resume_ok")}</Button>
          <Button variant="outline" onClick={() => resumeOk(false)}>{t("resume_chg")}</Button>
        </CardContent>
      </Card>
    </div>
  );

  // Slot screen (two-call: Call 1 slots 0-2, Call 2 slots 3-6)
  if (screen === "slot") {
    const s = SLOTS[slotIdx];
    const opts = slotOptions(s, d);
    const chips = slotChips(s, d);
    return (
      <div className="wrap">
        <div className="dots">
          {SLOTS.map((_, i) => (
            <div key={i} className={"dot" + (i < slotIdx ? " done" : i === slotIdx ? " cur" : "")} />
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-2xl md:text-3xl leading-snug">{s.q[lang]}</CardTitle></CardHeader>
          <CardContent>
            {s.type === "choice" && opts && (
              <div className="grid gap-1 md:grid-cols-2 md:gap-2.5">
                {opts.map(([val, label]) => (
                  <Button key={String(val)}
                    variant={val === "self_employment" || s.key === "education_grade" ? "secondary" : "outline"}
                    onClick={() => echo(val, label)}>{label}</Button>
                ))}
              </div>
            )}
            {s.type === "yesno" && [["yes", true], ["no", false]].map(([yn, val]) => (
              <Button key={yn} variant="secondary" onClick={() => echo(val, t(yn))}>{t(yn)}</Button>
            ))}
            {s.type === "text" && (
              <>
                {chips && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {chips.map(([val, label]) => (
                      <Button key={val} variant="outline" size="sm" className="rounded-full w-auto mt-0"
                        onClick={() => { setTextVal(val); echo(val, label); }}>{label}</Button>
                    ))}
                  </div>
                )}
                <Input type="text" value={textVal} placeholder="..."
                  onChange={e => setTextVal(e.target.value)} className="mt-3" />
                {hasSR() && (
                  <div className="flex justify-center mt-4">
                    <button type="button" onClick={onMic} title={lang === "hi" ? "बोलें" : "बोला"} aria-label={lang === "hi" ? "बोलें" : "बोला"} className="mic-btn">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <rect x="9" y="3" width="6" height="11" rx="3" fill="#fff" stroke="none" />
                        <path d="M5 11v1a7 7 0 0 0 14 0v-1" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="9" y1="22" x2="15" y2="22" />
                      </svg>
                    </button>
                  </div>
                )}
                <Button onClick={() => textVal.trim() ? echo(textVal.trim(), textVal.trim()) : setErr(t("err"))}>{t("send")}</Button>
              </>
            )}
            {err && <p className="err text-destructive text-center text-sm mt-3">{err}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirm echo (re-ask cap: max 1 re-ask per slot)
  if (screen === "echo") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("said")}</CardTitle></CardHeader>
        <CardContent>
          <div className="echo">{pending && pending.display}</div>
          <Button onClick={() => confirmSlot(true)}>{t("correct")}</Button>
          {reAsks < 1 && <Button variant="outline" onClick={() => confirmSlot(false)}>{t("again")}</Button>}
        </CardContent>
      </Card>
    </div>
  );

  // Partial recs screen (after Call 1 — 4 mandatory slots)
  if (screen === "partial") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>{t("partial_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("partial_note")}</p>
        </CardHeader>
        <CardContent>
          {recsList}
          {recs && recs.aspiration_override && (
            <div className="mt-3">
              <Badge variant="secondary">{t("asp_badge")}</Badge>
              <p className="text-sm text-muted-foreground mt-1 mb-2">{t("override_note")}</p>
              <RecCard r={recs.aspiration_override} t={t} lang={lang} />
            </div>
          )}
          <Button onClick={() => { setSlotIdx(SLOTS.findIndex(s => s.call === 2)); setScreen("slot"); }}>
            {t("continue_call2")}
          </Button>
          <Button variant="outline" onClick={() => setScreen("recs")}>{t("end_session")}</Button>
        </CardContent>
      </Card>
    </div>
  );

  // Final recommendations + H8 follow-up + M3 contacted
  if (screen === "recs" && recs) return (
    <div className="wrap">
      <Card>
        <CardHeader><CardTitle>{t("recs_title")}</CardTitle></CardHeader>
        <CardContent>
          {recsList}
          {recs && recs.aspiration_override && (
            <div className="mt-3">
              <Badge variant="secondary">{t("asp_badge")}</Badge>
              <p className="text-sm text-muted-foreground mt-1 mb-2">{t("override_note")}</p>
              <RecCard r={recs.aspiration_override} t={t} lang={lang} />
            </div>
          )}
          <div className="flex flex-col gap-1 mt-5">
            {!contactedDone
              ? <Button variant="secondary" onClick={onContacted}>{t("contacted")}</Button>
              : <p className="text-center text-sm text-secondary font-semibold">{t("thanks")}</p>}
            {followupDone
              ? <p className="text-center text-sm text-muted-foreground">{t("followup_thanks")}</p>
              : (<>
                  <p className="text-center text-base mt-3">{t("followup_q")}</p>
                  <Button variant="outline" size="sm" onClick={() => onFollowup("enrolled")}>{t("followup_yes")}</Button>
                  <Button variant="outline" size="sm" onClick={() => onFollowup("not_enrolled")}>{t("followup_no")}</Button>
                  <Button variant="outline" size="sm" onClick={() => onFollowup("deciding")}>{t("followup_deciding")}</Button>
                </>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return null;
}
