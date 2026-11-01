// Earth and everything that grows or is built on it, drawn as ink washes over parchment.
import { useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { branches, lerp, mixColor, ridgeFn, ridgePath, rng, sampleCurve, smoothPath, FLAME_PATH } from '../lib/geo.js';

const EARTH = {
  molten: ['#3a160b', '#120806'],
  raw: ['#4a3826', '#1c140d'],
  green: ['#55703c', '#1d2a17'],
  dusk: ['#3b2b22', '#120c0a'],
};

/** The great curved body of the earth seen from above the horizon. */
export function Earth({ cfg }) {
  const uid = useUid('earth');
  const { y = 640, state = 'raw' } = cfg;
  const [top, bottom] = cfg.colors || EARTH[state] || EARTH.raw;
  const cracks = useMemo(() => {
    const r = rng(41);
    return Array.from({ length: 9 }, (_, i) =>
      branches({ x: 100 + i * 175 + r() * 60, y: y + 60 + r() * 160, angle: r() < 0.5 ? -10 - r() * 30 : 190 + r() * 30, len: 70 + r() * 50, depth: 3, seed: 50 + i, spread: 40, width: 3 }),
    ).flat();
  }, [y]);
  return (
    <Svg>
      <AnimatePresence initial={false}>
        <motion.g key={state} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 2.2, duration: 0.01 } }} transition={{ duration: 2.2 }}>
          <defs>
            <linearGradient id={uid + state} x1="0" y1={y} x2="0" y2={y + 520} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={top} />
              <stop offset="1" stopColor={bottom} />
            </linearGradient>
          </defs>
          <ellipse cx={800} cy={y + 4200} rx={6400} ry={4200} fill={`url(#${uid + state})`} />
        </motion.g>
      </AnimatePresence>
      {state === 'molten' && (
        <g className="breathe" style={{ '--t': '2.4s' }}>
          {cracks.map((c, i) => (
            <path key={`g${i}`} d={c.d} stroke="#ff8a3a" strokeWidth={c.w * 4} strokeOpacity={0.18} fill="none" strokeLinecap="round" />
          ))}
          {cracks.map((c, i) => (
            <path key={i} d={c.d} stroke="#ffb35c" strokeWidth={c.w} fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}
    </Svg>
  );
}

/** One ink-wash ridge. Mountains "rise like pegs" by springing up from below (78:7). */
export function Ridge({ cfg }) {
  const uid = useUid('rg');
  // `x0`/`x1` widen the ridge for long pans across a landscape
  const { y = 600, amp = 120, seed = 1, sharp = 0.45, color = '#2c2a2e', haze = 0.15, rise, risen = true, delay = 0, edge = true, x0, x1 } = cfg;
  const d = useMemo(() => ridgePath({ seed, y, amp, sharp, x0, x1 }), [seed, y, amp, sharp, x0, x1]);
  return (
    <Svg>
      <defs>
        <linearGradient id={uid} x1="0" y1={y - amp * 1.3} x2="0" y2={y + 340} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} />
          <stop offset="0.5" stopColor={color} stopOpacity="0.88" />
          <stop offset="1" stopColor={color} stopOpacity={haze} />
        </linearGradient>
      </defs>
      <motion.g initial={rise ? { y: rise } : false} animate={{ y: rise && !risen ? rise : 0 }} transition={{ type: 'spring', stiffness: 46, damping: 12, delay }}>
        <path d={d} fill={`url(#${uid})`} />
        {edge && <path d={d} fill="none" stroke={color} strokeOpacity={0.75} strokeWidth={1.3} />}
      </motion.g>
    </Svg>
  );
}

/**
 * A single summit in ink-wash, its slopes falling away into cloud: `x`, `y` mark the top, `w` is half the
 * base and `h` the height of the slopes; the face toward the dawn (`lit`) catches the light.
 */
export function Peak({ cfg }) {
  const uid = useUid('pk');
  const { x = 800, y = 520, w = 560, h = 520, color = '#3c3a52', lit = '#b0a2c4', seed = 3 } = cfg;
  const parts = useMemo(() => {
    const f = ridgeFn({ seed, y: 0, amp: 26, sharp: 0.6, freq: 1 / 70 });
    const slope = (side) =>
      Array.from({ length: 31 }, (_, i) => {
        const t = i / 30;
        const px = x + side * w * t;
        return [px, y + h * t ** 1.25 + f(px) * Math.min(1, t * 3) * 0.6];
      });
    const left = slope(-1).reverse();
    const right = slope(1);
    const pt = (p) => p.map((n) => n.toFixed(1)).join(',');
    const base = y + h + 900;
    return {
      body: `M${x - w},${base} L${[...left, ...right.slice(1)].map(pt).join(' L')} L${x + w},${base} Z`,
      face: `M${right.map(pt).join(' L')} L${x + w},${base} L${x + w * 0.12},${base} Z`,
      strata: [0.25, 0.4, 0.55, 0.7].flatMap((t) => [-1, 1].map((side) => `M${x + side * w * t * 0.7},${y + h * (t * 0.7) ** 1.25 + 6} l${side * w * 0.12},${h * 0.07}`)),
    };
  }, [x, y, w, h, seed]);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1={y} x2="0" y2={y + h} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${uid}l`} x1="0" y1={y} x2="0" y2={y + h * 0.8} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit} stopOpacity="0.9" />
          <stop offset="1" stopColor={lit} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={parts.body} fill={`url(#${uid}g)`} />
      <path d={parts.face} fill={`url(#${uid}l)`} opacity="0.55" />
      {parts.strata.map((d, i) => (
        <path key={i} d={d} stroke="#1c1a2a" strokeOpacity="0.35" strokeWidth="2.4" strokeLinecap="round" />
      ))}
    </Svg>
  );
}

/** Rivers as reflective ribbons; seas that flood upward. */
export function Water({ cfg }) {
  const uid = useUid('wt');
  const { mode = 'river', points = [[800, 600], [760, 700], [860, 820], [800, 1000]], w0 = 8, w1 = 300, level = 660, reflect = [['0', '#c8d4dc'], ['1', '#5b7486']], flood = true, low = false } = cfg;
  const ribbon = useMemo(() => {
    const c = sampleCurve(points, 90);
    const k = low ? 0.5 : 1;
    const left = [];
    const right = [];
    c.forEach((p, i) => {
      const a = c[Math.max(0, i - 1)];
      const b = c[Math.min(c.length - 1, i + 1)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      const w = lerp(w0, w1, i / (c.length - 1)) * k * 0.5;
      left.push(`${(p[0] + nx * w).toFixed(1)},${(p[1] + ny * w).toFixed(1)}`);
      right.unshift(`${(p[0] - nx * w).toFixed(1)},${(p[1] - ny * w).toFixed(1)}`);
    });
    return `M${left.join(' L')} L${right.join(' L')} Z`;
  }, [points, w0, w1, low]);
  const centre = useMemo(() => smoothPath(points), [points]);
  const grad = (
    <linearGradient id={uid} x1="0" y1={mode === 'sea' ? level : points[0][1]} x2="0" y2={mode === 'sea' ? level + 400 : points.at(-1)[1]} gradientUnits="userSpaceOnUse">
      {/* the reflection eases to new colours (a pale winter river, a bright summer one) */}
      {reflect.map(([o, c], i) => (
        <motion.stop key={i} offset={o} initial={false} animate={{ stopColor: c }} transition={{ duration: 2.2 }} />
      ))}
    </linearGradient>
  );
  if (mode === 'sea') {
    return (
      <Svg>
        <defs>{grad}</defs>
        <motion.g initial={{ y: 460 }} animate={{ y: flood ? 0 : 460 }} transition={{ duration: 5.5, ease: [0.4, 0, 0.2, 1] }}>
          <rect x={-900} y={level} width={3400} height={2600} fill={`url(#${uid})`} />
          {Array.from({ length: 14 }, (_, i) => (
            <motion.line key={i} x1={-300 + (i * 157) % 2200} x2={-180 + (i * 157) % 2200} y1={level + 14 + (i % 5) * 22} y2={level + 14 + (i % 5) * 22} stroke="#e8eef2" strokeOpacity={0.35} strokeWidth={1.4} animate={{ x: [0, 60, 0] }} transition={{ duration: 7 + (i % 4), repeat: Infinity, ease: 'easeInOut' }} />
          ))}
        </motion.g>
      </Svg>
    );
  }
  return (
    <Svg>
      <defs>{grad}</defs>
      <motion.path d={ribbon} fill={`url(#${uid})`} initial={false} animate={{ d: ribbon }} transition={{ duration: 3 }} />
      <motion.path d={centre} fill="none" stroke="#fffaf0" strokeOpacity={0.45} strokeWidth={2} strokeDasharray="5 38" strokeLinecap="round" animate={{ strokeDashoffset: [0, -430] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }} />
    </Svg>
  );
}

const CROPS = { dry: '#7b5a35', shoots: '#6d6a33', wheat: '#b08a3c' };

/**
 * Foreground earth: gentle undulation with optional grass, cracks, rocks and a field of crops.
 * `tilt` slopes it into a hillside (positive: rising to the left), grass and all; `x0`/`x1` widen it.
 */
export function Ground({ cfg }) {
  const uid = useUid('gd');
  const { y = 700, amp = 14, seed = 5, color = '#3b2f22', color2 = '#1a140e', grass, grassColor = '#6c7a3a', wind = 0, cracks, rocks, crop, field, tilt = 0, x0 = -700, x1 = 2300 } = cfg;
  const fy = useMemo(() => {
    const f = ridgeFn({ seed, y, amp, sharp: 0.1, freq: 1 / 520 });
    return (x) => f(x) + (x - 800) * tilt;
  }, [seed, y, amp, tilt]);
  const d = useMemo(() => ridgePath({ seed, y, amp, sharp: 0.1, freq: 1 / 520, tilt, x0, x1 }), [seed, y, amp, tilt, x0, x1]);
  const extras = useMemo(() => {
    const r = rng(seed + 100);
    const n = grass === true ? 70 : grass;
    const tufts = grass
      ? Array.from({ length: n }, (_, i) => {
          const x = x0 + 450 + (i + r()) * ((x1 - x0 - 900) / n);
          return { x, y: fy(x) + 2, h: 10 + r() * 20, n: 3 + Math.floor(r() * 3), t: 2 + r() * 2.2, d: r() * 2 };
        })
      : [];
    const crackList = cracks ? Array.from({ length: 14 }, (_, i) => branches({ x: -100 + i * 140 + r() * 80, y: y + 40 + r() * 220, angle: r() * 360, len: 30 + r() * 50, depth: 3, seed: seed + i * 7, spread: 50, width: 2.2 })).flat() : [];
    const rockList = rocks ? Array.from({ length: rocks === true ? 18 : rocks }, () => ({ x: -100 + r() * 1800, y: y + 20 + r() * 260, rx: 8 + r() * 26, ry: 5 + r() * 12 })) : [];
    return { tufts, crackList, rockList };
  }, [grass, cracks, rocks, seed, y, fy, x0, x1]);
  const rows = useMemo(() => {
    if (!field) return [];
    const { x0, x1, y0, y1, inset = 120, rows: n = 9 } = field;
    return Array.from({ length: n }, (_, k) => {
      const t = k / (n - 1);
      const ry = lerp(y0, y1, t);
      const rx0 = lerp(x0 + inset, x0, t);
      const rx1 = lerp(x1 - inset, x1, t);
      const step = lerp(10, 24, t);
      const items = [];
      for (let x = rx0; x <= rx1; x += step) items.push(x);
      return { y: ry, items, h: lerp(7, 26, t), t };
    });
  }, [field]);
  return (
    <Svg>
      <defs>
        <linearGradient id={uid} x1="0" y1={y - amp} x2="0" y2={y + 420} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={color2} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${uid})`} />
      {extras.crackList.map((c, i) => (
        <path key={i} d={c.d} stroke="#120d09" strokeWidth={c.w} strokeOpacity={0.7} fill="none" strokeLinecap="round" />
      ))}
      {extras.rockList.map((k, i) => (
        <g key={i}>
          <ellipse cx={k.x} cy={k.y} rx={k.rx} ry={k.ry} fill="#2a231c" />
          <ellipse cx={k.x - k.rx * 0.2} cy={k.y - k.ry * 0.35} rx={k.rx * 0.55} ry={k.ry * 0.35} fill="#5b4c3c" opacity={0.6} />
        </g>
      ))}
      {field && (
        <AnimatePresence initial={false}>
          <motion.g key={crop || 'dry'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 2, duration: 0.01 } }} transition={{ duration: 2 }}>
            <path d={`M${field.x0 + (field.inset ?? 120)},${field.y0} L${field.x1 - (field.inset ?? 120)},${field.y0} L${field.x1},${field.y1} L${field.x0},${field.y1} Z`} fill={CROPS[crop] || CROPS.dry} opacity={0.85} />
            {crop !== 'dry' &&
              rows.map((row, k) => (
                <g key={k} className={crop === 'wheat' ? 'sway' : undefined} style={{ '--k': `${4 + wind * 6}deg`, '--t': '2.6s', animationDelay: `${-k * 0.22}s` }}>
                  {row.items.map((x, i) =>
                    crop === 'shoots' ? (
                      <line key={i} x1={x} x2={x + 1} y1={row.y} y2={row.y - row.h * 0.45} stroke="#9cbf5a" strokeWidth={1 + row.t * 1.4} strokeLinecap="round" />
                    ) : (
                      <g key={i}>
                        <line x1={x} x2={x + 2} y1={row.y} y2={row.y - row.h} stroke="#c9a04a" strokeWidth={0.8 + row.t * 1.2} />
                        <ellipse cx={x + 2} cy={row.y - row.h} rx={1.2 + row.t * 1.6} ry={3 + row.t * 4} fill="#e7c264" />
                      </g>
                    ),
                  )}
                </g>
              ))}
          </motion.g>
        </AnimatePresence>
      )}
      {extras.tufts.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y}) skewX(${-wind * 22})`}>
          <g className="sway" style={{ '--k': `${3 + wind * 9}deg`, '--t': `${Math.max(0.7, t.t - wind * 1.3)}s`, animationDelay: `${-t.d}s` }}>
            {Array.from({ length: t.n }, (_, k) => (
              <path key={k} d={`M${(k - t.n / 2) * 3},0 Q${(k - t.n / 2) * 4},${-t.h * 0.6} ${(k - t.n / 2) * 6 + 3},${-t.h}`} stroke={grassColor} strokeWidth={1.4} fill="none" strokeLinecap="round" />
            ))}
          </g>
        </g>
      ))}
    </Svg>
  );
}

const DOME = 'M-48,0 C-48,-40 -26,-62 0,-62 C26,-62 48,-40 48,0 Z';
const DOME_STROKES = [
  'M-56,0 L56,0',
  'M-46,0 C-45,-38 -24,-60 2,-62',
  'M46,0 C45,-38 24,-60 -2,-62',
  'M-26,0 C-25,-30 -12,-52 4,-60',
  'M26,0 C25,-30 12,-52 -4,-60',
  'M-44,-20 C-20,-26 20,-26 44,-20',
  'M-34,-42 C-14,-48 14,-48 34,-42',
];

/**
 * A domed shelter of stone and branches, painted in stroke by stroke when `built` (after `delay` ms, so a
 * village can rise one home at a time); one already standing when it appears is simply there. `kindle` (ms)
 * holds back its fire and smoke until it is finished; `rise` sets how high the smoke climbs.
 */
export function Shelter({ cfg }) {
  const { x = 820, y = 660, s = 1, built = true, fire = false, smoke = false, snow = false, delay = 0, kindle = 0, rise } = cfg;
  const standing = useRef(built).current;
  const d0 = delay / 1000;
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <motion.path d={DOME} fill="#6a5238" initial={standing ? false : { opacity: 0 }} animate={{ opacity: built ? 1 : 0 }} transition={{ delay: built ? d0 + 2.3 : 0, duration: 1.4 }} />
        {DOME_STROKES.map((d, i) => (
          // hidden until its stroke begins: a round cap on an empty stroke would still leave a dot
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke="#24180e"
            strokeWidth={2.3}
            strokeLinecap="round"
            initial={standing ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: built ? 1 : 0, opacity: built ? 1 : 0 }}
            transition={{ pathLength: { duration: 1.1, delay: d0 + i * 0.3, ease: 'easeInOut' }, opacity: { duration: 0.01, delay: built ? d0 + i * 0.3 : 1.1 } }}
          />
        ))}
        <motion.path d="M-10,0 L-10,-17 C-10,-26 10,-26 10,-17 L10,0 Z" fill="#160f09" initial={standing ? false : { opacity: 0 }} animate={{ opacity: built ? 1 : 0 }} transition={{ delay: built ? d0 + 2.8 : 0 }} />
        <motion.path d="M-44,-24 C-30,-58 30,-58 44,-24 C26,-44 -26,-44 -44,-24 Z" fill="#f4f1ea" initial={false} animate={{ opacity: snow ? 0.9 : 0 }} transition={{ duration: 1.6 }} />
        {/* keyed so lighting the fire later restarts the wait, rather than counting from when the layer appeared */}
        <motion.g key={fire || smoke ? 'lit' : 'cold'} initial={{ opacity: standing && !kindle ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: kindle / 1000, duration: 1.2 }}>
          {fire && (
            <g transform="translate(74 0)">
              <ellipse cx="0" cy="-6" rx="46" ry="24" fill="#ff9a3c" fillOpacity="0.22" className="breathe" style={{ '--t': '1.4s' }} />
              <g transform="scale(0.2)">
                <path d={FLAME_PATH} fill="#ffb347" className="flame" />
              </g>
              <g transform="scale(0.12)">
                <path d={FLAME_PATH} fill="#fff0c0" className="flame" style={{ animationDelay: '-.3s' }} />
              </g>
              <path d="M-12,2 L12,-2 M-10,-2 L10,2" stroke="#2a1a0e" strokeWidth="2.4" />
            </g>
          )}
          {smoke && (
            <g transform="translate(74 -18)">
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} r={6} fill="#9a948c" className="smoke" style={{ '--t': '7s', '--dx': `${18 + i * 4}px`, '--rise': rise && `${rise}px`, animationDelay: `${i * 1.4}s` }} />
              ))}
            </g>
          )}
        </motion.g>
      </g>
    </Svg>
  );
}

/** Trees of the Garden on three depth planes, with fruit glowing like lanterns. */
export function Garden({ cfg }) {
  const uid = useUid('gdn');
  // `x0`/`x1` keep the trees to one stretch of a wider landscape
  const { plane = 'mid', seed = 4, y = 640, count = 7, fruit = true, avoid = [940, 1180], x0 = -260, x1 = 1860 } = cfg;
  const S = { back: 0.55, mid: 0.9, front: 1.5 }[plane] || 0.9;
  const trees = useMemo(() => {
    const r = rng(seed);
    const out = [];
    for (let i = 0; i < count * 3 && out.length < count; i++) {
      const x = x0 + r() * (x1 - x0);
      if (x > avoid[0] && x < avoid[1]) continue;
      const h = (180 + r() * 140) * S;
      const blobs = Array.from({ length: 7 + Math.floor(r() * 5) }, () => ({ dx: (r() - 0.5) * h * 0.7, dy: -h * (0.55 + r() * 0.42), r: h * (0.14 + r() * 0.12) }));
      const fruits = fruit ? Array.from({ length: 4 + Math.floor(r() * 5) }, () => ({ dx: (r() - 0.5) * h * 0.6, dy: -h * (0.5 + r() * 0.4), d: r() * 4 })) : [];
      out.push({ x, y: y + (r() - 0.5) * 30 * S, h, blobs, fruits });
    }
    return out.sort((a, b) => a.y - b.y);
  }, [seed, count, S, y, fruit, avoid, x0, x1]);
  const haze = plane === 'back';
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}c`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={haze ? '#c9d9a8' : '#c7e391'} />
          <stop offset="0.55" stopColor={haze ? '#7d9a6a' : '#4f8a3c'} />
          <stop offset="1" stopColor={haze ? '#53704f' : '#1f4a2a'} />
        </radialGradient>
        <radialGradient id={`${uid}f`}>
          <stop offset="0" stopColor="#fff0b8" />
          <stop offset="0.35" stopColor="#ffcf6a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffcf6a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity={haze ? 0.7 : 1}>
        {trees.map((t, i) => (
          <g key={i} transform={`translate(${t.x} ${t.y})`}>
            <path d={`M-${t.h * 0.03},0 C-${t.h * 0.02},-${t.h * 0.3} ${t.h * 0.04},-${t.h * 0.45} 0,-${t.h * 0.62} L${t.h * 0.035},-${t.h * 0.6} C${t.h * 0.06},-${t.h * 0.4} ${t.h * 0.04},-${t.h * 0.2} ${t.h * 0.04},0 Z`} fill="#3a2a1c" />
            {t.blobs.map((b, k) => (
              <circle key={k} cx={b.dx} cy={b.dy} r={b.r} fill={`url(#${uid}c)`} stroke="#f2d68a" strokeOpacity={k % 3 === 0 ? 0.35 : 0} strokeWidth={1.4} />
            ))}
            {t.fruits.map((f, k) => (
              <g key={k} className="breathe" style={{ '--t': `${3 + f.d}s`, animationDelay: `${-f.d}s` }}>
                <circle cx={f.dx} cy={f.dy} r={14 * S} fill={`url(#${uid}f)`} />
                <circle cx={f.dx} cy={f.dy} r={3.2 * S} fill="#ffe7a0" />
              </g>
            ))}
          </g>
        ))}
      </g>
    </Svg>
  );
}

/** A single tree: `kind` "forbidden" (dark, shimmering), "bare" (an ink silhouette) or "living" (through the seasons). */
export function Tree({ cfg }) {
  return cfg.kind === 'living' ? <LivingTree cfg={cfg} /> : <InkTree cfg={cfg} />;
}

function InkTree({ cfg }) {
  const uid = useUid('tree');
  const { x = 1060, y = 640, h = 300, kind = 'forbidden', seed = 9 } = cfg;
  const parts = useMemo(() => {
    const strokes = branches({ x: 0, y: 0, angle: -90, len: h * 0.3, depth: kind === 'bare' ? 6 : 4, seed, spread: kind === 'bare' ? 32 : 26, width: h * 0.05, shrink: 0.74 });
    const tips = strokes.filter((s) => s.depth <= 1).map((s) => [s.x1, s.y1]);
    const r = rng(seed + 3);
    const sparks = tips.flatMap(([tx, ty]) => Array.from({ length: 2 }, () => ({ x: tx + (r() - 0.5) * h * 0.25, y: ty + (r() - 0.5) * h * 0.2, d: r() * 4 })));
    return { strokes, tips, sparks };
  }, [h, kind, seed]);
  const ink = kind === 'bare' ? '#0d0a0a' : '#22170f';
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}c`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#355a3e" />
          <stop offset="0.6" stopColor="#173323" />
          <stop offset="1" stopColor="#0b1a12" />
        </radialGradient>
        <radialGradient id={`${uid}a`}>
          <stop offset="0" stopColor="#1d3a2a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1d3a2a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(${x} ${y})`}>
        {kind === 'forbidden' && <ellipse cx="0" cy={-h * 0.62} rx={h * 0.75} ry={h * 0.6} fill={`url(#${uid}a)`} className="breathe" style={{ '--t': '7s' }} />}
        {parts.strokes.map((s, i) => (
          <path key={i} d={s.d} stroke={ink} strokeWidth={Math.max(1, s.w)} strokeLinecap="round" fill="none" />
        ))}
        {kind !== 'bare' &&
          parts.tips.map(([tx, ty], i) => (
            <circle key={i} cx={tx} cy={ty} r={h * (0.11 + (i % 3) * 0.025)} fill={kind === 'forbidden' ? `url(#${uid}c)` : '#4f8a3c'} />
          ))}
        {kind === 'forbidden' &&
          parts.sparks.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={1.6} fill="#bde8c4" className="twinkle" style={{ animationDelay: `${s.d}s` }} />
          ))}
      </g>
    </Svg>
  );
}

// The canopy and twig tips ease toward each season, so a change reads as growth rather than a swap.
const TREE_SEASONS = {
  snow: { leaf: 0, fill: '#c9cfcf', dark: '#aab3b4', hi: '#eef1f0', snow: 1, dots: 0, dot: '#d9ddd9' },
  bud: { leaf: 0.17, fill: '#a7b56c', dark: '#8a9a55', hi: '#d2d99a', snow: 0, dots: 1, dot: '#c3cf78' },
  blossom: { leaf: 0.72, fill: '#ecd3d4', dark: '#d9b5ba', hi: '#fdf5f1', snow: 0, dots: 1, dot: '#f7e6e6' },
  green: { leaf: 1, fill: '#5b7547', dark: '#3f5636', hi: '#93a96c', snow: 0, dots: 0, dot: '#6f8a52' },
  gold: { leaf: 0.9, fill: '#c99a45', dark: '#a4762f', hi: '#ecc779', snow: 0, dots: 0, dot: '#d9ab55' },
};

/**
 * A broad old tree: a short trunk that opens into wide limbs, the outer ones bending toward level
 * under their own weight (unlike the upright fan of `branches`).
 */
function oakLimbs(seed, h) {
  const r = rng(seed);
  const out = [];
  const grow = (x0, y0, a, len, w, depth) => {
    const rad = (a * Math.PI) / 180;
    const bend = ((a + (r() - 0.5) * 22) * Math.PI) / 180;
    const x1 = x0 + Math.cos(rad) * len;
    const y1 = y0 + Math.sin(rad) * len;
    const mx = x0 + Math.cos(bend) * len * 0.5;
    const my = y0 + Math.sin(bend) * len * 0.5;
    out.push({ d: `M${x0.toFixed(1)},${y0.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`, x0, y0, x1, y1, w, depth });
    if (depth === 0) return;
    const kids = depth >= 4 ? 3 : 2 + (r() < 0.35 ? 1 : 0);
    const spread = depth >= 4 ? 96 : 54;
    for (let k = 0; k < kids; k++) {
      let na = a + (k / (kids - 1) - 0.5) * spread + (r() - 0.5) * 18;
      na += (na > -90 ? 1 : -1) * (5 - depth) * 3; // droop toward level
      grow(x1, y1, na, len * (0.66 + r() * 0.16), w * 0.62, depth - 1);
    }
  };
  grow(0, 0, -90 + (r() - 0.5) * 6, h * 0.3, h * 0.09, 5);
  return out;
}

/** One old tree by the river through the year: snow on bare limbs, buds, blossom, heavy green, gold. */
function LivingTree({ cfg }) {
  const { x = 700, y = 660, h = 380, season = 'green', seed = 23 } = cfg;
  const S = TREE_SEASONS[season] || TREE_SEASONS.green;
  const parts = useMemo(() => {
    const strokes = oakLimbs(seed, h);
    const r = rng(seed + 7);
    // Clumps reach the twig ends (depth 1) so summer foliage covers them. Lower clumps wake first;
    // `tone` keeps neighbouring clumps from matching exactly.
    const clusters = strokes
      .filter((s) => s.depth === 1 || s.depth === 2 || (s.depth === 3 && r() < 0.5))
      .map((s) => {
        const R = h * (s.depth === 1 ? 0.045 + r() * 0.025 : 0.06 + r() * 0.03);
        return { x: s.x1, y: s.y1, R, k: 0.85 + r() * 0.3, d: r() * 0.5 + (-s.y1 / h) * 0.7, tone: r() - 0.5, blobs: Array.from({ length: 6 }, () => ({ dx: (r() - 0.5) * R * 1.6, dy: (r() - 0.55) * R * 1.1, r: R * (0.45 + r() * 0.4) })) };
      });
    // a dark underpaint behind the clumps, so the crown reads as one mass rather than separate balls
    const masses = strokes.filter((s) => s.depth === 3).map((s) => ({ x: s.x1, y: s.y1 + h * 0.02, rx: h * (0.13 + r() * 0.04), ry: h * (0.085 + r() * 0.03) }));
    const tips = strokes.filter((s) => s.depth === 0).map((s) => ({ x: s.x1, y: s.y1, d: r() }));
    const limbs = strokes.filter((s) => s.w > h * 0.012);
    // snow only settles on the upper side of limbs that lie closer to level than upright
    const ledges = limbs.filter((s) => Math.abs(s.y1 - s.y0) < Math.abs(s.x1 - s.x0) * 1.3);
    return { boughs: strokes.filter((s) => s.depth >= 2), twigs: strokes.filter((s) => s.depth < 2), clusters, masses, tips, limbs, ledges };
  }, [h, seed]);
  const shade = (c) => mixColor(S.fill, c.tone < 0 ? S.dark : S.hi, Math.abs(c.tone) * 0.7);
  const tw = h * 0.045; // half the trunk's width, for the root flare
  const uid = useUid('lt');
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}s`}>
          <stop offset="0" stopColor="#1d2416" stopOpacity="0.9" />
          <stop offset="1" stopColor="#1d2416" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(${x} ${y})`}>
        <motion.ellipse cx={h * 0.05} cy={4} rx={h * 0.7} ry={h * 0.07} fill={`url(#${uid}s)`} initial={false} animate={{ opacity: 0.12 + S.leaf * 0.28 }} transition={{ duration: 2.4 }} />
        <path d={`M${-tw * 2.4},2 Q${-tw * 1.1},${-tw * 0.4} ${-tw * 0.9},${-tw * 3} L${tw * 0.9},${-tw * 3} Q${tw * 1.2},${-tw * 0.4} ${tw * 2.6},2 Z`} fill="#3a2b1f" />
        {parts.boughs.map((s, i) => (
          <path key={i} d={s.d} stroke="#3a2b1f" strokeWidth={Math.max(1, s.w)} strokeLinecap="round" fill="none" />
        ))}
        <motion.g initial={false} animate={{ opacity: 1 - S.leaf * 0.9 }} transition={{ duration: 2.4 }}>
          {parts.twigs.map((s, i) => (
            <path key={i} d={s.d} stroke="#3a2b1f" strokeWidth={Math.max(1, s.w)} strokeLinecap="round" fill="none" />
          ))}
        </motion.g>
        {parts.limbs.map((s, i) => (
          <path key={`r${i}`} d={s.d} transform={`translate(${(s.w * 0.24).toFixed(1)} 0)`} stroke="#8d775a" strokeOpacity="0.35" strokeWidth={s.w * 0.3} strokeLinecap="round" fill="none" />
        ))}
        <motion.g initial={false} animate={{ opacity: S.snow }} transition={{ duration: 2.2 }}>
          {parts.ledges.map((s, i) => (
            <path key={i} d={s.d} transform={`translate(0 ${(-s.w * 0.45).toFixed(1)})`} stroke="#f3f5f4" strokeWidth={Math.max(1.4, s.w * 0.45)} strokeLinecap="round" fill="none" />
          ))}
        </motion.g>
        {parts.tips.map((t, i) => (
          <motion.circle key={i} cx={t.x} cy={t.y} r={h * 0.009} initial={false} animate={{ opacity: S.dots, fill: S.dot }} transition={{ duration: 1.8, delay: t.d * 0.8 }} />
        ))}
        {parts.masses.map((m, i) => (
          <motion.ellipse key={`m${i}`} cx={m.x} cy={m.y} rx={m.rx} ry={m.ry} initial={false} animate={{ scale: S.leaf, fill: S.dark }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
        ))}
        {parts.clusters.map((c, i) => (
          <motion.g key={i} initial={false} animate={{ scale: S.leaf * c.k, fill: shade(c) }} transition={{ duration: 2.4, delay: c.d, ease: 'easeInOut' }}>
            {c.blobs.map((b, k) => (
              <circle key={k} cx={c.x + b.dx} cy={c.y + b.dy} r={b.r} />
            ))}
            <motion.circle cx={c.x + c.R * 0.22} cy={c.y - c.R * 0.3} r={c.R * 0.52} initial={false} animate={{ fill: S.hi }} transition={{ duration: 2.4, delay: c.d }} opacity={0.55} />
          </motion.g>
        ))}
      </g>
    </Svg>
  );
}

/** A small mound of earth that can grow (a grave, the crow's lesson). */
export function Mound({ cfg }) {
  const { x = 800, y = 660, w = 70, grow = true, color = '#4a3a2a' } = cfg;
  return (
    <Svg>
      <motion.g style={{ originX: 0.5, originY: 1 }} initial={{ scaleY: grow ? 0 : 1 }} animate={{ scaleY: 1 }} transition={{ duration: 2.4, ease: 'easeOut' }}>
        <path d={`M${x - w / 2},${y} C${x - w / 3},${y - w * 0.28} ${x + w / 3},${y - w * 0.28} ${x + w / 2},${y} Z`} fill={color} />
        <path d={`M${x - w / 3},${y - w * 0.12} C${x - w / 6},${y - w * 0.2} ${x + w / 6},${y - w * 0.2} ${x + w / 3},${y - w * 0.12}`} stroke="#6b5640" strokeWidth="1.5" fill="none" />
      </motion.g>
    </Svg>
  );
}

const STONE = 'M-75,0 L-72,-46 L-60,-52 L-30,-49 L-8,-55 L22,-50 L48,-54 L70,-47 L76,0 Z';

/** Rough stone altar with an offering: a ram (placed with care) or a thin bundle of grain (dropped). */
export function Altar({ cfg }) {
  const { x = 640, y = 650, s = 1, offering, placed = false, scatter = false, burn = false } = cfg;
  const stalks = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ a: -14 + i * 3.5, l: 26 + (i % 3) * 6 })), []);
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx="0" cy="4" rx="92" ry="12" fill="#000" opacity="0.35" />
        <path d={STONE} fill="#5d554c" />
        <path d={STONE} fill="none" stroke="#1d1814" strokeWidth="2" />
        <path d="M-60,-30 L-20,-28 M10,-36 L50,-33 M-40,-14 L30,-12" stroke="#2b2520" strokeWidth="1.3" opacity="0.7" />
        <motion.ellipse cx="0" cy="-58" rx="70" ry="16" fill="#fff4d0" initial={{ opacity: 0 }} animate={{ opacity: burn ? [0, 0.9, 0.25] : 0 }} transition={{ duration: 3 }} />
        {offering === 'ram' && (
          <motion.g initial={{ y: -60, opacity: 0 }} animate={{ y: placed ? 0 : -60, opacity: placed ? (burn ? 0 : 1) : 0 }} transition={burn ? { duration: 2.4, delay: 1.2 } : { duration: 2.2, ease: [0.3, 0, 0.2, 1] }}>
            {[[-28, -66], [-12, -72], [6, -73], [22, -68], [-20, -58], [0, -60], [18, -58], [30, -62]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={11} fill="#f4efe3" stroke="#cfc6b4" strokeWidth="1" />
            ))}
            <path d="M34,-70 C44,-76 52,-70 50,-62 C48,-56 40,-56 36,-60" fill="#2a2420" />
            <path d="M40,-72 C34,-84 50,-88 52,-78 C53,-72 46,-70 44,-74" fill="none" stroke="#6b5a44" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        )}
        {offering === 'grain' && (
          <motion.g
            initial={{ y: -90, rotate: -25, opacity: 0 }}
            animate={scatter ? { x: 260, y: -140, rotate: 70, opacity: 0 } : { y: placed ? 0 : -90, rotate: placed ? 6 : -25, opacity: placed ? 1 : 0 }}
            transition={scatter ? { duration: 2.6, ease: 'easeIn' } : { duration: 0.55, ease: 'easeIn' }}
          >
            {stalks.map((st, i) => (
              <g key={i} transform={`translate(${-10 + i * 2.5} -56) rotate(${st.a})`}>
                <line x1="0" y1="0" x2="0" y2={-st.l} stroke="#9f8a55" strokeWidth="1.3" />
                <ellipse cx="0" cy={-st.l} rx="1.6" ry="4" fill="#b59c5c" />
              </g>
            ))}
          </motion.g>
        )}
        {offering === 'grain' && placed && !scatter && (
          <>
            <motion.line x1="30" y1="-52" x2="36" y2="-80" stroke="#9f8a55" strokeWidth="1.3" initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: 48, y: 50, rotate: 80 }} transition={{ duration: 0.9, delay: 0.5, ease: 'easeIn' }} />
            <motion.line x1="-30" y1="-52" x2="-34" y2="-78" stroke="#9f8a55" strokeWidth="1.3" initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: -40, y: 52, rotate: -70 }} transition={{ duration: 1, delay: 0.6, ease: 'easeIn' }} />
          </>
        )}
      </g>
    </Svg>
  );
}

/** Interior of a stone-and-timber dwelling at dusk: hearth, oil lamps, mats, a door onto the night. */
export function Dwelling({ cfg }) {
  const uid = useUid('dw');
  const { vb } = useStage();
  const { door = true, dim = 0 } = cfg;
  const blocks = useMemo(() => {
    const r = rng(77);
    const out = [];
    for (let row = 0; row < 12; row++) {
      let x = -400 - r() * 60;
      while (x < 2000) {
        const w = 70 + r() * 70;
        out.push({ x, y: -260 + row * 72, w, h: 66, o: 0.55 + r() * 0.35 });
        x += w + 6;
      }
    }
    return out;
  }, []);
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}h`} cx="800" cy="720" r="900" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb25c" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#a8571f" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1530" />
          <stop offset="1" stopColor="#2a2b4a" />
        </linearGradient>
        <radialGradient id={`${uid}l`}>
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={vb[0] - 400} y={vb[1] - 400} width={vb[2] + 800} height={vb[3] + 800} fill="#1b130d" />
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill="#4b3a2b" opacity={b.o} />
      ))}
      {door && (
        <g>
          <path d="M1180,640 L1180,420 C1180,330 1340,330 1340,420 L1340,640 Z" fill={`url(#${uid}n)`} />
          {[[1210, 470], [1250, 520], [1300, 500], [1230, 560], [1320, 580], [1270, 600]].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r={2.2} fill="#ffe9b8" className="twinkle" style={{ animationDelay: `${i * 0.6}s` }} />
          ))}
          <path d="M1180,640 L1180,420 C1180,330 1340,330 1340,420 L1340,640" fill="none" stroke="#2a1d12" strokeWidth="10" />
        </g>
      )}
      <rect x={-400} y={640} width={2400} height={1400} fill="#2a1d13" />
      <ellipse cx="800" cy="760" rx="520" ry="120" fill="#6e4a26" opacity="0.55" />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx="800" cy="760" rx={500 - i * 90} ry={112 - i * 20} fill="none" stroke="#9a6a32" strokeOpacity="0.35" strokeWidth="5" strokeDasharray="14 9" />
      ))}
      {[0, 1].map((i) => (
        <rect key={i} x={240 + i * 1080} y={-200} width={38} height={850} fill="#2a1a0f" />
      ))}
      {[0, 1].map((i) => (
        <rect key={i} x={-400} y={70 + i * 70} width={2400} height={30} fill="#2f1d10" />
      ))}
      {[[430, 360], [1050, 340]].map(([lx, ly], i) => (
        <g key={i} transform={`translate(${lx} ${ly})`}>
          <circle r="70" fill={`url(#${uid}l)`} className="breathe" style={{ '--t': '2.2s' }} />
          <path d="M-16,8 C-14,0 14,0 18,6 L22,4 L18,10 C10,14 -10,14 -16,8 Z" fill="#7a5532" />
          <g transform="translate(16 2) scale(0.12)">
            <path d={FLAME_PATH} fill="#ffd27a" className="flame" />
          </g>
        </g>
      ))}
      <g transform="translate(800 812)">
        <ellipse cx="0" cy="0" rx="70" ry="18" fill="#3b2b1f" />
        <g transform="scale(0.55)">
          <path d={FLAME_PATH} fill="#ff9a3c" className="flame" />
        </g>
        <g transform="scale(0.32)">
          <path d={FLAME_PATH} fill="#ffe2a0" className="flame" style={{ animationDelay: '-.4s' }} />
        </g>
      </g>
      <rect x={vb[0] - 400} y={vb[1] - 400} width={vb[2] + 800} height={vb[3] + 800} fill={`url(#${uid}h)`} />
      <rect x={vb[0] - 400} y={vb[1] - 400} width={vb[2] + 800} height={vb[3] + 800} fill="#000" opacity={dim} />
    </Svg>
  );
}

// ── A path down the hill ─────────────────────────────────

/**
 * A footpath winding down a hillside through `points` [[x, y]…], `w0` wide near the camera and narrowing
 * to `w1` far off, dry grass along both edges. `walk` {dur, delay} (ms) stirs the grass beside the path
 * in step with someone walking it, as if touched by a soft breeze.
 */
export function HillPath({ cfg }) {
  const { reduced } = useStage();
  const { points = [], w0 = 40, w1 = 8, color = '#c9b48c', edge = '#8a7452', grass = '#b8a070', walk, seed = 12 } = cfg;
  const { ribbon, tufts } = useMemo(() => {
    const pts = sampleCurve(points, 48);
    const n = pts.length - 1;
    const normal = (i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
    };
    const left = [];
    const right = [];
    const r = rng(seed);
    const tf = [];
    pts.forEach((p, i) => {
      const t = i / n;
      const w = lerp(w0, w1, t) / 2;
      const [nx, ny] = normal(i);
      left.push([p[0] + nx * w, p[1] + ny * w]);
      right.push([p[0] - nx * w, p[1] - ny * w]);
      if (i % 2) return;
      [-1, 1].forEach((side) => {
        const off = w + 6 + r() * 14 * (1 - t);
        tf.push({ x: p[0] + nx * off * side, y: p[1] + ny * off * side, t, s: lerp(1, 0.3, t) * (0.8 + r() * 0.4) });
      });
    });
    const fmt = (q) => q.map((v) => v.toFixed(1)).join(',');
    return { ribbon: `M${left.map(fmt).join(' L')} L${right.reverse().map(fmt).join(' L')} Z`, tufts: tf };
  }, [points, w0, w1, seed]);
  const stir = walk && !reduced;
  return (
    <Svg>
      <path d={ribbon} fill={edge} opacity="0.5" transform="translate(0 3)" />
      <path d={ribbon} fill={color} />
      {tufts.map((g, i) => (
        <g key={i} transform={`translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) scale(${g.s.toFixed(2)})`}>
          <motion.g style={{ originX: 0.5, originY: 1 }} animate={stir ? { rotate: [0, 0, 12, -7, 3, 0] } : { rotate: 0 }} transition={stir ? { duration: 1.8, delay: ((walk.delay ?? 0) + (walk.dur ?? 8000) * g.t) / 1000, times: [0, 0.02, 0.3, 0.6, 0.85, 1] } : { duration: 0 }}>
            {[-7, -2, 3, 8].map((dx, k) => (
              <path key={k} d={`M${dx * 0.5},0 Q${dx},-14 ${dx * 1.6},-${24 + (k % 2) * 8}`} stroke={grass} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            ))}
          </motion.g>
        </g>
      ))}
    </Svg>
  );
}
