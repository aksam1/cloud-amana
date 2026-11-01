// The land of Thamud: free-standing outcrops of red and gold sandstone with homes carved straight into
// them, as at al-Hijr; the she-camel that was their sign, drawn only as soft light; and the valley's
// great well. Painted to stand as cards in the WebGL stage (they hold still: motion comes from the
// camera, the light and the particles around them).
import { useMemo } from 'react';
import { Svg, useUid } from '../components/stageKit.jsx';
import { mixColor, rng } from '../lib/geo.js';

const f1 = (n) => n.toFixed(1);
const SAND = '#e2b884';

// ── Outcrops ─────────────────────────────────────────────

/** The skyline of an outcrop: `n` points across its width, from its left foot to its right foot. */
function profile({ x, y, w, h, shape, seed }, n = 72) {
  const r = rng(seed);
  const lobes = shape === 'twin' ? 2 : shape === 'tower' ? 1 : 3;
  const cleft = shape === 'twin' ? 0.2 : shape === 'tower' ? 0 : 0.13;
  const [p1, p2, p3] = [r() * 6.3, r() * 6.3, r() * 6.3];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = Math.abs(2 * t - 1);
    // dome: steep flanks and a broad crown; tower: near-vertical walls and a small cap
    const body = shape === 'tower' ? (1 - u ** 7) ** 0.42 : (1 - u ** 3.2) ** 0.55;
    // rounded lobes with narrow clefts between them, as wind and rain have worn the rock
    const dip = 1 - cleft * (0.5 + 0.5 * Math.cos(2 * Math.PI * lobes * t)) ** 4;
    const rough = 1 + 0.03 * Math.sin(t * 7.3 + p1) + 0.015 * Math.sin(t * 15.1 + p2) + 0.006 * Math.sin(t * 37 + p3);
    const H = i === 0 || i === n ? 0 : h * body * dip * rough;
    pts.push([x - w / 2 + t * w + (i === 0 ? -w * 0.04 : i === n ? w * 0.04 : 0), y - H]);
  }
  return pts;
}

/** One home carved into the rock in the manner of al-Hijr: a smooth panel, pilasters, a stepped crown and a door. */
function Home({ m, stone, lit, glow, uid, k }) {
  const { x, y, w, h } = m;
  const face = mixColor(stone, lit, 0.22);
  const edge = mixColor(stone, '#3a1a14', 0.55);
  const top = y - h;
  const crown = w * 0.09;
  const door = { w: w * 0.26, h: h * 0.42 };
  return (
    <g>
      {/* the panel cut back into the rock, its edges in shadow */}
      <rect x={x - w / 2} y={top} width={w} height={h} fill={face} />
      <rect x={x - w / 2} y={top} width={w * 0.05} height={h} fill={edge} opacity="0.45" />
      <rect x={x + w / 2 - w * 0.03} y={top} width={w * 0.03} height={h} fill={edge} opacity="0.25" />
      {/* two cornices, the upper one crowned by stepped merlons rising toward the middle */}
      <rect x={x - w * 0.52} y={top - crown * 0.4} width={w * 1.04} height={crown * 0.55} fill={mixColor(face, lit, 0.3)} />
      <rect x={x - w * 0.49} y={top + h * 0.3} width={w * 0.98} height={crown * 0.45} fill={mixColor(face, lit, 0.25)} />
      {[-1, 1].map((side) =>
        [0, 1, 2, 3].map((s) => (
          <rect key={`${side}${s}`} x={side < 0 ? x - w * 0.5 + s * w * 0.06 : x + w * 0.5 - (s + 1) * w * 0.06 - w * 0.12} y={top - crown * (0.4 + (s + 1) * 0.55)} width={w * 0.18 - s * w * 0.0} height={crown * 0.55} fill={mixColor(face, lit, 0.18 + s * 0.04)} />
        )),
      )}
      {/* pilasters framing the door, with small capitals */}
      {[-0.4, 0.4].map((u) => (
        <g key={u}>
          <rect x={x + u * w - w * 0.045} y={top + h * 0.34} width={w * 0.09} height={h * 0.66} fill={mixColor(face, lit, 0.16)} />
          <rect x={x + u * w - w * 0.065} y={top + h * 0.34} width={w * 0.13} height={h * 0.035} fill={mixColor(face, lit, 0.3)} />
          <rect x={x + u * w + w * 0.03} y={top + h * 0.34} width={w * 0.015} height={h * 0.66} fill={edge} opacity="0.3" />
        </g>
      ))}
      {/* the door, its lintel and a small pediment above */}
      <path d={`M${x - door.w * 0.75},${y - door.h - h * 0.02} L${x},${y - door.h - h * 0.12} L${x + door.w * 0.75},${y - door.h - h * 0.02} Z`} fill={mixColor(face, lit, 0.25)} />
      <rect x={x - door.w * 0.7} y={y - door.h - h * 0.025} width={door.w * 1.4} height={h * 0.03} fill={mixColor(face, lit, 0.35)} />
      <rect x={x - door.w / 2} y={y - door.h} width={door.w} height={door.h} fill={m.lit ? `url(#${uid}lamp${k})` : '#2a1410'} />
      {m.lit && (
        <>
          <defs>
            <radialGradient id={`${uid}lamp${k}`} cx="0.5" cy="0.75" r="0.75">
              <stop offset="0" stopColor="#fff2c8" />
              <stop offset="0.45" stopColor={glow} />
              <stop offset="1" stopColor={mixColor(glow, '#3a1a10', 0.55)} />
            </radialGradient>
          </defs>
          <ellipse cx={x} cy={y - door.h * 0.45} rx={door.w * 1.5} ry={door.h * 0.85} fill={glow} opacity="0.32" filter={`url(#${uid}soft)`} />
        </>
      )}
      <rect x={x - w / 2} y={top} width={w} height={h} fill="none" stroke={edge} strokeOpacity="0.35" strokeWidth={Math.max(1, w * 0.012)} />
    </g>
  );
}

/**
 * A free-standing outcrop of sandstone rising from the sand on the line `y`, centred at `x`, `w` wide and
 * `h` tall, lit from the left: `shape` "dome" (a broad crown of rounded lobes), "twin" or "tower"; strata,
 * fissures and wind-pitting in the rock and a drift of sand at its foot. `homes` [{x, y, w, h, lit}] are
 * carved into its face (absolute design units, `y` the door sill); a `lit` home has a lamp burning in its
 * door (`glow`). `rift` {x, y0, y1, light} opens lines of light down the rock (0 closed, 1 blazing).
 */
export function Outcrop({ cfg }) {
  const uid = useUid('oc');
  const { x = 800, y = 700, w = 520, h = 420, shape = 'dome', stone = '#c4744c', lit = '#f2c48e', dark = '#6a3434', homes = [], glow = '#ffb45a', rift, seed = 7, sand = true } = cfg;
  const edge = useMemo(() => profile({ x, y, w, h, shape, seed }), [x, y, w, h, shape, seed]);
  const marks = useMemo(() => {
    const r = rng(seed + 11);
    const fissures = Array.from({ length: Math.round(w / 55) }, () => {
      const fx = x - w * 0.42 + r() * w * 0.84;
      return { fx, len: 0.35 + r() * 0.55, bend: (r() - 0.5) * 18 };
    });
    const pits = Array.from({ length: Math.round(w / 9) }, () => ({ px: x - w * 0.4 + r() * w * 0.8, py: y - h * (0.35 + r() * 0.6), rx: 2 + r() * 9, ry: 1.5 + r() * 5 }));
    const strata = Array.from({ length: 7 }, (_, k) => ({ sy: y - h * (0.08 + k * 0.13 + r() * 0.04), o: 0.06 + r() * 0.08, light: k % 2 === 0 }));
    return { fissures, pits, strata };
  }, [x, y, w, h, seed]);
  const top = (fx) => {
    const t = Math.min(1, Math.max(0, (fx - (x - w / 2)) / w));
    return edge[Math.round(t * (edge.length - 1))][1];
  };
  const outline = `M${edge.map(([px, py]) => `${f1(px)},${f1(py)}`).join(' L')} Z`;
  const cracks = useMemo(() => {
    if (!rift) return [];
    const r = rng(seed + 5);
    const { x: rx = x, y0 = y - h * 0.8, y1 = y } = rift;
    const main = [];
    for (let yy = y0, xx = rx; yy <= y1; yy += (y1 - y0) / 14) {
      main.push([xx, yy]);
      xx += (r() - 0.5) * w * 0.05;
    }
    const branches = main.filter((_, i) => i % 3 === 1).map(([bx, by], i) => [[bx, by], [bx + (i % 2 ? 1 : -1) * w * (0.05 + r() * 0.06), by + (y1 - y0) * (0.05 + r() * 0.05)]]);
    return [main, ...branches];
  }, [rift, x, y, w, h, seed]);
  const light = rift?.light ?? 0;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}x`} x1={x - w / 2} y1="0" x2={x + w / 2} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.38" stopColor={mixColor(stone, lit, 0.35)} />
          <stop offset="0.7" stopColor={stone} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${uid}y`} x1="0" y1={y - h} x2="0" y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff4e0" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor={dark} stopOpacity="0.45" />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <path d={outline} />
        </clipPath>
        <filter id={`${uid}soft`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={Math.max(2, w * 0.012)} />
        </filter>
      </defs>
      <path d={outline} fill={`url(#${uid}x)`} />
      <g clipPath={`url(#${uid}c)`}>
        <rect x={x - w} y={y - h * 1.2} width={w * 2} height={h * 1.3} fill={`url(#${uid}y)`} />
        {marks.strata.map((s, i) => (
          <path key={`s${i}`} d={`M${x - w},${f1(s.sy)} Q${x},${f1(s.sy + (i % 2 ? 9 : -7))} ${x + w},${f1(s.sy + 4)}`} stroke={s.light ? lit : dark} strokeOpacity={s.o} strokeWidth={h * 0.035} fill="none" />
        ))}
        {marks.fissures.map((f, i) => {
          const ty = top(f.fx);
          return <path key={`f${i}`} d={`M${f1(f.fx)},${f1(ty)} q${f1(f.bend)},${f1((y - ty) * f.len * 0.5)} ${f1(f.bend * 0.4)},${f1((y - ty) * f.len)}`} stroke={dark} strokeOpacity="0.32" strokeWidth={Math.max(1.5, w * 0.006)} fill="none" />;
        })}
        {marks.pits.map((p, i) => (
          <ellipse key={`p${i}`} cx={p.px} cy={p.py} rx={p.rx} ry={p.ry} fill={dark} opacity="0.16" />
        ))}
      </g>
      {/* the rim of the crown catching the light */}
      <path d={`M${edge.slice(1, Math.round(edge.length * 0.55)).map(([px, py]) => `${f1(px)},${f1(py + 2)}`).join(' L')}`} stroke={mixColor(lit, '#ffffff', 0.3)} strokeOpacity="0.55" strokeWidth={Math.max(1.5, h * 0.008)} fill="none" />
      {sand && <path d={`M${x - w * 0.66},${y + 8} Q${x - w * 0.42},${y - h * 0.07} ${x - w * 0.1},${y - h * 0.035} Q${x + w * 0.3},${y - h * 0.05} ${x + w * 0.64},${y + 8} Z`} fill={SAND} opacity="0.92" />}
      {homes.map((m, k) => (
        <Home key={k} k={k} m={m} stone={stone} lit={lit} glow={glow} uid={uid} />
      ))}
      {cracks.length > 0 && (
        <g>
          {cracks.map((c, i) => (
            <path key={`k${i}`} d={`M${c.map(([cx, cy]) => `${f1(cx)},${f1(cy)}`).join(' L')}`} stroke={dark} strokeOpacity={0.55 * (1 - light)} strokeWidth={Math.max(2, w * 0.006)} fill="none" />
          ))}
          {light > 0 && (
            <g opacity={light}>
              {cracks.map((c, i) => (
                <path key={`g${i}`} d={`M${c.map(([cx, cy]) => `${f1(cx)},${f1(cy)}`).join(' L')}`} stroke="#fff0c8" strokeWidth={w * 0.03 * (i ? 0.6 : 1)} fill="none" filter={`url(#${uid}soft)`} />
              ))}
              {cracks.map((c, i) => (
                <path key={`l${i}`} d={`M${c.map(([cx, cy]) => `${f1(cx)},${f1(cy)}`).join(' L')}`} stroke="#ffffff" strokeWidth={Math.max(2, w * 0.007) * (i ? 0.7 : 1)} fill="none" />
              ))}
            </g>
          )}
        </g>
      )}
    </Svg>
  );
}
Outcrop.bounds = (c) => {
  const { x = 800, y = 700, w = 520, h = 420, homes = [] } = c;
  const hx = homes.flatMap((m) => [m.x - m.w, m.x + m.w]);
  const hy = homes.map((m) => m.y - m.h - m.w * 0.5);
  return [Math.min(x - w * 0.72, ...hx), Math.min(y - h * 1.12, ...hy), Math.max(x + w * 0.72, ...hx), y + 40];
};

// ── The she-camel ────────────────────────────────────────

// A dromedary in profile, facing right, in units of its height at the hump, feet on y = 0: the body's
// outline from the tail over the hump to the withers, the neck and head (raised, or lowered to drink), and
// four legs as [x at the body, x at the knee, x at the hoof] (the far pair first, drawn darker).
const NECK_UP = 'C0.42,-0.86 0.5,-0.79 0.56,-0.73 C0.62,-0.67 0.68,-0.72 0.72,-0.86 C0.75,-0.97 0.77,-1.04 0.81,-1.08 C0.85,-1.12 0.93,-1.1 0.98,-1.05 C1.0,-1.02 0.99,-0.99 0.95,-0.98 C0.9,-0.98 0.86,-0.99 0.82,-0.97 C0.77,-0.9 0.71,-0.77 0.65,-0.67 C0.59,-0.59 0.51,-0.61 0.45,-0.64';
const NECK_DOWN = 'C0.44,-0.86 0.6,-0.74 0.7,-0.54 C0.76,-0.42 0.8,-0.26 0.83,-0.14 C0.85,-0.08 0.9,-0.03 0.94,-0.02 C0.96,0.0 0.92,0.02 0.88,0.0 C0.84,-0.02 0.8,-0.06 0.77,-0.12 C0.73,-0.26 0.68,-0.42 0.6,-0.54 C0.55,-0.6 0.5,-0.62 0.45,-0.64';
const POSES = {
  stand: { lift: 0, neck: NECK_UP, legs: [[-0.42, -0.44, -0.43], [0.27, 0.29, 0.29], [-0.33, -0.31, -0.31], [0.36, 0.37, 0.38]] },
  walk: { lift: 0, neck: NECK_UP, legs: [[-0.42, -0.5, -0.58], [0.27, 0.22, 0.16], [-0.33, -0.27, -0.2], [0.36, 0.46, 0.55]] },
  drink: { lift: 0, neck: NECK_DOWN, legs: [[-0.42, -0.45, -0.46], [0.27, 0.3, 0.32], [-0.33, -0.31, -0.3], [0.36, 0.42, 0.47]] },
  kneel: { lift: 0.4, neck: NECK_UP, legs: [] },
};
const camelBody = (neck) =>
  `M-0.56,-0.8 C-0.53,-0.92 -0.4,-0.96 -0.3,-0.97 C-0.22,-1.17 -0.04,-1.17 0.06,-0.96 C0.13,-0.92 0.22,-0.9 0.3,-0.88 ${neck} C0.41,-0.6 0.38,-0.56 0.33,-0.55 C0.12,-0.5 -0.2,-0.5 -0.38,-0.55 C-0.47,-0.58 -0.55,-0.66 -0.56,-0.8 Z`;
const leg = ([top, knee, hoof]) => {
  const w0 = 0.075;
  const w1 = 0.042;
  return `M${top - w0 / 2},-0.56 L${top + w0 / 2},-0.56 L${knee + w1 / 2},-0.3 L${hoof + w1 / 2},-0.03 L${hoof + w1 * 0.9},0 L${hoof - w1 * 0.7},0 L${hoof - w1 / 2},-0.03 L${knee - w1 / 2},-0.3 Z`;
};

/**
 * The she-camel, a sign, drawn only as soft light: a dromedary in profile standing on the line `y` at `x`,
 * `h` tall at the hump, facing right (`face: -1` for left), in `pose` "stand", "walk", "drink" (head down
 * to the water) or "kneel"; `glow` (0–1) is the halo of light around her.
 */
export function SheCamel({ cfg }) {
  const uid = useUid('sc');
  const { x = 800, y = 700, h = 160, face = 1, pose = 'stand', color = '#fff6e2', edge = '#efc98a', glow = 0.8 } = cfg;
  const p = POSES[pose] ?? POSES.stand;
  const outline = camelBody(p.neck);
  const folded = pose === 'kneel';
  const shape = (fill, far) => (
    <>
      {!folded && p.legs.slice(0, 2).map((l, i) => <path key={`a${i}`} d={leg(l)} fill={far} />)}
      {folded && <path d="M-0.5,-0.58 C-0.3,-0.5 0.3,-0.5 0.48,-0.58 L0.52,-0.5 C0.3,-0.44 -0.3,-0.44 -0.54,-0.5 Z" fill={fill} />}
      <path d={outline} fill={fill} />
      {!folded && p.legs.slice(2).map((l, i) => <path key={`b${i}`} d={leg(l)} fill={fill} />)}
      <path d="M-0.56,-0.8 q-0.05,0.08 -0.04,0.22" stroke={fill} strokeWidth="0.025" strokeLinecap="round" fill="none" />
    </>
  );
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}core`} cx="0.4" cy="0.42" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={edge} />
        </radialGradient>
        <radialGradient id={`${uid}halo`}>
          <stop offset="0" stopColor={color} stopOpacity="0.5" />
          <stop offset="0.55" stopColor={edge} stopOpacity="0.14" />
          <stop offset="1" stopColor={edge} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}b`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.028" />
        </filter>
      </defs>
      <ellipse cx={x} cy={y - h * 0.6} rx={h * 1.15} ry={h * 0.78} fill={`url(#${uid}halo)`} opacity={0.6 * glow} />
      <g transform={`translate(${x},${y + h * p.lift}) scale(${face * h},${h})`}>
        <g filter={`url(#${uid}b)`} opacity={0.5 + glow * 0.4}>{shape(edge, edge)}</g>
        {shape(`url(#${uid}core)`, mixColor(edge, color, 0.35))}
      </g>
    </Svg>
  );
}
SheCamel.bounds = (c) => {
  const { x = 800, y = 700, h = 160 } = c;
  return [x - h * 1.5, y - h * 1.7, x + h * 1.5, y + h * 0.35];
};

// ── The well ─────────────────────────────────────────────

/**
 * The valley's great well, its front base at (`x`, `y`): a round stone curb `w` across and `h` high seen a
 * little from above, dark water glinting inside; `trough` {len, side} lays a long stone trough beside it
 * (`side` 1 right, -1 left) and `frame` stands a timber frame with a pulley and rope over it.
 */
export function Well({ cfg }) {
  const uid = useUid('wl');
  const { x = 800, y = 720, w = 260, h = 90, stone = '#c89a74', lit = '#ecc8a0', dark = '#6a4a3a', water = '#35505c', trough, frame = true } = cfg;
  const ry = w * 0.17;
  const top = y - h;
  const courses = 4;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}s`} x1={x - w / 2} y1="0" x2={x + w / 2} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.45" stopColor={stone} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`${uid}w`} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor={mixColor(water, '#cfe4ea', 0.35)} />
          <stop offset="0.6" stopColor={water} />
          <stop offset="1" stopColor="#14202a" />
        </radialGradient>
      </defs>
      {trough && (() => {
        const s = trough.side ?? 1;
        const len = trough.len ?? w * 1.3;
        const tx0 = s > 0 ? x + w * 0.42 : x - w * 0.42 - len;
        const th = h * 0.42;
        return (
          <g>
            <path d={`M${tx0},${y - th} L${tx0 + len},${y - th} L${tx0 + len - s * 0},${y - th - ry * 0.55} L${tx0},${y - th - ry * 0.55} Z`} fill={mixColor(stone, lit, 0.3)} />
            <rect x={tx0 + len * 0.04} y={y - th - ry * 0.45} width={len * 0.92} height={ry * 0.3} fill={water} />
            <rect x={tx0} y={y - th} width={len} height={th} fill={`url(#${uid}s)`} />
            <path d={`M${tx0},${y - th * 0.5} L${tx0 + len},${y - th * 0.5}`} stroke="#000" strokeOpacity="0.1" strokeWidth="2" />
          </g>
        );
      })()}
      {/* the curb: a stone drum, its courses following its curve */}
      <path d={`M${x - w / 2},${top} L${x - w / 2},${y} A${w / 2},${ry} 0 0 0 ${x + w / 2},${y} L${x + w / 2},${top} Z`} fill={`url(#${uid}s)`} />
      {Array.from({ length: courses - 1 }, (_, i) => {
        const cy = top + ((i + 1) / courses) * h;
        return <path key={`c${i}`} d={`M${x - w / 2},${cy} A${w / 2},${ry} 0 0 0 ${x + w / 2},${cy}`} stroke="#000" strokeOpacity="0.13" strokeWidth="2" fill="none" />;
      })}
      {Array.from({ length: courses * 5 }, (_, i) => {
        const row = Math.floor(i / 5);
        const a = ((i % 5) + (row % 2) * 0.5 + 0.5) / 5.5;
        const jx = x - (w / 2) * Math.cos(a * Math.PI);
        const cy0 = top + (row / courses) * h + ry * Math.sin(a * Math.PI);
        return <path key={`j${i}`} d={`M${f1(jx)},${f1(cy0)} l0,${f1(h / courses)}`} stroke="#000" strokeOpacity="0.1" strokeWidth="1.6" />;
      })}
      {/* the rim and the water inside it */}
      <ellipse cx={x} cy={top} rx={w / 2} ry={ry} fill={mixColor(stone, lit, 0.4)} />
      <ellipse cx={x} cy={top + ry * 0.05} rx={w * 0.39} ry={ry * 0.72} fill="#1a1612" />
      <ellipse cx={x} cy={top + ry * 0.12} rx={w * 0.36} ry={ry * 0.6} fill={`url(#${uid}w)`} />
      <ellipse cx={x - w * 0.08} cy={top + ry * 0.02} rx={w * 0.12} ry={ry * 0.12} fill="#e8f4f6" opacity="0.45" />
      {frame && (
        <g stroke="#5a3c28" strokeLinecap="round">
          <path d={`M${x - w * 0.46},${top + ry * 0.3} L${x - w * 0.38},${top - w * 0.72}`} strokeWidth={w * 0.045} />
          <path d={`M${x + w * 0.46},${top + ry * 0.3} L${x + w * 0.38},${top - w * 0.72}`} strokeWidth={w * 0.045} />
          <path d={`M${x - w * 0.44},${top - w * 0.7} L${x + w * 0.44},${top - w * 0.7}`} strokeWidth={w * 0.05} />
          <circle cx={x} cy={top - w * 0.62} r={w * 0.06} fill="#6a4a30" strokeWidth={w * 0.012} />
          <path d={`M${x + w * 0.05},${top - w * 0.62} L${x + w * 0.05},${top + ry * 0.1}`} stroke="#3a2a1c" strokeWidth={w * 0.01} />
        </g>
      )}
    </Svg>
  );
}
Well.bounds = (c) => {
  const { x = 800, y = 720, w = 260, h = 90, trough, frame = true } = c;
  const len = trough ? (trough.len ?? w * 1.3) + w * 0.5 : 30;
  const left = trough && (trough.side ?? 1) < 0 ? len : 30;
  const right = trough && (trough.side ?? 1) > 0 ? len : 30;
  return [x - w / 2 - left, y - h - (frame ? w * 0.85 : w * 0.25), x + w / 2 + right, y + w * 0.2 + 20];
};
