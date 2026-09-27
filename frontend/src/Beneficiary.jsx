import { useState, useEffect, useRef } from "react";
import { D, DATA, DISTRICTS, SLOTS, slotOptions, slotChips, dispOf } from "./dialogue";
import { api } from "./api";
import { speak, startListen, hasSR, preloadVoices } from "./voice";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";

const GAP_VARIANT = { zero: "success", partial: "warning", major: "destructive" };

function RecCard({ r, t }) {
  return (
    <Card className="rec">
      <CardContent className="pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {r.pinned && <Badge>{t("pinned_badge")}</Badge>}
          {r.rpl && <Badge variant="secondary">{t("rpl_badge")}</Badge>}
          <span className="font-bold text-[1.1rem]">{r.title}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {r.sector} · NSQF {t("level")} {r.nsqf_level} · {r.duration_months} {t("months")} · {r.scheme}
          <div className="mt-1">
            <Badge variant={GAP_VARIANT[r.gap]} className="mr-2">{t("gap_" + r.gap)}</Badge>
            {r.centre
              ? <> · {r.centre.name}{r.distance_km != null ? ` · ${t("dist")} ${r.distance_km} ${t("km")}` : ""}{r.centre_stale ? ` · ${t("stale")}` : ""} · <a className="font-bold text-secondary" href={`tel:${r.centre.phone}`}>{r.centre.phone}</a></>
              : <> · {t("no_centre")}</>}
          </div>
          {r.rpl && (
            <div className="mt-1.5">
              {t("coord")}: <a className="font-bold text-secondary" href={`tel:${r.rpl.coordinator}`}>{r.rpl.coordinator}</a> — {r.rpl.note}
            </div>
          )}
          {r.dropout_risk === "high" && <div className="mt-1.5 text-destructive font-medium">{t("dropout_warn")}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Beneficiary() {
  const [screen, setScreen] = useState("phone");
  const [lang, setLang] = useState("mr");
  const [sid, setSid] = useState(null);
  const [confirmed, setConfirmed] = useState({});
  const [slotIdx, setSlotIdx] = useState(0);
  const [reAsks, setReAsks] = useState(0);
  const [pending, setPending] = useState(null); // {val, display}
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [recs, setRecs] = useState(null);
  const [textVal, setTextVal] = useState("");
  const [opMode, setOpMode] = useState(false);
  const [opId, setOpId] = useState("");
  const [contactedDone, setContactedDone] = useState(false);
  const [followupDone, setFollowupDone] = useState(false);
  const micTries = useRef(0);

  const t = k => D[lang][k];
  const d = DATA[lang];

  // TTS: read every screen aloud (consent H7, resume C4, questions, partial recs, results)
  useEffect(() => { preloadVoices(); }, []);
  useEffect(() => {
    if (screen === "consent") speak(t("consent"), lang);
    else if (screen === "resume") speak(t("resume_q"), lang);
    else if (screen === "slot") speak(SLOTS[slotIdx].q[lang], lang);
    else if (screen === "partial") speak(t("partial_title") + ". " + t("partial_note"), lang);
    else if (screen === "recs") speak(t("recs_title"), lang);
  }, [screen, slotIdx, lang]);

  async function startSession() {
    setErr("");
    if (!/^\d{10}$/.test(phone)) { setErr(d.phone_err); return; }
    try {
      const res = await api("/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setSid(res.session_id);
      if (opMode) { // H6: assisted sessions require a certified operator
        try {
          await api(`/session/${res.session_id}/profile`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slots: { assisted_session: true, operator_id: Number(opId) } }),
          });
        } catch { setErr(t("op_not_certified")); return; }
      }
      setConfirmed(res.confirmed_slots || {});
      if (res.confirmed_slots && res.confirmed_slots.language) {
        // C4: profile language fixed once — resume directly, don't ask again
        setLang(res.confirmed_slots.language);
        setScreen("resume");
      } else setScreen("lang");
    } catch { setErr(t("err")); }
  }

  function pickLang(l) {
    setLang(l);
    api(`/session/${sid}/profile`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: { language: l } }),
    }).catch(() => {});
    const hasSlots = Object.keys(confirmed).some(k => SLOTS.some(s => s.key === k));
    setScreen(hasSlots ? "resume" : "consent");
  }

  function consent() {
    api(`/session/${sid}/profile`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: { consent_given: true } }),
    }).catch(() => {}); // H7: session does not proceed without it
    startSlots(confirmed);
  }

  function startSlots(conf) {
    const idx = SLOTS.findIndex(s => !(s.key in conf));
    if (idx === -1) { finish(); return; }
    setSlotIdx(idx);
    setReAsks(0);
    setScreen("slot");
  }

  function resumeOk(same) {
    startSlots(same ? confirmed : {}); // C4: "something changed" re-asks every slot
  }

  function echo(val, display) {
    setPending({ val, display });
    speak(t("said") + " " + display, lang);
    setScreen("echo");
  }

  async function confirmSlot(ok) {
    if (!ok) { setReAsks(r => r + 1); setTextVal(""); setScreen("slot"); return; }
    const key = SLOTS[slotIdx].key;
    const nc = { ...confirmed, [key]: pending.val };
    setConfirmed(nc);
    const payload = { [key]: pending.val };
    if (key === "district_name")
      payload.district_lgd = String((DISTRICTS.find(x => x[0] === pending.val) || [, ""])[1]);
    api(`/session/${sid}/profile`, { // H5: persisted after every slot
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: payload }),
    }).catch(() => {});
    setTextVal("");
    if (slotIdx + 1 >= SLOTS.length) { finish(); }
    else if (SLOTS[slotIdx].call === 1 && SLOTS[slotIdx + 1].call === 2) {
      // H2: Call 1 complete — deliver the partial recommendation
      try { setRecs(await api(`/session/${sid}/recommendations`)); } catch { /* recs optional here */ }
      setScreen("partial");
    } else { setSlotIdx(slotIdx + 1); setScreen("slot"); }
  }

  async function finish() {
    try {
      setRecs(await api(`/session/${sid}/recommendations`));
      setScreen("recs");
    } catch { setErr(t("err")); }
  }

  function onMic() {
    micTries.current = 0;
    const onDone = (txt, conf) => {
      if ((conf || 0) < 0.75 && micTries.current < 1) { // C1: one re-prompt, then accept
        micTries.current++;
        setErr(t("speak_slow"));
        startListen(onDone, lang);
        return;
      }
      setErr("");
      setTextVal(txt);
      echo(txt, txt);
    };
    startListen(onDone, lang);
  }

  async function onContacted() { // M3: behavioural metric
    await api(`/session/${sid}/contacted`, { method: "POST" }).catch(() => {});
    setContactedDone(true);
  }

  async function onFollowup(result) { // H8: 30-day outcome (simulated IVR question)
    await api(`/session/${sid}/followup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    }).catch(() => {});
    setFollowupDone(true);
  }

  const recsList = recs && (
    <>
      {recs.recommendations.map(r => <RecCard key={r.qp_code} r={r} t={t} />)}
      {recs.aspiration_override && <RecCard r={recs.aspiration_override} t={t} />}
    </>
  );

  if (screen === "phone") return (
    <div className="wrap">
      <h1>PM-AJAY</h1>
      <p className="sub text-center text-sm text-muted-foreground">{d.sub}</p>
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("phone_q")}</CardTitle></CardHeader>
        <CardContent>
          <Input type="tel" placeholder="98XXXXXXXX" value={phone}
            onChange={e => setPhone(e.target.value)} />
          <Button onClick={startSession}>{d.phone_btn}</Button>
          <label className="flex items-center gap-2 mt-3 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={opMode} onChange={e => setOpMode(e.target.checked)} />
            {t("op_mode")}
          </label>
          {opMode && <Input type="text" placeholder={t("op_id_q")} value={opId}
            onChange={e => setOpId(e.target.value)} className="mt-2" />}
          {err && <p className="err text-destructive text-center text-sm mt-3">{err}</p>}
        </CardContent>
      </Card>
    </div>
  );

  if (screen === "lang") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>तुम्ही कोणत्या भाषेत बोलू इच्छिता?<br />आप किस भाषा में बात करना चाहेंगे?</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => pickLang("mr")}>मराठी</Button>
          <Button variant="outline" onClick={() => pickLang("hi")}>हिंदी</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (screen === "consent") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("consent")}</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={consent}>{t("consent_btn")}</Button>
          <Button variant="ghost" onClick={() => setNoticeOpen(!noticeOpen)}>{t("consent_more")}</Button>
          {noticeOpen && <p className="notice">{t("notice")}</p>}
        </CardContent>
      </Card>
    </div>
  );

  if (screen === "resume") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("resume_q")}</CardTitle></CardHeader>
        <CardContent>
          <p className="summary">
            {Object.entries(confirmed).map(([k, v]) =>
              d.slot_label[k] ? <div key={k}><b>{d.slot_label[k]}:</b> {dispOf(k, v, lang)}</div> : null)}
          </p>
          <Button onClick={() => resumeOk(true)}>{t("resume_ok")}</Button>
          <Button variant="outline" onClick={() => resumeOk(false)}>{t("resume_chg")}</Button>
        </CardContent>
      </Card>
    </div>
  );

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
          <CardHeader><CardTitle>{s.q[lang]}</CardTitle></CardHeader>
          <CardContent>
            {s.type === "choice" && opts.map(([val, label]) => (
              <Button key={String(val)}
                variant={val === "self_employment" || s.key === "education_grade" ? "secondary" : "outline"}
                onClick={() => echo(val, label)}>{label}</Button>
            ))}
            {s.type === "yesno" && [["yes", true], ["no", false]].map(([yn, val]) => (
              <Button key={yn} variant="secondary" onClick={() => echo(val, t(yn))}>{t(yn)}</Button>
            ))}
            {s.type === "text" && (
              <>
                {chips && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {chips.map(([val, label]) => (
                      <Button key={val} variant="outline" size="sm"
                        className="rounded-full w-auto mt-0"
                        onClick={() => { setTextVal(val); echo(val, label); }}>{label}</Button>
                    ))}
                  </div>
                )}
                <Input type="text" value={textVal} placeholder="..."
                  onChange={e => setTextVal(e.target.value)} className="mt-3" />
                {hasSR() && <Button variant="outline" onClick={onMic}>{lang === "hi" ? "🎤 बोलें" : "🎤 बोला"}</Button>}
                <Button onClick={() => textVal.trim() ? echo(textVal.trim(), textVal.trim()) : setErr(t("err"))}>
                  {t("send")}
                </Button>
              </>
            )}
            {err && <p className="err text-destructive text-center text-sm mt-3">{err}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === "echo") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader><CardTitle>{t("said")}</CardTitle></CardHeader>
        <CardContent>
          <div className="echo">{pending && pending.display}</div>
          <Button onClick={() => confirmSlot(true)}>{t("correct")}</Button>
          {/* F2.1: never ask the same question more than twice — after 1 re-ask, auto-accept */}
          {reAsks < 1 && <Button variant="outline" onClick={() => confirmSlot(false)}>{t("again")}</Button>}
        </CardContent>
      </Card>
    </div>
  );

  if (screen === "partial") return (
    <div className="wrap">
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>{t("partial_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("partial_note")}</p>
        </CardHeader>
        <CardContent>
          {recsList}
          <Button onClick={() => { setSlotIdx(SLOTS.findIndex(s => s.call === 2)); setScreen("slot"); }}>
            {t("continue_call2")}
          </Button>
          <Button variant="outline" onClick={() => setScreen("recs")}>{t("end_session")}</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (screen === "recs" && recs) return (
    <div className="wrap">
      <Card>
        <CardHeader><CardTitle>{t("recs_title")}</CardTitle></CardHeader>
        <CardContent>
          {recsList}
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
