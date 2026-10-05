import { useMemo, useState } from "react";

// Sector -> backend primary_interest keyword (keeps recommendation logic intact)
export const SECTORS = [
  { icon: "1", k: "sec1", en: "Construction & Infrastructure", kw: "carpentry", x: 50, y: 8 },
  { icon: "2", k: "sec2", en: "Healthcare & Caregiving", kw: "beauty", x: 76, y: 16 },
  { icon: "3", k: "sec3", en: "Digital & IT", kw: "mobile repair", x: 86, y: 38 },
  { icon: "4", k: "sec4", en: "Transport & Logistics", kw: "shop", x: 78, y: 60 },
  { icon: "5", k: "sec5", en: "Food & Hospitality", kw: "shop", x: 62, y: 78 },
  { icon: "6", k: "sec6", en: "Retail & Services", kw: "shop", x: 42, y: 84 },
  { icon: "7", k: "sec7", en: "Textiles & Handicrafts", kw: "tailoring", x: 24, y: 72 },
  { icon: "8", k: "sec8", en: "Green Energy", kw: "mobile repair", x: 14, y: 52 },
  { icon: "9", k: "sec9", en: "Electrical & Electronics", kw: "mobile repair", x: 16, y: 30 },
  { icon: "10", k: "sec10", en: "Agriculture & Allied Activities", kw: "farming", x: 30, y: 13 },
];

export default function SkillUniverse({ s, onPick }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);
  const list = useMemo(
    () => SECTORS.filter((x) => (x.en + " " + (s[x.k] || "")).toLowerCase().includes(q.trim().toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, s]
  );
  return (
    <div>
      <h2 className="t-h2 serif rv">{s.exploreTitle}</h2>
      <p className="t-sub sans rv" style={{ transitionDelay: ".05s" }}>{s.exploreSub}</p>
      <div className="grid gap-5 mt-5 md:grid-cols-[1fr_1.4fr] items-start">
        <div className="rv" style={{ transitionDelay: ".1s" }}>
          <div className="uni-search">
            <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.searchSkill} />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {list.map((x) => (
              <button key={x.en} className={`chip ${active === x.en ? "on" : ""}`}
                onClick={() => { setActive(x.en); onPick(x.kw, x.en); }}>
                {x.icon} {s[x.k] || x.en}
              </button>
            ))}
            {!list.length && <span className="text-sm opacity-60">—</span>}
          </div>
        </div>
        <div className="uni t-panel rv" style={{ transitionDelay: ".15s", minHeight: 520 }}>
          <svg className="web" viewBox="0 0 100 100" preserveAspectRatio="none">
            {SECTORS.map((a, i) => SECTORS.slice(i + 1).map((b, j) => (
              <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="#d8cdae" strokeWidth=".25" opacity=".7" />
            )))}
            {SECTORS.map((a, i) => (
              <line key={`c${i}`} x1="50" y1="46" x2={a.x} y2={a.y} stroke="#cbbd97" strokeWidth=".35" strokeDasharray="1 1.4" />
            ))}
          </svg>
          <button className="uni-center serif" onClick={() => onPick("", "")}>{s.exploreCta}</button>
          {SECTORS.map((x) => (
            <button key={x.en} className={`uni-node ${active === x.en ? "active" : ""}`}
              style={{ left: `${x.x}%`, top: `${x.y}%` }}
              onClick={() => { setActive(x.en); onPick(x.kw, x.en); }} title={s[x.k] || x.en}>
              <span className="bub">{x.icon}</span>
              <span className="cap">{s[x.k] || x.en}</span>
            </button>
          ))}
          <div className="absolute right-4 top-1/2 text-[11px] font-bold opacity-50 text-center leading-relaxed">
            <div className="flex flex-col items-center gap-1">●<br />●<br />●<br />●<br />{s.dragHint}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
