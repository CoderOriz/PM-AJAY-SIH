import { useEffect, useRef } from "react";

export function useRevealRoot() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current || document;
    const els = root.querySelectorAll ? root.querySelectorAll(".rv") : [];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    // elements already in view
    setTimeout(() => els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add("in");
    }), 60);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function HillsScene() {
  return (
    <svg className="scene" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf4de" /><stop offset="1" stopColor="#eef0da" />
        </linearGradient>
        <linearGradient id="h1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9dfc6" /><stop offset="1" stopColor="#c3cba9" />
        </linearGradient>
        <linearGradient id="h2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9cfae" /><stop offset="1" stopColor="#a9b18c" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f7efda" /><stop offset="1" stopColor="#e5d3a8" />
        </linearGradient>
      </defs>
      <rect width="800" height="560" fill="url(#sky)" />
      <circle cx="600" cy="110" r="60" fill="#f6df9f" opacity=".55" />
      <circle cx="600" cy="110" r="90" fill="#f6df9f" opacity=".2" />
      <ellipse cx="180" cy="170" rx="220" ry="60" fill="#e3e6d2" opacity=".8" />
      <ellipse cx="560" cy="200" rx="260" ry="70" fill="#d5dabd" opacity=".8" />
      <path d="M0 300 Q 200 240 380 300 T 800 280 V560 H0 Z" fill="url(#h1)" />
      <path d="M0 360 Q 240 300 460 360 T 800 340 V560 H0 Z" fill="url(#h2)" />
      <path d="M120 560 C 240 430 300 380 380 340 C 470 295 520 260 560 180 C 575 210 560 260 520 300 C 460 360 380 420 300 560 Z"
        fill="url(#road)" opacity=".9" />
      {[[150, 420], [210, 440], [640, 400], [690, 430], [420, 470]].map(([x, y], i) => (
        <g key={i} opacity=".8">
          <rect x={x - 2} y={y - 16} width="4" height="18" fill="#7a6a4e" />
          <ellipse cx={x} cy={y - 22} rx="20" ry="13" fill="#8fa07c" />
          <ellipse cx={x - 10} cy={y - 16} rx="13" ry="9" fill="#9dab88" />
        </g>
      ))}
    </svg>
  );
}
