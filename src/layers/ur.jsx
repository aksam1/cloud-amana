// The land of Ibrahim: the river city of idols with its stepped temple tower, the carved idols themselves
// (faceless, as every figure here is), and the goat-hair tent of the journey west. Painted to stand as
// cards in the WebGL stage.
import { useMemo } from 'react';
import { Svg, useUid } from '../components/stageKit.jsx';
import { mixColor, rng } from '../lib/geo.js';

const f1 = (n) => n.toFixed(1);
const STUFF = {
  stone: { body: '#a89a86', lit: '#d8ccb6', dark: '#5a5048', trim: '#c8a050' },
  wood: { body: '#7a5a3e', lit: '#a8845e', dark: '#3a2a1e', trim: '#d0a848' },
  gilt: { body: '#b8923e', lit: '#ecd08a', dark: '#6a4a1e', trim: '#3a5a9a' },
  clay: { body: '#b8805a', lit: '#e0ac80', dark: '#6a4632', trim: '#3a6a8a' },
};

// ── Idols ────────────────────────────────────────────────

/**
 * A carved idol standing on its plinth at (`x`, `y`), `h` tall: a tiered crown, a blank face (never any
 * features), hands clasped at the chest and a long skirt of tiered fringes, in `kind` "stone", "wood",
 * "gilt" or "clay", lit from the left. `crack` (0–1) scores it with cracks.
 */
export function Idol({ cfg }) {
  const uid = useUid('id');
  const { x = 800, y = 760, h = 300, kind = 'stone', seed = 3, crack = 0, crown = 3 } = cfg;
  const c = STUFF[kind] ?? STUFF.stone;
  const w = h * 0.34;
  const cracks = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: Math.round(crack * 6) }, () => {
      let px = x + (r() - 0.5) * w * 0.8;
      let py = y - h * (0.15 + r() * 0.7);
      const pts = [[px, py]];
      for (let i = 0; i < 4; i++) pts.push([(px += (r() - 0.5) * w * 0.25), (py += h * 0.04 + r() * h * 0.05)]);
      return pts;
    });
  }, [x, y, h, w, crack, seed]);
  const P = (u, v) => `${f1(x + u * w)},${f1(y - v * h)}`;
  const skirt = `M${P(-0.48, 0.08)} L${P(-0.36, 0.52)} L${P(0.36, 0.52)} L${P(0.48, 0.08)} Z`;
  const torso = `M${P(-0.36, 0.52)} L${P(-0.3, 0.74)} Q${P(0, 0.79)} ${P(0.3, 0.74)} L${P(0.36, 0.52)} Z`;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1={x - w / 2} y1="0" x2={x + w / 2} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c.lit} />
          <stop offset="0.45" stopColor={c.body} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
      </defs>
      {/* the plinth */}
      <rect x={x - w * 0.62} y={y - h * 0.08} width={w * 1.24} height={h * 0.08} fill={mixColor(c.body, c.dark, 0.3)} />
      <rect x={x - w * 0.66} y={y - h * 0.09} width={w * 1.32} height={h * 0.02} fill={c.lit} opacity="0.6" />
      <path d={skirt} fill={`url(#${uid}g)`} />
      {[0.18, 0.28, 0.38, 0.47].map((v, i) => (
        <path key={i} d={`M${P(-0.47 + v * 0.24, v)} q${f1(w * 0.45)},${f1(h * 0.012)} ${f1(w * (0.94 - v * 0.48))},0`} stroke={c.dark} strokeOpacity="0.4" strokeWidth={Math.max(1, h * 0.006)} fill="none" />
      ))}
      {[0.1, 0.2, 0.3, 0.4].map((v, i) => (
        <path key={`t${i}`} d={`M${P(-0.46 + v * 0.22, v)} l0,${f1(h * 0.03)}`} stroke={c.dark} strokeOpacity="0.25" strokeWidth={w * 0.5} strokeDasharray={`${f1(w * 0.02)} ${f1(w * 0.03)}`} />
      ))}
      <path d={torso} fill={`url(#${uid}g)`} />
      {/* hands clasped at the chest */}
      <ellipse cx={x} cy={y - h * 0.63} rx={w * 0.2} ry={h * 0.035} fill={mixColor(c.body, c.lit, 0.3)} stroke={c.dark} strokeOpacity="0.4" strokeWidth={Math.max(1, h * 0.004)} />
      {/* the head: blank, featureless */}
      <ellipse cx={x} cy={y - h * 0.81} rx={w * 0.17} ry={h * 0.065} fill={`url(#${uid}g)`} />
      {/* a tiered crown */}
      {Array.from({ length: crown }, (_, i) => (
        <rect key={`c${i}`} x={x - w * (0.2 - i * 0.03)} y={y - h * (0.87 + (i + 1) * 0.045)} width={w * (0.4 - i * 0.06)} height={h * 0.045} fill={i % 2 ? c.trim : mixColor(c.body, c.lit, 0.2)} stroke={c.dark} strokeOpacity="0.35" strokeWidth={Math.max(1, h * 0.003)} />
      ))}
      <rect x={x - w * 0.36} y={y - h * 0.53} width={w * 0.72} height={h * 0.025} fill={c.trim} opacity="0.85" />
      {cracks.map((pts, i) => (
        <path key={`k${i}`} d={`M${pts.map(([px, py]) => `${f1(px)},${f1(py)}`).join(' L')}`} stroke="#1a120c" strokeOpacity="0.55" strokeWidth={Math.max(1, h * 0.005)} fill="none" />
      ))}
    </Svg>
  );
}
Idol.bounds = (c) => {
  const { x = 800, y = 760, h = 300 } = c;
  const w = h * 0.34;
  return [x - w * 0.8, y - h * 1.08, x + w * 0.8, y + 12];
};

// ── The temple tower ─────────────────────────────────────

/**
 * A stepped temple tower of sun-baked brick rising from the line `y` at `x`, `w` wide at its foot and `h`
 * high: `tiers` terraces with sloping, buttressed walls, a grand stair up the front with two side stairs
 * meeting it, and a small shrine on the summit; lit from the left.
 */
export function Ziggurat({ cfg }) {
  const uid = useUid('zg');
  const { x = 800, y = 700, w = 900, h = 420, tiers = 3, stone = '#c08a5a', lit = '#ecbc88', dark = '#6a4632', shrine = true } = cfg;
  const levels = useMemo(() => {
    const out = [];
    let base = y;
    const shares = [0.42, 0.3, 0.2, 0.15].slice(0, tiers);
    const sum = shares.reduce((a, b) => a + b, 0) + (shrine ? 0.12 : 0);
    shares.forEach((sh, i) => {
      const th = (h * sh) / sum;
      const bw = w * (1 - i * 0.27);
      out.push({ base, top: base - th, bw, tw: bw * 0.93 });
      base -= th;
    });
    return out;
  }, [y, w, h, tiers, shrine]);
  const top = levels.at(-1);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1={x - w / 2} y1="0" x2={x + w / 2} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.5" stopColor={stone} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      {levels.map((l, i) => (
        <g key={i}>
          <path d={`M${f1(x - l.bw / 2)},${f1(l.base)} L${f1(x - l.tw / 2)},${f1(l.top)} L${f1(x + l.tw / 2)},${f1(l.top)} L${f1(x + l.bw / 2)},${f1(l.base)} Z`} fill={`url(#${uid}g)`} />
          {/* buttresses: shallow grooves down the sloping wall */}
          {Array.from({ length: Math.round(l.bw / 46) }, (_, k) => {
            const u = (k + 0.5) / Math.round(l.bw / 46) - 0.5;
            return <path key={k} d={`M${f1(x + u * l.tw)},${f1(l.top + 4)} L${f1(x + u * l.bw)},${f1(l.base)}`} stroke={dark} strokeOpacity="0.22" strokeWidth={Math.max(2, l.bw * 0.006)} />;
          })}
          {/* courses of brick */}
          {Array.from({ length: 5 }, (_, k) => {
            const yy = l.top + ((k + 1) / 6) * (l.base - l.top);
            const half = l.tw / 2 + ((l.bw - l.tw) / 2) * ((k + 1) / 6);
            return <path key={`c${k}`} d={`M${f1(x - half)},${f1(yy)} L${f1(x + half)},${f1(yy)}`} stroke={dark} strokeOpacity="0.1" strokeWidth="2" />;
          })}
          <path d={`M${f1(x - l.tw / 2)},${f1(l.top)} L${f1(x + l.tw / 2)},${f1(l.top)}`} stroke={mixColor(lit, '#ffffff', 0.3)} strokeOpacity="0.5" strokeWidth={Math.max(2, h * 0.006)} />
        </g>
      ))}
      {/* the grand stair up the front, and two side stairs climbing to meet it */}
      {(() => {
        const l0 = levels[0];
        const sw = w * 0.07;
        const meet = l0.top;
        return (
          <g>
            <path d={`M${f1(x - sw)},${f1(y + 6)} L${f1(x - sw * 0.7)},${f1(meet)} L${f1(x + sw * 0.7)},${f1(meet)} L${f1(x + sw)},${f1(y + 6)} Z`} fill={mixColor(stone, lit, 0.35)} />
            {Array.from({ length: 14 }, (_, k) => {
              const yy = y - ((k + 1) / 15) * (y - meet);
              const half = sw - (sw * 0.3 * (k + 1)) / 15;
              return <path key={k} d={`M${f1(x - half)},${f1(yy)} L${f1(x + half)},${f1(yy)}`} stroke={dark} strokeOpacity="0.25" strokeWidth="2" />;
            })}
            {[-1, 1].map((sd) => (
              <path key={sd} d={`M${f1(x + sd * l0.bw * 0.42)},${f1(y)} L${f1(x + sd * sw * 1.1)},${f1(meet + (y - meet) * 0.25)} L${f1(x + sd * sw * 1.1)},${f1(meet + (y - meet) * 0.36)} L${f1(x + sd * l0.bw * 0.42)},${f1(y + 4)} Z`} fill={mixColor(stone, lit, 0.25)} stroke={dark} strokeOpacity="0.2" strokeWidth="2" />
            ))}
          </g>
        );
      })()}
      {shrine && (
        <g>
          <rect x={x - top.tw * 0.32} y={top.top - h * 0.12} width={top.tw * 0.64} height={h * 0.12} fill={mixColor(stone, lit, 0.15)} />
          <rect x={x - top.tw * 0.36} y={top.top - h * 0.13} width={top.tw * 0.72} height={h * 0.018} fill={mixColor(lit, '#ffffff', 0.2)} />
          <rect x={x - top.tw * 0.07} y={top.top - h * 0.075} width={top.tw * 0.14} height={h * 0.075} fill="#2a1a12" />
        </g>
      )}
    </Svg>
  );
}
Ziggurat.bounds = (c) => {
  const { x = 800, y = 700, w = 900, h = 420 } = c;
  return [x - w * 0.56, y - h * 1.06, x + w * 0.56, y + 24];
};

// ── The tent ─────────────────────────────────────────────

/**
 * A long tent of black goat hair pitched on the line `y` at `x`, `w` wide and `h` high: its roof sagging
 * between `poles`, the front open on a dark interior (`lit` glows with a lamp inside), guy ropes pegged out
 * to either side.
 */
export function Tent({ cfg }) {
  const uid = useUid('tn');
  const { x = 800, y = 720, w = 520, h = 200, cloth = '#3a2e28', poles = 4, lit = false, glow = '#ffb860' } = cfg;
  const peaks = Array.from({ length: poles }, (_, i) => [x - w * 0.42 + (i / (poles - 1)) * w * 0.84, y - h * (i === 0 || i === poles - 1 ? 0.78 : 1)]);
  const roof = peaks.map(([px, py], i) => (i === 0 ? `M${f1(x - w / 2)},${f1(y - h * 0.42)} L${f1(px)},${f1(py)}` : `Q${f1((peaks[i - 1][0] + px) / 2)},${f1(py + h * 0.14)} ${f1(px)},${f1(py)}`)).join(' ');
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}l`} cx="0.5" cy="0.7" r="0.7">
          <stop offset="0" stopColor="#ffe8b8" />
          <stop offset="0.5" stopColor={glow} />
          <stop offset="1" stopColor="#3a1e10" />
        </radialGradient>
        <filter id={`${uid}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={w * 0.03} />
        </filter>
      </defs>
      {/* guy ropes */}
      {peaks.map(([px, py], i) => (
        <g key={`r${i}`} stroke="#5a4a3a" strokeWidth={Math.max(1, w * 0.003)} opacity="0.7">
          <path d={`M${f1(px)},${f1(py)} L${f1(x - w * 0.75)},${f1(y + 6)}`} />
          <path d={`M${f1(px)},${f1(py)} L${f1(x + w * 0.75)},${f1(y + 6)}`} />
        </g>
      ))}
      {/* the open front: dark, or lit from within */}
      <path d={`M${f1(x - w * 0.36)},${f1(y)} L${f1(x - w * 0.34)},${f1(y - h * 0.62)} L${f1(x + w * 0.34)},${f1(y - h * 0.62)} L${f1(x + w * 0.36)},${f1(y)} Z`} fill={lit ? `url(#${uid}l)` : '#1a120e'} />
      {lit && <ellipse cx={x} cy={y - h * 0.2} rx={w * 0.45} ry={h * 0.35} fill={glow} opacity="0.3" filter={`url(#${uid}b)`} />}
      {/* the roof and its side walls */}
      <path d={`${roof} L${f1(x + w / 2)},${f1(y - h * 0.42)} L${f1(x + w * 0.36)},${f1(y - h * 0.6)} L${f1(x - w * 0.36)},${f1(y - h * 0.6)} Z`} fill={cloth} />
      <path d={`M${f1(x - w / 2)},${f1(y - h * 0.42)} L${f1(x - w * 0.36)},${f1(y)} L${f1(x - w * 0.36)},${f1(y - h * 0.6)} Z`} fill={mixColor(cloth, '#000000', 0.25)} />
      <path d={`M${f1(x + w / 2)},${f1(y - h * 0.42)} L${f1(x + w * 0.36)},${f1(y)} L${f1(x + w * 0.36)},${f1(y - h * 0.6)} Z`} fill={mixColor(cloth, '#000000', 0.35)} />
      {/* woven strips of the cloth */}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={`s${i}`} d={`M${f1(x - w * 0.46 + (i / 6) * w * 0.92)},${f1(y - h * 0.5)} l0,${f1(-h * 0.36)}`} stroke="#ffffff" strokeOpacity="0.06" strokeWidth={w * 0.03} />
      ))}
      {peaks.map(([px, py], i) => (
        <path key={`p${i}`} d={`M${f1(px)},${f1(py)} L${f1(px)},${f1(y)}`} stroke="#4a3a2a" strokeWidth={Math.max(2, w * 0.008)} opacity={i === 0 || i === poles - 1 ? 0 : 0.9} />
      ))}
    </Svg>
  );
}
Tent.bounds = (c) => {
  const { x = 800, y = 720, w = 520, h = 200 } = c;
  return [x - w * 0.8, y - h * 1.12, x + w * 0.8, y + 24];
};

// ── The ram ──────────────────────────────────────────────

/**
 * The ram sent as a ransom, drawn only as soft light: in profile on the line `y` at `x`, `h` tall at the
 * shoulder, facing right (`face: -1` for left), woolly, a horn curled at the side of its head; `glow` (0–1)
 * is the halo round it.
 */
export function Ram({ cfg }) {
  const uid = useUid('rm');
  const { x = 800, y = 700, h = 90, face = 1, color = '#fffaf0', edge = '#e8d4a8', glow = 0.8 } = cfg;
  const body =
    'M-0.6,-0.52 C-0.66,-0.64 -0.56,-0.78 -0.42,-0.78 C-0.34,-0.86 -0.2,-0.86 -0.12,-0.8 C-0.02,-0.88 0.12,-0.88 0.2,-0.8 C0.28,-0.84 0.36,-0.8 0.38,-0.72 L0.44,-0.8 C0.5,-0.88 0.62,-0.88 0.68,-0.8 L0.78,-0.66 C0.8,-0.61 0.76,-0.58 0.71,-0.59 L0.62,-0.61 C0.56,-0.58 0.5,-0.52 0.44,-0.48 C0.4,-0.4 0.32,-0.36 0.2,-0.36 L-0.38,-0.36 C-0.52,-0.36 -0.6,-0.42 -0.6,-0.52 Z';
  const legs = [-0.44, -0.33, 0.18, 0.29].map((lx) => `M${lx - 0.035},-0.4 L${lx + 0.035},-0.4 L${lx + 0.022},0 L${lx - 0.022},0 Z`).join(' ');
  const horn = 'M0.5,-0.84 C0.38,-0.94 0.28,-0.8 0.34,-0.68 C0.4,-0.58 0.54,-0.62 0.53,-0.71 C0.52,-0.78 0.43,-0.77 0.44,-0.7';
  const shape = (fill) => (
    <>
      <path d={legs} fill={fill} />
      <path d={body} fill={fill} />
      <path d="M-0.6,-0.56 q-0.08,0.04 -0.06,0.14" stroke={fill} strokeWidth="0.04" strokeLinecap="round" fill="none" />
    </>
  );
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}core`} cx="0.45" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={edge} />
        </radialGradient>
        <radialGradient id={`${uid}halo`}>
          <stop offset="0" stopColor={color} stopOpacity="0.5" />
          <stop offset="0.55" stopColor={edge} stopOpacity="0.14" />
          <stop offset="1" stopColor={edge} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}b`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.03" />
        </filter>
      </defs>
      <ellipse cx={x} cy={y - h * 0.55} rx={h * 1.3} ry={h * 0.85} fill={`url(#${uid}halo)`} opacity={0.6 * glow} />
      <g transform={`translate(${x},${y}) scale(${face * h},${h})`}>
        <g filter={`url(#${uid}b)`} opacity={0.5 + glow * 0.4}>{shape(edge)}</g>
        {shape(`url(#${uid}core)`)}
        <path d={horn} stroke={mixColor(edge, '#a08050', 0.35)} strokeWidth="0.05" strokeLinecap="round" fill="none" />
      </g>
    </Svg>
  );
}
Ram.bounds = (c) => {
  const { x = 800, y = 700, h = 90 } = c;
  return [x - h * 1.6, y - h * 1.5, x + h * 1.6, y + h * 0.3];
};
