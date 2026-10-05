import { useRef, useState } from "react";
import Beneficiary from "./Beneficiary";
import Admin from "./Admin";
import Landing from "./components/theme/Landing";
import SkillUniverse from "./components/theme/SkillUniverse";
import OpportunityMap from "./components/theme/OpportunityMap";
import JourneyBuilder from "./components/theme/JourneyBuilder";
import { useRevealRoot } from "./components/theme/Reveal";
import { VOICE_LANGS, langName } from "./dialogue";
import { ui } from "./i18n";

const NAV = [["home", "top"], ["explore", "explore"], ["how", "talk"], ["support", "journey"]];

export default function App() {
  const [view, setView] = useState(location.hash === "#admin" ? "admin" : "site");
  const [uiLang, setUiLang] = useState("mr");
  const [opMode, setOpMode] = useState(false);
  const [opId, setOpId] = useState("");
  const [presetInterest, setPresetInterest] = useState("");
  const [progress, setProgress] = useState(0);
  const [talkKey, setTalkKey] = useState(0);
  const s = ui(uiLang);
  const rootRef = useRevealRoot();

  const talkRef = useRef(null);
  const exploreRef = useRef(null);
  const mapRef = useRef(null);
  const journeyRef = useRef(null);
  const go = (r) => r.current && r.current.scrollIntoView({ behavior: "smooth", block: "start" });

  const startTalk = (interest = "") => {
    if (interest) setPresetInterest(interest);
    setTalkKey((k) => k + 1);
    go(talkRef);
  };

  const stepLit = (i) => progress >= [1, 1, 2, 3][i];
  const steps = [[s.s1, "1"], [s.s2, "2"], [s.s3, "3"], [s.s4, "4"]];

  return (
    <div className="theme sans" ref={rootRef}>
      <header className="t-nav">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 gap-3">
          <button className="t-brand" onClick={() => setView("site")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <img src="/saksham-sathi-icon.svg" alt="Saksham Sathi icon" className="h-9 w-9 rounded-xl" />
            <span className="leading-tight text-left">
              <span className="block text-sm font-extrabold tracking-wide">Saksham Sathi</span>
              <span className="block text-[10.5px] opacity-60 font-medium">{s.tagline}</span>
            </span>
          </button>
          {view === "site" ? (
            <nav className="t-links flex items-center gap-5">
              {NAV.map(([k, id]) => (
                <a key={k} href={`#${id}`} onClick={(e) => {
                  if (id === "top") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
                }}>{s[k]}</a>
              ))}
            </nav>
          ) : <span className="text-sm font-bold opacity-60">GIA Dashboard · Pune pilot</span>}
          <div className="flex items-center gap-2">
            <select className="t-lang" value={uiLang} onChange={(e) => setUiLang(e.target.value)} aria-label="language">
              <option value="en">English</option>
              {VOICE_LANGS.map((l) => <option key={l.code} value={l.code}>{langName(l.code)}</option>)}
            </select>
            <button className="t-pill" onClick={() => go(journeyRef)}>{s.myJourney}</button>
            <button className="t-pill ghost" onClick={() => {
              const v = view === "admin" ? "site" : "admin";
              location.hash = v === "admin" ? "#admin" : "";
              setView(v);
            }}>{view === "admin" ? `← ${s.back}` : `${s.admin} →`}</button>
          </div>
        </div>
      </header>

      {view === "admin" ? (
        <main className="mx-auto w-full max-w-6xl px-4 pb-16"><Admin /></main>
      ) : (
        <main id="top" className="mx-auto w-full max-w-6xl px-4 pb-16">
          {/* 1 — Landing */}
          <section className="t-section">
            <span className="t-kicker"><span className="n">1</span> Landing Page – Your Journey Begins</span>
            <div className="mt-4"><Landing s={s} onStart={() => startTalk()} onExplore={() => go(exploreRef)} /></div>
          </section>

          {/* 2 — Skill universe */}
          <section className="t-section" ref={exploreRef} id="explore">
            <div className="t-panel"><div className="t-panel-head">
              <span className="t-kicker"><span className="n">2</span> Interactive Skill Universe – Explore &amp; Discover</span>
            </div>
            <div className="p-6 md:p-7"><SkillUniverse s={s} onPick={(kw) => startTalk(kw)} /></div></div>
          </section>

          {/* 3 — Opportunity map */}
          <section className="t-section" ref={mapRef}>
            <div className="t-panel"><div className="t-panel-head">
              <span className="t-kicker"><span className="n">3</span> {s.mapKicker || "Opportunity Map – Explore Real Opportunities"}</span>
            </div>
            <div className="p-6 md:p-7"><OpportunityMap s={s} onDetails={() => go(talkRef)} /></div></div>
          </section>

          {/* 4 — Conversational flow (all backend logic lives in Beneficiary, unchanged) */}
          <section className="t-section" ref={talkRef} id="talk">
            <div className="t-panel"><div className="t-panel-head">
              <span className="t-kicker"><span className="n">4</span> {s.talkKicker || "Conversational Flow – Talk and Watch Your Path Unfold"}</span>
            </div>
            <div className="p-6 md:p-7">
              <div className="talk-grid">
                <div className="rv">
                  <h2 className="t-h2 serif">{s.talkTitle}</h2>
                  <p className="t-sub sans mt-2">{s.talkSub}</p>
                </div>
                <div className="rv" style={{ transitionDelay: ".08s" }}>
                  <div className="orb-wrap">
                    <span className="orb-ring" style={{ width: 170, height: 170 }} />
                    <span className="orb-ring" style={{ width: 210, height: 210, opacity: .6 }} />
                    <div className={`orb ${progress > 0 && progress < 3 ? "live" : ""}`}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="#fff" stroke="none" /><path d="M5 11v1a7 7 0 0 0 14 0v-1" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="9" y1="22" x2="15" y2="22" /></svg></div>
                  </div>
                  <p className="text-center text-sm font-extrabold">{s.listening}</p>
                  <div className="orb-eq" aria-hidden><i /><i /><i /><i /><i /></div>
                  <div className="flow-card mt-4">
                    <Beneficiary key={talkKey} opMode={opMode} opId={opId} setOpMode={setOpMode} setOpId={setOpId}
                      uiLang={uiLang} setUiLang={setUiLang} presetInterest={presetInterest}
                      onProgress={(st) => setProgress(st)} />
                  </div>
                </div>
                <div className="grid gap-3 content-start rv" style={{ transitionDelay: ".14s" }}>
                  {steps.map(([label, icon], i) => (
                    <div key={i} className={`step-chip ${stepLit(i) ? "lit" : ""}`}>
                      <span className="ic">{icon}</span>{label}
                    </div>
                  ))}
                </div>
              </div>
            </div></div>
          </section>

          {/* 5 — Journey builder */}
          <section className="t-section" ref={journeyRef} id="journey">
            <span className="t-kicker"><span className="n">5</span> {s.journeyKicker || "Dynamic Journey Builder – Your Journey Comes to Life"}</span>
            <div className="mt-4">
              <JourneyBuilder s={s} progress={progress}
                onGo={(i) => (i <= 1 ? go(exploreRef) : i === 2 ? go(mapRef) : go(talkRef))} />
              <button className="t-cta mt-4" onClick={() => go(exploreRef)}>{s.startExploring} <span>→</span></button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
