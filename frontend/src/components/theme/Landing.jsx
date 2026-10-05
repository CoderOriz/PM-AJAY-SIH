import { HillsScene } from "./Reveal";

const PINS = [
  { icon: "🌿", label: (s) => s.step1, x: "26%", y: "78%" },
  { icon: "💼", label: (s) => s.step2, x: "36%", y: "58%" },
  { icon: "📊", label: (s) => s.step3, x: "52%", y: "42%" },
  { icon: "🚩", label: (s) => s.step4, x: "70%", y: "24%" },
];

export default function Landing({ s, onStart, onExplore }) {
  return (
    <div className="t-hero-grid">
      <div className="rv in">
        <h1 className="t-h1 serif">{s.heroA}<br />{s.heroB}<br />{s.heroC}</h1>
        <p className="t-sub sans">{s.heroSub}</p>
        <div className="t-cta-row">
          <button className="t-cta" onClick={onStart}>{s.start} <span>→</span></button>
          <button className="t-pill ghost" onClick={onExplore}>{s.exploreCta}</button>
        </div>
        <div className="t-scroll">🖱 {s.scroll}</div>
      </div>
      <div className="hills rv in" style={{ transitionDelay: ".1s" }}>
        <HillsScene />
        {PINS.map((p, i) => (
          <button key={i} className="node-pin float-slow" style={{ left: p.x, top: p.y, animationDelay: `${i * 0.9}s` }} onClick={onStart}>
            <span className="dot-glow">{p.icon}</span>
            <span className="lbl">{p.label(s)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
