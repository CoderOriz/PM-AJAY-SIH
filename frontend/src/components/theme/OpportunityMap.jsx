import { useEffect, useState } from "react";
import { api } from "../../api";

const POS = [[22, 30], [38, 22], [55, 34], [68, 26], [46, 48], [30, 58], [60, 62], [74, 52]];

export default function OpportunityMap({ s, onDetails }) {
  const [centres, setCentres] = useState([]);
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    api("/admin/centres").then((r) => setCentres(r.centres || [])).catch(() => {});
  }, []);

  const filtered = centres.filter((c) =>
    (c.name || "").toLowerCase().includes(q.trim().toLowerCase())
  );
  const shown = filtered.slice(0, 6);
  const featured = shown[0];

  return (
    <div className="map-grid">
      <div className="rv">
        <h2 className="t-h2 serif">{s.mapTitle}</h2>
        <p className="t-sub sans mt-2">{s.mapSub}</p>
        <div className="uni-search mt-4">
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.searchLoc} />
          <span>◎</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[[ "all", s.fAll], ["centres", s.fCentres], ["jobs", s.fJobs], ["ent", s.fEnt]].map(([k, l]) => (
            <button key={k} className={`chip ${f === k ? "on" : ""}`} onClick={() => setF(k)}>{l}</button>
          ))}
        </div>
        <div className="grid gap-3 mt-4">
          {(f === "all" || f === "centres") && shown.map((c) => (
            <div key={c.id} className="centre-card">
              <div className="font-extrabold text-sm">{c.name}</div>
              <div className="text-xs opacity-60 mt-1">{s.liveData} · {c.status} · {c.last_verified} · <a className="font-bold" href={`tel:${c.phone}`}>{c.phone}</a></div>
            </div>
          ))}
          {(f === "jobs" || f === "ent" || f === "all") && (
            <div className="centre-card" style={{ borderStyle: "dashed" }}>
              <div className="font-extrabold text-sm">{f === "ent" ? s.fEnt : s.fJobs}</div>
              <div className="text-xs opacity-60 mt-1">{s.jobsNote}</div>
            </div>
          )}
        </div>
      </div>
      <div className="map-canvas rv" style={{ transitionDelay: ".1s" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M10 70 Q 30 55 25 35 T 60 20" stroke="#c9d8e8" strokeWidth="5" fill="none" opacity=".7" />
          <path d="M40 90 Q 55 70 75 65 T 95 40" stroke="#c9d8e8" strokeWidth="3" fill="none" opacity=".6" />
          {[...Array(7)].map((_, i) => (
            <g key={i} stroke="#ddd2b4" strokeWidth=".4" opacity=".8">
              <line x1={8 + i * 13} y1="0" x2={14 + i * 13} y2="100" />
              <line x1="0" y1={10 + i * 12} x2="100" y2={6 + i * 12} />
            </g>
          ))}
        </svg>
        {shown.map((c, i) => {
          const [x, y] = POS[i % POS.length];
          return (
            <button key={c.id} className="map-pin" style={{ left: `${x}%`, top: `${y}%` }}
              title={c.name} onClick={() => onDetails(c)}>{i + 1}</button>
          );
        })}
        {featured && (
          <div className="absolute right-3 top-3 left-3 sm:left-auto sm:w-64">
            <div className="centre-card">
              <div className="font-extrabold text-sm">{featured.name}</div>
              <div className="text-xs mt-2 leading-relaxed opacity-70">3.2 {s.featKm} · NSQF Level 4<br />3 {s.featMonths} · {s.featHands}<br />{s.featPlace}</div>
              <button className="t-pill w-full justify-center mt-3" onClick={() => onDetails(featured)}>
                {s.viewDetails} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
