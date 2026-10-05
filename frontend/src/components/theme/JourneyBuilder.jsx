export default function JourneyBuilder({ s, progress = 0, onGo }) {
  const nodes = [
    { icon: "📍", t: s.you, sub: s.youSub },
    { icon: "🌿", t: s.exploreSkills, sub: s.exploreSkillsSub },
    { icon: "🎓", t: s.viewTraining, sub: s.viewTrainingSub },
    { icon: "💼", t: s.seeOpp, sub: s.seeOppSub },
  ];
  return (
    <div>
      <h2 className="t-h2 serif rv">{s.journeyTitle}</h2>
      <p className="t-sub sans rv" style={{ transitionDelay: ".05s" }}>{s.journeySub}</p>
      <div className="journey mt-5 rv" style={{ transitionDelay: ".1s", background: "linear-gradient(180deg,#fbf4de,#eef0da 55%,#dde3cf)" }}>
        <svg className="bg" viewBox="0 0 1200 340" preserveAspectRatio="none">
          <path d="M40 200 C 220 200 240 90 420 120 C 600 150 620 240 800 210 C 980 180 1020 120 1160 120"
            fill="none" stroke="#7d8f74" strokeWidth="5" opacity=".55" />
          <path d="M40 200 C 220 200 240 90 420 120 C 600 150 620 240 800 210 C 980 180 1020 120 1160 120"
            fill="none" stroke="#c39a4e" strokeWidth="5" strokeDasharray="14 12" opacity=".8">
            <animate attributeName="stroke-dashoffset" from="0" to="-104" dur="3s" repeatCount="indefinite" />
          </path>
        </svg>
        <div className="relative flex flex-wrap items-center gap-3 p-6 md:p-10">
          {nodes.map((n, i) => (
            <button key={i} className={`j-node ${i <= progress ? "done" : ""}`} onClick={() => onGo(i)}>
              <div className="text-xl">{n.icon}</div>
              <div className="t">{n.t}</div>
              <div className="s">{n.sub}</div>
            </button>
          ))}
          <div className="j-node done ml-auto" style={{ borderColor: "#c39a4e", boxShadow: "0 0 0 8px rgba(195,154,78,.15), 0 16px 36px rgba(30,58,45,.18)" }}>
            <div className="text-xl">📊</div>
            <div className="t">{s.yourFuture}</div>
            <div className="s">{s.yourFutureSub}</div>
            <div className="flex gap-2 mt-2">
              <span className="chip">💼 {s.employment}</span>
              <span className="chip">🏪 {s.selfEmp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
