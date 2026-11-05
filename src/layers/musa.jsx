// Musa's story: the reed basket on the river, papyrus along its banks, and the staff that became a serpent.
import { useMemo } from 'react';
import { Svg } from '../components/stageKit.jsx';
import { rng } from '../lib/geo.js';

const INK = '#2a2420';

/** A woven reed basket, sealed with pitch, its foot on (`x`, `y`) and `w` long, a cloth over one end. */
export function Basket({ cfg }) {
  const { x = 800, y = 760, w = 60, reed = '#b8925a', dark = '#6a4a2a', cloth = '#e8dcc4' } = cfg;
  const h = w * 0.36;
  const weave = Array.from({ length: 7 }, (_, i) => x - w * 0.42 + (i / 6) * w * 0.84);
  return (
    <Svg>
      <ellipse cx={x} cy={y + h * 0.06} rx={w * 0.62} ry={h * 0.22} fill="#000" opacity="0.16" />
      <path d={`M${x - w / 2},${y - h * 0.55} Q${x - w * 0.52},${y} ${x - w * 0.3},${y} L${x + w * 0.3},${y} Q${x + w * 0.52},${y} ${x + w / 2},${y - h * 0.55} Z`} fill={reed} stroke={INK} strokeWidth={w * 0.02} />
      {weave.map((wx, i) => (
        <path key={i} d={`M${wx},${y - h * 0.5} Q${wx + w * 0.02},${y - h * 0.2} ${wx},${y - h * 0.02}`} stroke={dark} strokeWidth={w * 0.012} fill="none" opacity="0.7" />
      ))}
      <path d={`M${x - w * 0.48},${y - h * 0.3} Q${x},${y - h * 0.16} ${x + w * 0.48},${y - h * 0.3}`} stroke={dark} strokeWidth={w * 0.014} fill="none" opacity="0.6" />
      <ellipse cx={x} cy={y - h * 0.55} rx={w / 2} ry={h * 0.2} fill={dark} stroke={INK} strokeWidth={w * 0.016} />
      <path d={`M${x + w * 0.05},${y - h * 0.6} Q${x + w * 0.25},${y - h * 1.05} ${x + w * 0.5},${y - h * 0.58} Z`} fill={cloth} stroke={INK} strokeWidth={w * 0.012} />
    </Svg>
  );
}
Basket.bounds = (c) => {
  const { x = 800, y = 760, w = 60 } = c;
  return [x - w * 0.7, y - w * 0.5, x + w * 0.7, y + w * 0.1];
};

/** Papyrus along a bank: `count` clumps from `x0` to `x1` with their feet on `y`, stalks about `h` tall. */
export function Reeds({ cfg }) {
  const { x0 = 0, x1 = 1600, y = 800, h = 120, count = 12, seed = 9, color = '#5a7a3a', tuft = '#8aa45a' } = cfg;
  const stalks = useMemo(() => {
    const r = rng(seed);
    const out = [];
    for (let c = 0; c < count; c++) {
      const cx = x0 + (x1 - x0) * ((c + 0.5 + (r() - 0.5) * 0.6) / count);
      const n = 4 + Math.floor(r() * 5);
      for (let i = 0; i < n; i++) {
        const hh = h * (0.6 + r() * 0.5);
        const lean = (r() - 0.5) * hh * 0.35;
        out.push({ x: cx + (r() - 0.5) * h * 0.25, hh, lean, y: y + r() * h * 0.06 });
      }
    }
    return out;
  }, [x0, x1, y, h, count, seed]);
  return (
    <Svg>
      {stalks.map((s, i) => {
        const tx = s.x + s.lean;
        const ty = s.y - s.hh;
        return (
          <g key={i}>
            <path d={`M${s.x},${s.y} Q${s.x + s.lean * 0.2},${s.y - s.hh * 0.5} ${tx},${ty}`} stroke={color} strokeWidth={Math.max(1.2, h * 0.018)} fill="none" strokeLinecap="round" />
            {/* the papyrus umbel: a spray of fine rays */}
            {Array.from({ length: 7 }, (_, k) => {
              const a = -Math.PI / 2 + (k - 3) * 0.32;
              const len = s.hh * 0.14;
              return <line key={k} x1={tx} y1={ty} x2={tx + Math.cos(a) * len} y2={ty + Math.sin(a) * len * 0.8} stroke={tuft} strokeWidth={Math.max(0.8, h * 0.008)} strokeLinecap="round" />;
            })}
          </g>
        );
      })}
    </Svg>
  );
}
Reeds.bounds = (c) => {
  const { x0 = 0, x1 = 1600, y = 800, h = 120 } = c;
  return [x0 - h * 0.6, y - h * 1.4, x1 + h * 0.6, y + h * 0.1];
};

/**
 * A shepherd's staff, `len` long, lying on the ground at (`x`, `y`); `state: "serpent"` draws it as a great
 * serpent of ink rearing its head (the sign shown to Musa), `face` -1 turns it to the left.
 */
export function Staff({ cfg }) {
  const { x = 800, y = 780, len = 120, state = 'staff', face = 1, wood = '#7a5232', scale = '#3a4a3a', belly = '#8a9a6a' } = cfg;
  if (state !== 'serpent') {
    return (
      <Svg>
        <g transform={`translate(${x} ${y}) scale(${face} 1)`}>
          <ellipse cx="0" cy={len * 0.02} rx={len * 0.5} ry={len * 0.03} fill="#000" opacity="0.18" />
          <path d={`M${-len / 2},0 L${len * 0.42},${-len * 0.03} Q${len * 0.52},${-len * 0.05} ${len * 0.5},${-len * 0.12}`} stroke={wood} strokeWidth={len * 0.04} fill="none" strokeLinecap="round" />
        </g>
      </Svg>
    );
  }
  // the body: a thick S along the ground rising into a raised neck and head
  const s = len / 120;
  const body = 'M-70,0 C-50,-14 -30,14 -8,2 C12,-10 24,-6 30,-20 C36,-36 30,-56 40,-66 C46,-72 56,-72 60,-66';
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) scale(${face * s} ${s})`}>
        <ellipse cx="-10" cy="4" rx="74" ry="6" fill="#000" opacity="0.18" />
        <path d={body} stroke={INK} strokeWidth="15" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={body} stroke={scale} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={body} stroke={belly} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="2 6" opacity="0.8" />
        <path d="M54,-74 C66,-78 78,-72 78,-66 C78,-60 66,-58 56,-60 Z" fill={scale} stroke={INK} strokeWidth="2" />
        <circle cx="68" cy="-69" r="1.8" fill="#e8d890" />
        <path d="M78,-66 L86,-65 M84,-65 L88,-68 M84,-65 L88,-62" stroke="#a03a2a" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </Svg>
  );
}
Staff.bounds = (c) => {
  const { x = 800, y = 780, len = 120 } = c;
  return [x - len * 0.8, y - len * 0.8, x + len * 0.8, y + len * 0.12];
};

/**
 * A towering wall of sea water, the sea held apart (26:63): from the sea floor `y` up `h`, spanning `x0`–`x1`.
 * Its `face` side (1 = right edge, -1 = left edge) is a sheer cliff of water with streaming foam, looking
 * onto the dry path; the top curls in breaking crests.
 */
export function Seawall({ cfg }) {
  const { x0 = 200, x1 = 760, y = 820, h = 360, face = 1, deep = '#1e3a52', mid = '#3a6a88', light = '#9cc8d8', foam = '#eef6f8', seed = 4 } = cfg;
  const uid = `sw${seed}${face > 0 ? 'r' : 'l'}`;
  const top = y - h;
  const edge = face > 0 ? x1 : x0;
  const far = face > 0 ? x0 : x1;
  const crest = useMemo(() => {
    const r = rng(seed);
    const n = 9;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = far + (edge - far) * u;
      pts.push([x, top + (1 - u) * h * 0.18 + (r() - 0.5) * h * 0.05]);
    }
    return pts;
  }, [far, edge, top, h, seed]);
  const curls = crest.slice(1, -1).map(([cx, cy], i) => {
    const s = h * (0.05 + 0.02 * (i % 3));
    return `M${cx - s * face},${cy + s * 0.2} q${s * face * 0.8},${-s * 1.3} ${s * face * 1.6},${-s * 0.2} q${-s * face * 0.6},${s * 0.1} ${-s * face * 0.5},${s * 0.6}`;
  });
  const body = `M${far},${y} L${far},${crest[0][1]} ${crest.map(([x, cy]) => `L${x.toFixed(1)},${cy.toFixed(1)}`).join(' ')} L${edge},${y} Z`;
  const streaks = Array.from({ length: 14 }, (_, i) => {
    const yy = top + h * 0.12 + (i / 14) * h * 0.86;
    const len = (Math.abs(x1 - x0) * (0.3 + ((i * 37) % 10) / 20));
    return `M${edge - face * len},${yy} L${edge - face * 6},${yy + h * 0.01}`;
  });
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1={top} x2="0" y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={light} />
          <stop offset="0.35" stopColor={mid} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`${uid}f`} x1={edge} y1="0" x2={edge - face * Math.abs(x1 - x0) * 0.25} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={foam} stopOpacity="0.75" />
          <stop offset="1" stopColor={foam} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={body} fill={`url(#${uid}g)`} />
      <path d={body} fill={`url(#${uid}f)`} />
      {streaks.map((d, i) => <path key={i} d={d} stroke={foam} strokeOpacity={0.35} strokeWidth={h * 0.004 + 0.8} />)}
      {Array.from({ length: 9 }, (_, i) => {
        const yy = top + h * 0.1 + i * h * 0.1;
        return <path key={`v${i}`} d={`M${edge},${yy} q${-face * h * 0.015},${h * 0.04} 0,${h * 0.08}`} stroke={foam} strokeOpacity={0.7} strokeWidth={h * 0.006 + 1} fill="none" />;
      })}
      {curls.map((d, i) => <path key={`c${i}`} d={d} stroke={foam} strokeWidth={h * 0.008 + 1} fill="none" strokeLinecap="round" />)}
      <path d={`M${edge},${y} L${edge},${crest.at(-1)[1]}`} stroke={foam} strokeWidth={h * 0.012 + 1} strokeOpacity={0.9} />
    </Svg>
  );
}
Seawall.bounds = (c) => {
  const { x0 = 200, x1 = 760, y = 820, h = 360 } = c;
  return [x0 - 10, y - h * 1.15, x1 + 10, y + 6];
};
