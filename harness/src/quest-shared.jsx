import React from "react";
import {
  Heart, Loader2, Flame, Swords, Shield, Trophy, Star, Crown, Hammer, Wrench,
} from "lucide-react";

export const BG = "#0B2545";
export const PANEL = "#0F2E54";
export const PANEL_SOFT = "#15375F";
export const LINE = "#2F4F73";
export const TEXT = "#EAF2FA";
export const TEXT_MUTED = "#8FA8C2";
export const AMBER = "#E8964B";
export const SUCCESS = "#4FD1A5";
export const DANGER = "#E8584B";

export const LEVELS = [
  { min: 0, label: "Stagiaire" },
  { min: 80, label: "Apprenti Codeur" },
  { min: 220, label: "Développeur Junior" },
  { min: 420, label: "Développeur" },
  { min: 650, label: "Développeur Confirmé" },
  { min: 900, label: "Architecte Logiciel" },
  { min: 1150, label: "Maître Fullstack" },
];

export function getLevelInfo(xp) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const pct = next ? Math.min(100, Math.round(((xp - current.min) / (next.min - current.min)) * 100)) : 100;
  return { label: current.label, next, pct };
}

export const STORAGE_KEY = "fullstack-quest-profile";

export const BADGES = {
  first_blood:   { Icon: Swords, label: "Premier Duel", desc: "Terrasser ton tout premier boss." },
  flawless:      { Icon: Shield, label: "Sans une égratignure", desc: "Purifier un secteur sans perdre un seul cœur." },
  combo_master:  { Icon: Flame, label: "Combo Légendaire", desc: "Atteindre un combo de 6 ou plus." },
  perfectionist: { Icon: Star, label: "Perfection", desc: "100 % de bonnes réponses sur un secteur." },
  half_way:      { Icon: Trophy, label: "Mi-Parcours", desc: "Purifier la moitié de la Stack." },
  guardian:      { Icon: Crown, label: "Gardien de la Stack", desc: "Terrasser OVERFLOW et sauver la Stack." },
  chantier_done: { Icon: Hammer, label: "Chantier Livré", desc: "Terminer les 14 jalons du Chantier Fullstack — un vrai projet construit de tes mains." },
  technical_master: { Icon: Wrench, label: "Certifié Technique", desc: "Réussir l'Épreuve Technique des 9 secteurs." },
};

export const ADA_LINES = {
  correct: ["Belle frappe !", "Touché ! Il faiblit.", "Ta logique est solide.", "Exactement ça.", "Tu l'enchaînes parfaitement.", "Continue, il vacille !"],
  wrong:   ["Tiens bon, relis l'explication.", "Il a riposté… reste concentré·e.", "Une erreur n'est qu'une donnée de plus.", "Respire. On apprend de ça."],
  low:     ["Plus qu'un cœur ! Prudence…", "Ta connexion vacille — concentre-toi !"],
  combo:   ["COMBO ! Il ne suit plus ton rythme !", "Tu es lancé·e, ne t'arrête pas !"],
};

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  }
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  return false;
}

export function show(v) {
  if (v === undefined) return "undefined";
  if (typeof v === "string") return `"${v}"`;
  try { const s = JSON.stringify(v); return s === undefined ? String(v) : s; } catch { return String(v); }
}

export async function runCode(userCode, tests) {
  return Promise.all(tests.map(async (t) => {
    try {
      const fn = new Function(`"use strict";\n${userCode}\n;return (${t.call});`);
      let got = fn();
      if (got && typeof got.then === "function") got = await got;
      return { call: t.call, expect: t.expect, got, pass: deepEqual(got, t.expect), error: false };
    } catch (e) {
      return { call: t.call, expect: t.expect, got: String(e && e.message ? e.message : e), pass: false, error: true };
    }
  }));
}

// AI helper: calls configured AI server (Vite env `VITE_AI_SERVER_URL`), falls back to localhost.
export async function aiGenerate(prompt, opts = {}) {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AI_SERVER_URL)
    ? import.meta.env.VITE_AI_SERVER_URL
    : (typeof window !== 'undefined' ? window._VITE_AI_SERVER_URL : null) || 'http://localhost:8000';
  const token = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AI_API_TOKEN)
    ? import.meta.env.VITE_AI_API_TOKEN
    : '';
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-API-Key': token } : {}),
      },
      body: JSON.stringify({ prompt, max_tokens: opts.max_tokens || 256 })
    });
    if (!res.ok) return { error: true, status: res.status, body: await res.text() };
    const j = await res.json();
    return { error: false, data: j };
  } catch (e) {
    return { error: true, message: String(e) };
  }
}

export function shuffleIndices(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let tries = 0; tries < 12; tries++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.some((v, i) => v !== i)) break;
  }
  return a;
}

let _actx = null;
function audioCtx() {
  if (typeof window === "undefined") return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}

function blip({ freq = 440, type = "sine", dur = 0.12, vol = 0.18, slide = 0 }) {
  const ctx = audioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t); o.stop(t + dur);
}

export const SFX = {
  on: true,
  correct(combo = 1) {
    if (!this.on) return;
    const base = 480 + Math.min(combo, 8) * 55;
    blip({ freq: base, type: "triangle", dur: 0.12, vol: 0.16, slide: 180 });
    setTimeout(() => blip({ freq: base * 1.5, type: "triangle", dur: 0.1, vol: 0.12 }), 55);
  },
  wrong() { if (this.on) blip({ freq: 180, type: "sawtooth", dur: 0.28, vol: 0.18, slide: -110 }); },
  hit()   { if (this.on) blip({ freq: 90, type: "square", dur: 0.12, vol: 0.16 }); },
  victory() { if (this.on) [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip({ freq: f, type: "triangle", dur: 0.18, vol: 0.16 }), i * 110)); },
  defeat()  { if (this.on) [330, 247, 185].forEach((f, i) => setTimeout(() => blip({ freq: f, type: "sawtooth", dur: 0.26, vol: 0.16 }), i * 150)); },
  levelup() { if (this.on) [659, 880, 1318].forEach((f, i) => setTimeout(() => blip({ freq: f, type: "triangle", dur: 0.2, vol: 0.18 }), i * 95)); },
};

export const FSQ_CSS = `
      @keyframes fsqShake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-7px,3px)} 40%{transform:translate(6px,-4px)} 60%{transform:translate(-5px,2px)} 80%{transform:translate(4px,-2px)} }
      @keyframes fsqFlinch { 0%{transform:translate(0,0)} 30%{transform:translate(10px,-4px) scale(.96)} 100%{transform:translate(0,0)} }
      @keyframes fsqLunge { 0%{transform:translate(0,0)} 35%{transform:translate(-16px,6px) scale(1.06)} 100%{transform:translate(0,0)} }
      @keyframes fsqFloat { 0%{transform:translateY(0) scale(.7);opacity:0} 15%{transform:translateY(-6px) scale(1.15);opacity:1} 100%{transform:translateY(-58px) scale(1);opacity:0} }
      @keyframes fsqPop { 0%{transform:scale(1)} 50%{transform:scale(1.18)} 100%{transform:scale(1)} }
      @keyframes fsqBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
      @keyframes fsqPulse { 0%,100%{filter:drop-shadow(0 0 4px currentColor)} 50%{filter:drop-shadow(0 0 16px currentColor)} }
      @keyframes fsqGlitch { 0%{transform:translate(0,0);opacity:1} 20%{transform:translate(-4px,2px) skewX(8deg);opacity:.6} 40%{transform:translate(5px,-3px) skewX(-6deg);opacity:.85} 60%{transform:translate(-3px,1px);opacity:.4} 80%{transform:translate(2px,2px);opacity:.7} 100%{transform:translate(0,0);opacity:.25} }
      @keyframes fsqSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      @keyframes fsqBurst { 0%{transform:scale(.2);opacity:0} 40%{opacity:1} 100%{transform:scale(2.4);opacity:0} }
      @keyframes fsqRise { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
      @keyframes fsqBlink { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(.12)} }
      .fsq-shake{animation:fsqShake .4s ease}
      .fsq-flinch{animation:fsqFlinch .4s ease}
      .fsq-lunge{animation:fsqLunge .5s ease}
      .fsq-bob{animation:fsqBob 3s ease-in-out infinite}
      .fsq-pulse{animation:fsqPulse 2.4s ease-in-out infinite}
      .fsq-glitch{animation:fsqGlitch .7s steps(2) forwards}
      .fsq-rise{animation:fsqRise .45s ease both}
      .fsq-eye{transform-origin:center;animation:fsqBlink 4.5s infinite}
      .fsq-float{position:absolute;animation:fsqFloat .9s ease-out forwards;pointer-events:none;font-weight:800}
`;

export function AdaAvatar({ mood = "idle", size = 64 }) {
  const cyan = "#8ECAE6";
  const deep = "#2A6F97";
  let mouth;
  if (mood === "happy")   mouth = <path d="M40 62 Q50 72 60 62" stroke={cyan} strokeWidth="3" fill="none" strokeLinecap="round" />;
  else if (mood === "proud") mouth = <path d="M41 63 Q50 70 59 63" stroke={cyan} strokeWidth="3" fill="none" strokeLinecap="round" />;
  else if (mood === "worried") mouth = <path d="M42 66 Q50 60 58 66" stroke={cyan} strokeWidth="3" fill="none" strokeLinecap="round" />;
  else mouth = <line x1="42" y1="64" x2="58" y2="64" stroke={cyan} strokeWidth="3" strokeLinecap="round" />;
  const eyes = mood === "proud"
    ? (<>
        <path d="M34 50 Q40 46 46 50" stroke={cyan} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M54 50 Q60 46 66 50" stroke={cyan} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>)
    : (<>
        <circle className="fsq-eye" cx="40" cy="49" r={mood === "worried" ? 3 : 4} fill={cyan} />
        <circle className="fsq-eye" cx="60" cy="49" r={mood === "worried" ? 3 : 4} fill={cyan} />
      </>);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="fsq-bob" style={{ color: cyan }}>
      <circle cx="50" cy="20" r="3" fill={cyan} />
      <line x1="50" y1="23" x2="50" y2="32" stroke={cyan} strokeWidth="2" />
      <circle cx="50" cy="55" r="33" fill={deep} fillOpacity="0.35" stroke={cyan} strokeWidth="2.5" />
      <circle cx="50" cy="55" r="33" fill="none" stroke={cyan} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 5" className="fsq-pulse" />
      {mood === "happy" && <text x="74" y="34" fontSize="14" fill={cyan}>✦</text>}
      {eyes}
      {mouth}
    </svg>
  );
}

function BossDecor({ kind, c }) {
  switch (kind) {
    case "ghost":    return <path d="M22 78 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0 L78 50 L22 50 Z" fill={c} fillOpacity="0.25" stroke={c} strokeWidth="2" />;
    case "clone":    return <rect x="34" y="30" width="44" height="44" rx="10" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.5" strokeDasharray="4 4" transform="translate(8,8)" />;
    case "dragon":   return <><path d="M30 30 L22 14 L38 26 Z" fill={c} /><path d="M70 30 L78 14 L62 26 Z" fill={c} /><path d="M14 60 L4 54 L16 68 Z" fill={c} fillOpacity="0.7" /><path d="M86 60 L96 54 L84 68 Z" fill={c} fillOpacity="0.7" /></>;
    case "blob":     return <path d="M50 16 q24 0 28 26 q6 30 -10 38 q-18 10 -36 0 q-16 -10 -10 -38 q4 -26 28 -26 Z" fill={c} fillOpacity="0.3" stroke={c} strokeWidth="2" />;
    case "hydra":    return <><circle cx="34" cy="24" r="9" fill={c} fillOpacity="0.4" stroke={c} strokeWidth="1.5" /><circle cx="66" cy="24" r="9" fill={c} fillOpacity="0.4" stroke={c} strokeWidth="1.5" /><circle cx="50" cy="18" r="9" fill={c} fillOpacity="0.4" stroke={c} strokeWidth="1.5" /></>;
    case "golem":    return <><rect x="20" y="22" width="12" height="12" fill={c} fillOpacity="0.5" /><rect x="68" y="22" width="12" height="12" fill={c} fillOpacity="0.5" /><circle cx="30" cy="70" r="3" fill={c} /><circle cx="70" cy="70" r="3" fill={c} /></>;
    case "gate":     return <path d="M20 80 L20 36 Q50 14 80 36 L80 80" fill="none" stroke={c} strokeWidth="3" />;
    case "mastodon": return <><path d="M30 70 Q18 86 14 96" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M70 70 Q82 86 86 96" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" /></>;
    case "overlord": return <><path d="M24 26 L30 8 L40 22 L50 4 L60 22 L70 8 L76 26 Z" fill={c} stroke={c} strokeWidth="1.5" /><path d="M10 56 L2 50 L14 64 Z" fill={c} /><path d="M90 56 L98 50 L86 64 Z" fill={c} /></>;
    default:         return null;
  }
}

export function BossAvatar({ kind, accent, state = "idle", size = 150 }) {
  const defeated = state === "defeated";
  const c = defeated ? "#6E8198" : accent;
  const eyeFill = defeated ? "#6E8198" : "#FFFFFF";
  const cls = defeated ? "fsq-glitch" : state === "hit" ? "fsq-flinch" : state === "angry" ? "fsq-lunge" : "fsq-bob";
  const narrowed = state === "angry";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={cls} style={{ color: c, filter: defeated ? "grayscale(1)" : "none" }}>
      <BossDecor kind={kind} c={c} />
      <rect x="26" y="34" width="48" height="46" rx="12" fill={c} fillOpacity={defeated ? 0.12 : 0.28} stroke={c} strokeWidth="2.5" className={defeated ? "" : "fsq-pulse"} />
      {defeated ? (
        <>
          <line x1="34" y1="50" x2="44" y2="60" stroke={eyeFill} strokeWidth="3" strokeLinecap="round" />
          <line x1="44" y1="50" x2="34" y2="60" stroke={eyeFill} strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="50" x2="66" y2="60" stroke={eyeFill} strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="50" x2="56" y2="60" stroke={eyeFill} strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="70" x2="62" y2="70" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="39" cy="53" rx="6" ry={narrowed ? 2.5 : 6} fill={eyeFill} />
          <ellipse cx="61" cy="53" rx="6" ry={narrowed ? 2.5 : 6} fill={eyeFill} />
          <circle cx="39" cy="53" r="2.5" fill={c} />
          <circle cx="61" cy="53" r="2.5" fill={c} />
          <path d={narrowed ? "M37 70 L44 66 L50 70 L56 66 L63 70" : "M38 68 L44 72 L50 68 L56 72 L62 68"} stroke={eyeFill} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

export function Frame({ children, accent, className = "" }) {
  const c = accent || LINE;
  return (
    <div className={`relative ${className}`}>
      <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2" style={{ borderColor: c }} />
      <span className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2" style={{ borderColor: c }} />
      <span className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2" style={{ borderColor: c }} />
      <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2" style={{ borderColor: c }} />
      {children}
    </div>
  );
}

export function Hearts({ lives, total = 3 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <Heart
          key={i}
          size={16}
          style={{ color: i < lives ? DANGER : LINE }}
          fill={i < lives ? DANGER : "none"}
        />
      ))}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: TEXT_MUTED }}>
      <div className="flex flex-col items-center gap-3 font-mono text-sm">
        <Loader2 className="animate-spin" size={28} style={{ color: AMBER }} />
        CHARGEMENT DU PLAN DE PROGRESSION…
      </div>
    </div>
  );
}

export function HPBar({ value, max = 100, color, label, Icon, flash }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1 font-mono text-[10px] tracking-wider" style={{ color: TEXT_MUTED }}>
        <span className="flex items-center gap-1">{Icon && <Icon size={11} style={{ color }} />}{label}</span>
        <span style={{ color }}>{Math.ceil(pct)}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden relative" style={{ backgroundColor: "#081B33", border: `1px solid ${LINE}` }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 450ms cubic-bezier(.5,0,.2,1)", boxShadow: flash ? `0 0 12px ${color}` : "none" }} />
      </div>
    </div>
  );
}

export function ComboMeter({ combo }) {
  if (combo < 2) return null;
  const big = combo >= 4;
  return (
    <div className="flex items-center gap-1.5 fsq-rise" style={{ color: big ? AMBER : SUCCESS }} key={combo}>
      <Flame size={big ? 20 : 16} className={big ? "fsq-pulse" : ""} style={{ animation: "fsqPop .3s ease" }} />
      <span className="font-mono font-extrabold" style={{ fontSize: big ? 20 : 16 }}>COMBO ×{combo}</span>
    </div>
  );
}

export function DialogueBubble({ name, text, accent, avatar, side = "left" }) {
  return (
    <div className={`flex items-end gap-2.5 ${side === "right" ? "flex-row-reverse" : ""}`}>
      <div className="shrink-0">{avatar}</div>
      <div className="relative rounded-xl px-3.5 py-2.5 max-w-[78%]" style={{ backgroundColor: PANEL_SOFT, border: `1px solid ${accent}55` }}>
        <p className="font-mono text-[10px] tracking-widest mb-0.5" style={{ color: accent }}>{name}</p>
        <p className="text-xs sm:text-sm leading-snug" style={{ color: TEXT }}>{text}</p>
      </div>
    </div>
  );
}

export function BadgeChip({ id, earned }) {
  const b = BADGES[id];
  if (!b) return null;
  const B = b.Icon;
  return (
    <div className="flex flex-col items-center gap-1 text-center" title={b.desc} style={{ opacity: earned ? 1 : 0.32 }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: earned ? `${AMBER}22` : PANEL_SOFT, border: `1px solid ${earned ? AMBER : LINE}` }}>
        <B size={22} style={{ color: earned ? AMBER : TEXT_MUTED }} />
      </div>
      <span className="font-mono text-[9px] leading-tight w-16" style={{ color: earned ? TEXT : TEXT_MUTED }}>{b.label}</span>
    </div>
  );
}

/* ====== SEED & RNG UTILITIES (for Daily Seeded Challenge & Reproducibility) ====== */
export function rng(seed) {
  let x = seed >>> 0;
  return function() {
    x = ((x ^ (x << 13)) >>> 0);
    x = ((x ^ (x >>> 17)) >>> 0);
    x = ((x ^ (x << 5)) >>> 0);
    return (x >>> 0) / 0xffffffff;
  };
}

export function deriveSeed(parts) {
  let hash = 5381;
  const str = parts.join(":");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function sampleWithRng(array, count, seedValue) {
  const r = rng(seedValue);
  const indices = Array.from({ length: array.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count).map(i => array[i]);
}

/* ====== SRS (Spaced Repetition) HELPERS ====== */
export function initSrsItem() {
  return { ef: 2.5, intervalDays: 0, nextDueISO: new Date().toISOString(), reviews: [] };
}

export function updateSrsItem(item, rating) {
  const now = new Date();
  let { ef, intervalDays } = item;
  if (rating < 3) {
    intervalDays = 0;
    ef = Math.max(1.3, ef - 0.2);
  } else {
    if (intervalDays === 0) intervalDays = 1;
    else if (intervalDays === 1) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ef);
    ef = ef + 0.1 - (5 - rating) * 0.08;
    ef = Math.max(1.3, Math.min(2.5, ef));
  }
  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return {
    ef: Math.round(ef * 100) / 100,
    intervalDays,
    nextDueISO: nextDue.toISOString(),
    lastReviewedISO: now.toISOString(),
    reviews: [...item.reviews, { date: now.toISOString(), rating }],
  };
}

export function getDueItems(srsState, now = new Date()) {
  return Object.entries(srsState || {})
    .filter(([_, item]) => new Date(item.nextDueISO) <= now)
    .map(([qId, item]) => ({ qId, ...item }))
    .sort((a, b) => new Date(a.nextDueISO) - new Date(b.nextDueISO));
}
