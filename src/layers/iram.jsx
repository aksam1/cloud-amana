// The land of ʿAd: oceans of dunes with blade-sharp crests, Iram's towering columns of rose and gold
// stone, its palaces, gardens, gates and terraces, and what the wind left of them. These are painted to
// stand as cards in the WebGL stage (they work flat on the 2D stage too), so they hold still: motion comes
// from the camera, the light and the particles around them.
import { useMemo } from 'react';
import { Svg, useUid } from '../components/stageKit.jsx';
import { lerp, mixColor, rng } from '../lib/geo.js';

const ROSE = '#d49a7c';
const GOLD = '#f0c49a';
const DUSK = '#8a5a56';
const f1 = (n) => n.toFixed(1);
const pts = (list) => list.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' L');

// ── Dunes ────────────────────────────────────────────────

/**
 * A band of dunes on the line `y`: `count` dunes `amp` high across `x0`–`x1`, each with a blade-sharp crest,
 * a long windward face in the light and a steep slip face in deep violet shadow (`sun` "left" or "right"),
 * fine ripples on the lit side. Stack bands at several depths for an ocean of sand.
 */
export function Dunes({ cfg }) {
  const uid = useUid('dn');
  const { y = 640, amp = 120, count = 5, x0 = -800, x1 = 2400, lit = '#eab070', body = '#c98a54', shade = '#5e3c66', rim = '#ffe6b8', sun = 'left', seed = 3, ripples = true, haze = 0, hazeColor = '#e8c8a8' } = cfg;
  const tone = (c) => mixColor(c, hazeColor, haze);
  const dunes = useMemo(() => {
    const r = rng(seed);
    const step = (x1 - x0) / count;
    const out = [];
    for (let i = 0; i < count; i++) {
      const cx = x0 + (i + 0.25 + r() * 0.5) * step;
      const h = amp * (0.55 + r() * 0.65);
      const wind = step * (0.75 + r() * 0.55);
      const slip = step * (0.42 + r() * 0.3);
      out.push({ cx, top: y - h, wind, slip, h, lean: (r() - 0.5) * 0.25, ripple: Array.from({ length: 6 }, () => r()) });
    }
    return out.sort((a, b) => b.h - a.h);
  }, [y, amp, count, x0, x1, seed]);
  const flip = sun === 'right' ? -1 : 1;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1={y - amp * 1.2} x2="0" y2={y + 260} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tone(lit)} />
          <stop offset="0.45" stopColor={tone(body)} />
          <stop offset="1" stopColor={tone(mixColor(body, '#5a3a2a', 0.35))} />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1={y - amp * 1.2} x2="0" y2={y + 80} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tone(shade)} />
          <stop offset="1" stopColor={tone(mixColor(shade, body, 0.35))} />
        </linearGradient>
      </defs>
      <rect x={x0 - 400} y={y - 2} width={x1 - x0 + 800} height="1600" fill={`url(#${uid}b)`} />
      {dunes.map((d, i) => {
        const L = [d.cx - d.wind * flip, y + 4];
        const C = [d.cx, d.top];
        const R = [d.cx + d.slip * flip, y + 4];
        // the windward face rises in a long curve to the crest; the slip face drops steeply away
        const body = `M${f1(L[0])},${f1(y + 1400)} L${f1(L[0])},${f1(L[1])} C${f1(lerp(L[0], C[0], 0.45))},${f1(y - d.h * 0.1)} ${f1(lerp(L[0], C[0], 0.8))},${f1(d.top + d.h * 0.12)} ${f1(C[0])},${f1(C[1])} C${f1(lerp(C[0], R[0], 0.25))},${f1(d.top + d.h * 0.35)} ${f1(lerp(C[0], R[0], 0.65))},${f1(y - d.h * 0.05)} ${f1(R[0])},${f1(R[1])} L${f1(R[0])},${f1(y + 1400)} Z`;
        const spine = [C[0] + d.slip * 0.08 * flip, y + 6];
        const shadow = `M${f1(C[0])},${f1(C[1])} C${f1(lerp(C[0], R[0], 0.25))},${f1(d.top + d.h * 0.35)} ${f1(lerp(C[0], R[0], 0.65))},${f1(y - d.h * 0.05)} ${f1(R[0])},${f1(R[1])} L${f1(spine[0])},${f1(spine[1])} C${f1(lerp(C[0], spine[0], 0.6) + d.lean * 40)},${f1(lerp(C[1], spine[1], 0.5))} ${f1(C[0])},${f1(C[1] + d.h * 0.3)} ${f1(C[0])},${f1(C[1])} Z`;
        return (
          <g key={i}>
            <path d={body} fill={`url(#${uid}b)`} />
            <path d={shadow} fill={`url(#${uid}s)`} />
            <path d={`M${f1(lerp(L[0], C[0], 0.55))},${f1(d.top + d.h * 0.32)} C${f1(lerp(L[0], C[0], 0.82))},${f1(d.top + d.h * 0.1)} ${f1(C[0] - 6 * flip)},${f1(C[1] + 2)} ${f1(C[0])},${f1(C[1])}`} stroke={tone(rim)} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.85" />
            {ripples &&
              d.ripple.map((u, k) => {
                const yy = lerp(d.top + d.h * 0.3, y - 6, (k + 1) / 7);
                const xa = lerp(L[0], C[0], 0.15 + u * 0.3);
                const xb = lerp(xa, C[0], 0.5);
                return <path key={k} d={`M${f1(xa)},${f1(yy)} Q${f1((xa + xb) / 2)},${f1(yy - 6)} ${f1(xb)},${f1(yy + 2)}`} stroke={tone(mixColor(lit, '#ffffff', 0.3))} strokeWidth="1.4" fill="none" opacity="0.4" />;
              })}
          </g>
        );
      })}
    </Svg>
  );
}

// ── Columns ──────────────────────────────────────────────

/**
 * One great column of rose and gold stone standing on the line `y`, `h` tall and `w` wide, lit from the
 * left: fluted shaft, a carved capital, a plinth. `broken` (0–1) snaps it off that far down; `shadow`
 * {dx, len} throws its long shadow across the sand.
 */
export function Column({ cfg }) {
  const uid = useUid('cl');
  const { x = 800, y = 700, h = 520, w = 46, stone = ROSE, lit = GOLD, dark = DUSK, broken = 0, shadow, seed = 1 } = cfg;
  const top = y - h * (1 - broken);
  const jag = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: 5 }, (_, i) => [x - w / 2 + (i / 4) * w, top + (r() - 0.3) * w * 0.6]);
  }, [x, w, top, seed]);
  const tw = w * 0.86;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1={x - w / 2} y1="0" x2={x + w / 2} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.45" stopColor={stone} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      {shadow && <path d={`M${x - w / 2},${y} L${x + w / 2},${y} L${x + w / 2 + shadow.len},${y + (shadow.dy ?? shadow.len * 0.08)} L${x - w / 2 + shadow.len * 0.92},${y + (shadow.dy ?? shadow.len * 0.08) + w * 0.4} Z`} fill="#3a2234" opacity={shadow.o ?? 0.35} />}
      <rect x={x - w * 0.78} y={y - 16} width={w * 1.56} height="18" fill={mixColor(stone, dark, 0.3)} />
      {broken > 0 ? (
        <path d={`M${x - w / 2},${y - 14} L${pts(jag)} L${x + w / 2},${y - 14} Z`} fill={`url(#${uid}g)`} />
      ) : (
        <>
          <path d={`M${x - w / 2},${y - 14} L${x - tw / 2},${top + w * 0.5} L${x + tw / 2},${top + w * 0.5} L${x + w / 2},${y - 14} Z`} fill={`url(#${uid}g)`} />
          {/* the capital: a cushion swelling from the shaft up to the slab that crowns it (touching it, so
              the slab never floats on a column seen up close) */}
          <path d={`M${x - tw / 2},${top + w * 0.56} Q${x - w * 0.5},${top + w * 0.4} ${x - w * 0.7},${top + w * 0.23} L${x + w * 0.7},${top + w * 0.23} Q${x + w * 0.5},${top + w * 0.4} ${x + tw / 2},${top + w * 0.56} Z`} fill={mixColor(stone, lit, 0.3)} />
          <rect x={x - w * 0.82} y={top} width={w * 1.64} height={w * 0.24} fill={mixColor(stone, dark, 0.15)} />
        </>
      )}
      {[-0.3, -0.1, 0.1, 0.3].map((u) => (
        <path key={u} d={`M${x + u * w},${y - 16} L${x + u * tw},${broken > 0 ? top + w * 0.4 : top + w * 0.55}`} stroke="#000" strokeOpacity="0.1" strokeWidth={Math.max(1, w * 0.05)} />
      ))}
    </Svg>
  );
}
Column.bounds = (c) => {
  const { x = 800, y = 700, h = 520, w = 46, shadow } = c;
  return [x - w * 1.2, y - h - w, x + w * 1.2 + (shadow ? Math.max(0, shadow.len) + w : 0), y + 40 + (shadow ? Math.abs(shadow.dy ?? shadow.len * 0.08) + w : 0)];
};

// ── Iram ─────────────────────────────────────────────────

/**
 * Iram seen across the sand: ranks of towering columns (`rows` [{y, h, n, w}], back to front) rising out of
 * the desert along `x0`–`x1`, stepped palaces and terraces among them, long shadows striping the sand
 * from a low sun on the left. `red` warms it all toward sunset; `haze` sinks the farther ranks into dust.
 */
export function Iram({ cfg }) {
  const uid = useUid('ir');
  const { x0 = -300, x1 = 1900, rows = [{ y: 610, h: 300, n: 30, w: 12 }, { y: 640, h: 420, n: 22, w: 18 }, { y: 672, h: 560, n: 14, w: 26 }], palaces = 5, stone = ROSE, lit = GOLD, dark = DUSK, haze = '#e8c4a4', red = 0, shadows = true, avenue, seed = 9 } = cfg;
  const warm = (c) => mixColor(c, '#d0482a', red * 0.45);
  const city = useMemo(() => {
    const r = rng(seed);
    return rows.map((row, k) => {
      const far = 1 - k / Math.max(1, rows.length - 1);
      const cols = [];
      for (let i = 0; i < row.n; i++) {
        const x = x0 + ((i + 0.5 + (r() - 0.5) * 0.5) / row.n) * (x1 - x0);
        if (avenue && Math.abs(x - avenue[0]) < avenue[1] * (1 - far * 0.5)) continue;
        cols.push({ x, h: row.h * (0.85 + r() * 0.3), w: row.w * (0.9 + r() * 0.2) });
      }
      const pal = k === Math.floor(rows.length / 2) ? Array.from({ length: palaces }, () => ({ x: x0 + r() * (x1 - x0), w: 120 + r() * 160, tiers: 3 + Math.floor(r() * 2), h: 50 + r() * 40 })) : [];
      return { ...row, far, cols, pal };
    });
  }, [rows, x0, x1, palaces, avenue, seed]);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={warm(lit)} />
          <stop offset="0.5" stopColor={warm(stone)} />
          <stop offset="1" stopColor={warm(dark)} />
        </linearGradient>
      </defs>
      {city.map((row, k) => {
        const veil = row.far * 0.55;
        const fill = (c) => mixColor(warm(c), haze, veil);
        return (
          <g key={k}>
            {shadows &&
              row.cols.map((c, i) => (
                <path key={`s${i}`} d={`M${f1(c.x)},${row.y} L${f1(c.x + c.w)},${row.y} L${f1(c.x + c.w + c.h * 1.6)},${f1(row.y + c.h * 0.06 + 8)} L${f1(c.x + c.h * 1.6)},${f1(row.y + c.h * 0.06 + 8 + c.w * 0.5)} Z`} fill="#4a2a3a" opacity={0.22 * (1 - veil)} />
              ))}
            {row.pal.map((p, i) => (
              <g key={`p${i}`}>
                {Array.from({ length: p.tiers }, (_, t) => {
                  const tw = p.w * (1 - t * 0.2);
                  const ty = row.y - p.h * (t + 1);
                  return (
                    <g key={t}>
                      <rect x={f1(p.x - tw / 2)} y={f1(ty)} width={f1(tw)} height={f1(p.h)} fill={fill(mixColor(stone, lit, t * 0.15))} />
                      {Array.from({ length: Math.round(tw / 14) }, (_, j) => (
                        <rect key={j} x={f1(p.x - tw / 2 + 6 + j * 14)} y={f1(ty + p.h * 0.25)} width="4" height={f1(p.h * 0.6)} fill={fill(dark)} opacity="0.45" />
                      ))}
                    </g>
                  );
                })}
              </g>
            ))}
            {row.cols.map((c, i) => (
              <g key={i}>
                <rect x={f1(c.x)} y={f1(row.y - c.h)} width={f1(c.w)} height={f1(c.h)} fill={fill(stone)} />
                <rect x={f1(c.x)} y={f1(row.y - c.h)} width={f1(c.w * 0.4)} height={f1(c.h)} fill={fill(lit)} opacity="0.6" />
                <rect x={f1(c.x + c.w * 0.7)} y={f1(row.y - c.h)} width={f1(c.w * 0.3)} height={f1(c.h)} fill={fill(dark)} opacity="0.55" />
                <rect x={f1(c.x - c.w * 0.3)} y={f1(row.y - c.h - c.w * 0.3)} width={f1(c.w * 1.6)} height={f1(c.w * 0.32)} fill={fill(mixColor(stone, lit, 0.3))} />
              </g>
            ))}
          </g>
        );
      })}
    </Svg>
  );
}

// ── Monuments on the heights ─────────────────────────────

/**
 * A monument raised on a hill for show (a watchtower, an obelisk or a great arch) on a mound whose foot is
 * the line `y` at `x`; `hill` [width, height] shapes the mound, `h` the monument.
 */
export function Monument({ cfg }) {
  const uid = useUid('mn');
  const { x = 800, y = 640, h = 200, kind = 'tower', hill = [260, 90], stone = ROSE, lit = GOLD, dark = DUSK, sand = '#cf8648' } = cfg;
  const [hw, hh] = hill;
  const top = y - hh;
  const w = kind === 'obelisk' ? h * 0.12 : h * 0.24;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}s`} x1={x - hw} y1="0" x2={x + hw} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mixColor(sand, '#ffe0a8', 0.3)} />
          <stop offset="0.55" stopColor={sand} />
          <stop offset="1" stopColor={mixColor(sand, '#4a2a5c', 0.55)} />
        </linearGradient>
        <linearGradient id={`${uid}m`} x1={x - w / 2} y1="0" x2={x + w / 2} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.5" stopColor={stone} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d={`M${x - hw},${y + 20} C${x - hw * 0.5},${y - hh * 0.2} ${x - hw * 0.35},${top} ${x},${top} C${x + hw * 0.35},${top} ${x + hw * 0.5},${y - hh * 0.2} ${x + hw},${y + 20} Z`} fill={`url(#${uid}s)`} />
      {kind === 'obelisk' && <path d={`M${x - w / 2},${top + 4} L${x - w * 0.36},${top - h + w} L${x},${top - h} L${x + w * 0.36},${top - h + w} L${x + w / 2},${top + 4} Z`} fill={`url(#${uid}m)`} />}
      {kind === 'arch' && (
        <path d={`M${x - w * 1.4},${top + 4} L${x - w * 1.4},${top - h} L${x + w * 1.4},${top - h} L${x + w * 1.4},${top + 4} L${x + w * 0.6},${top + 4} L${x + w * 0.6},${top - h * 0.5} Q${x},${top - h * 0.78} ${x - w * 0.6},${top - h * 0.5} L${x - w * 0.6},${top + 4} Z`} fill={`url(#${uid}m)`} />
      )}
      {kind === 'tower' && (
        <g>
          <path d={`M${x - w / 2},${top + 4} L${x - w * 0.42},${top - h} L${x + w * 0.42},${top - h} L${x + w / 2},${top + 4} Z`} fill={`url(#${uid}m)`} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={x - w * 0.42 + i * w * 0.24} y={top - h - w * 0.18} width={w * 0.13} height={w * 0.2} fill={mixColor(stone, lit, 0.2)} />
          ))}
          {[0.3, 0.55, 0.78].map((u) => (
            <rect key={u} x={x - w * 0.06} y={top - h * u} width={w * 0.12} height={h * 0.07} fill="#2a1a20" opacity="0.7" />
          ))}
        </g>
      )}
    </Svg>
  );
}
Monument.bounds = (c) => {
  const { x = 800, y = 640, h = 200, kind = 'tower', hill = [260, 90] } = c;
  const w = kind === 'arch' ? h * 0.24 * 1.5 : h * 0.24;
  return [x - Math.max(hill[0], w) - 20, y - hill[1] - h - 60, x + Math.max(hill[0], w) + 20, y + 40];
};

// ── Floors, walls, steps ─────────────────────────────────

/**
 * Polished stone (or a paved road) from its far edge `y` to the bottom: joints converging on the vanishing
 * point `vp` [x, y] and a sheen; `reflect` [x…] lays soft column reflections into a polished floor;
 * `shadows` [[x0, y0, x1, y1, opacity]…] lays soft bands of shade across it (a column's shadow on a road).
 */
export function Floor({ cfg }) {
  const uid = useUid('fl');
  const { y = 600, vp = [800, 420], x0 = -800, x1 = 2400, color = '#c8a07a', color2 = '#7a5a48', lines = 18, reflect = [], gloss = 0.35, shadows = [] } = cfg;
  const rows = Array.from({ length: 9 }, (_, i) => y + (1400 - 0) * ((i + 1) / 10) ** 2.2);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1={y} x2="0" y2={y + 700} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mixColor(color, '#ffe8c8', gloss * 0.6)} />
          <stop offset="0.4" stopColor={color} />
          <stop offset="1" stopColor={color2} />
        </linearGradient>
        <filter id={`${uid}b`} x="-5%" y="-50%" width="110%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id={`${uid}r`} x1="0" y1={y} x2="0" y2={y + 500} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff2d8" stopOpacity={gloss} />
          <stop offset="1" stopColor="#fff2d8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={x0} y={y} width={x1 - x0} height="1500" fill={`url(#${uid}f)`} />
      {Array.from({ length: lines > 0 ? lines + 1 : 0 }, (_, i) => {
        const bx = x0 + ((x1 - x0) * i) / lines;
        const t = (y - vp[1]) / (y + 1500 - vp[1]);
        return <path key={i} d={`M${f1(vp[0] + (bx - vp[0]) * t)},${y} L${f1(bx)},${y + 1500}`} stroke="#000" strokeOpacity="0.1" strokeWidth="2" />;
      })}
      {rows.map((ry, i) => (
        <path key={`r${i}`} d={`M${x0},${f1(ry)} L${x1},${f1(ry)}`} stroke="#000" strokeOpacity="0.08" strokeWidth={1 + i * 0.4} />
      ))}
      {reflect.map((rx, i) => (
        <rect key={`f${i}`} x={rx - 18} y={y} width="36" height="500" fill={`url(#${uid}r)`} />
      ))}
      {shadows.length > 0 && (
        <g filter={`url(#${uid}b)`}>
          {shadows.map(([sx0, sy0, sx1, sy1, o = 0.32], i) => (
            <rect key={`s${i}`} x={sx0} y={sy0} width={sx1 - sx0} height={sy1 - sy0} fill="#3a2234" opacity={o} />
          ))}
        </g>
      )}
    </Svg>
  );
}

/**
 * A great wall of dressed stone, `w` wide and `h` tall, centred at `x` on the line `y`. `doors` [{x, w, h,
 * lit}] are arched openings (lit ones glow warm); `gate` {w, h} cuts an open gateway (see-through) and
 * `towers` flank it, as at a city's gates.
 */
export function Facade({ cfg }) {
  const uid = useUid('fc');
  const { x = 800, y = 700, w = 1200, h = 520, stone = ROSE, lit = GOLD, dark = DUSK, doors = [], gate, towers = false } = cfg;
  const left = x - w / 2;
  const arch = (cx, dw, dh) => `M${cx - dw / 2},${y} L${cx - dw / 2},${y - dh + dw / 2} A${dw / 2},${dw / 2} 0 0 1 ${cx + dw / 2},${y - dh + dw / 2} L${cx + dw / 2},${y} Z`;
  const wall = `M${left},${y} L${left},${y - h} L${left + w},${y - h} L${left + w},${y} Z${gate ? ` ${arch(x, gate.w, gate.h)}` : ''}`;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}w`} x1="0" y1={y - h} x2="0" y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mixColor(stone, lit, 0.25)} />
          <stop offset="1" stopColor={mixColor(stone, dark, 0.35)} />
        </linearGradient>
        <radialGradient id={`${uid}d`} cx="0.5" cy="0.8" r="0.9">
          <stop offset="0" stopColor="#fff2cc" />
          <stop offset="0.5" stopColor="#f2b860" />
          <stop offset="1" stopColor="#8a4a20" />
        </radialGradient>
      </defs>
      <path d={wall} fill={`url(#${uid}w)`} fillRule="evenodd" />
      {Array.from({ length: Math.floor(h / 46) }, (_, i) => (
        <path key={i} d={`M${left},${y - i * 46} L${left + w},${y - i * 46}`} stroke="#000" strokeOpacity="0.09" strokeWidth="2" />
      ))}
      <rect x={left - 10} y={y - h - 18} width={w + 20} height="20" fill={mixColor(stone, lit, 0.35)} />
      {doors.map((d, i) => (
        <path key={i} d={arch(d.x, d.w, d.h)} fill={d.lit ? `url(#${uid}d)` : '#1e1218'} />
      ))}
      {towers &&
        [-1, 1].map((side) => {
          const tx = x + side * ((gate?.w ?? 200) / 2 + 70);
          return (
            <g key={side}>
              <rect x={tx - 70} y={y - h * 1.35} width="140" height={h * 1.35} fill={mixColor(stone, side < 0 ? lit : dark, 0.25)} />
              {[0, 1, 2, 3].map((k) => (
                <rect key={k} x={tx - 70 + k * 38} y={y - h * 1.35 - 22} width="24" height="24" fill={mixColor(stone, lit, 0.15)} />
              ))}
              <rect x={tx - 8} y={y - h * 1.1} width="16" height="40" fill="#1e1218" opacity="0.8" />
            </g>
          );
        })}
    </Svg>
  );
}
Facade.bounds = (c) => {
  const { x = 800, y = 700, w = 1200, h = 520, towers } = c;
  return [x - w / 2 - 40, y - h * (towers ? 1.4 : 1) - 60, x + w / 2 + 40, y + 30];
};

/**
 * Broad steps rising from the line `y` to a dais, `w` wide at the bottom: `steps` of `rise` each, narrowing
 * as they climb. `thrones` sets that many carved stone thrones on the dais (seen from the front).
 */
export function Platform({ cfg }) {
  const uid = useUid('pf');
  const { x = 800, y = 760, w = 700, steps = 6, rise = 26, taper = 0.05, stone = ROSE, lit = GOLD, dark = DUSK, thrones = 0, dais = 70 } = cfg;
  const top = y - steps * rise;
  const topW = w * (1 - steps * taper);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.5" stopColor={stone} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <rect x={x - topW / 2} y={top - dais} width={topW} height={dais} fill={mixColor(stone, lit, 0.2)} />
      {Array.from({ length: steps }, (_, i) => {
        const sw = w * (1 - i * taper);
        const sy = y - i * rise;
        return (
          <g key={i}>
            <rect x={x - sw / 2} y={sy - rise} width={sw} height={rise} fill={mixColor(stone, dark, 0.28)} />
            <rect x={x - sw / 2} y={sy - rise} width={sw} height={rise * 0.3} fill={mixColor(stone, lit, 0.45)} />
          </g>
        );
      })}
      {Array.from({ length: thrones }, (_, i) => {
        const tx = x - topW / 2 + ((i + 0.5) / thrones) * topW;
        const tw = Math.min(110, (topW / thrones) * 0.6);
        return (
          <g key={`t${i}`}>
            <path d={`M${tx - tw / 2},${top - dais} L${tx - tw / 2},${top - dais - tw * 1.9} Q${tx},${top - dais - tw * 2.4} ${tx + tw / 2},${top - dais - tw * 1.9} L${tx + tw / 2},${top - dais} Z`} fill={`url(#${uid}t)`} />
            <rect x={tx - tw * 0.7} y={top - dais - tw * 0.75} width={tw * 1.4} height={tw * 0.2} fill={mixColor(stone, lit, 0.3)} />
            <path d={`M${tx - tw * 0.3},${top - dais - tw * 1.6} L${tx + tw * 0.3},${top - dais - tw * 1.6}`} stroke="#8a1e1e" strokeWidth={tw * 0.12} />
          </g>
        );
      })}
    </Svg>
  );
}
Platform.bounds = (c) => {
  const { x = 800, y = 760, w = 700, steps = 6, rise = 26, dais = 70, thrones = 0 } = c;
  return [x - w / 2 - 30, y - steps * rise - dais - (thrones ? 260 : 0) - 30, x + w / 2 + 30, y + 30];
};

/** A bronze brazier on three legs at (`x`, `y`), embers glowing in the bowl (its flames are a light of their own). */
export function Brazier({ cfg }) {
  const uid = useUid('bz');
  const { x = 800, y = 700, s = 1, embers = true } = cfg;
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}e`} cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#ffd28a" />
          <stop offset="1" stopColor="#c2401a" />
        </radialGradient>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {[-1, 0, 1].map((k) => (
          <path key={k} d={`M${k * 4},-60 L${k * 22},0`} stroke="#5a3a1e" strokeWidth="5" strokeLinecap="round" />
        ))}
        <path d="M-34,-74 C-30,-50 30,-50 34,-74 Z" fill="#9a6a34" />
        <ellipse cx="0" cy="-74" rx="34" ry="8" fill={embers ? `url(#${uid}e)` : '#3a2a20'} />
      </g>
    </Svg>
  );
}
Brazier.bounds = (c) => {
  const { x = 800, y = 700, s = 1 } = c;
  return [x - 50 * s, y - 100 * s, x + 50 * s, y + 10];
};

/**
 * A sunken pool with a stone rim, its front edge centred at (`x`, `y`), `w` wide and `d` deep into the
 * picture. `water` (0–1) is how full it is; `dry` (0–1) cracks the mud left behind.
 */
export function Pool({ cfg }) {
  const uid = useUid('pl');
  const { x = 800, y = 760, w = 420, d = 120, water = 1, dry = 0, rim = '#d8b48c' } = cfg;
  const back = w * 0.78;
  const shape = `M${x - w / 2},${y} L${x - back / 2},${y - d} L${x + back / 2},${y - d} L${x + w / 2},${y} Z`;
  const cracks = useMemo(() => {
    const r = rng(17);
    return Array.from({ length: 14 }, () => {
      const cx = x + (r() - 0.5) * w * 0.7;
      const cy = y - d * (0.15 + r() * 0.7);
      return `M${f1(cx)},${f1(cy)} l${f1((r() - 0.5) * 40)},${f1((r() - 0.5) * 10)} l${f1((r() - 0.5) * 30)},${f1((r() - 0.5) * 8)}`;
    });
  }, [x, y, w, d]);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}w`} x1="0" y1={y - d} x2="0" y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#bfe0e4" />
          <stop offset="1" stopColor="#3e7a84" />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <path d={shape} />
        </clipPath>
      </defs>
      <path d={shape} fill={mixColor('#8a6a48', '#a88a5a', dry)} />
      <g clipPath={`url(#${uid}c)`}>
        {water > 0 && <rect x={x - w / 2} y={y - d * water} width={w} height={d * water} fill={`url(#${uid}w)`} />}
        {water > 0 && [0.3, 0.55, 0.8].map((u) => <path key={u} d={`M${x - w * 0.3},${y - d * water * u} l${w * 0.25},0`} stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />)}
        {dry > 0 && cracks.map((c, i) => <path key={i} d={c} stroke="#3a2618" strokeWidth="2" opacity={dry} fill="none" />)}
      </g>
      <path d={shape} fill="none" stroke={rim} strokeWidth="10" strokeLinejoin="round" />
    </Svg>
  );
}
Pool.bounds = (c) => {
  const { x = 800, y = 760, w = 420, d = 120 } = c;
  return [x - w / 2 - 20, y - d - 20, x + w / 2 + 20, y + 20];
};

// ── Palms, gardens, the riverbed ─────────────────────────

/**
 * Date palms: `items` [{x, y, h, lean}] (or `count` along `x0`–`x1` on the line `y`). `wither` (0–1) turns
 * their fronds from green to straw to brown, drooping and falling, as the rain stops coming.
 */
export function Palms({ cfg }) {
  const { items, count = 5, x0 = 300, x1 = 1300, y = 700, h = 300, wither = 0, seed = 21 } = cfg;
  const trees = useMemo(() => {
    const r = rng(seed);
    const list = items ?? Array.from({ length: count }, (_, i) => ({ x: x0 + ((i + 0.3 + r() * 0.4) / count) * (x1 - x0), y: y + (r() - 0.5) * 20, h: h * (0.8 + r() * 0.4), lean: (r() - 0.5) * 0.3 }));
    return list.map((t) => ({ ...t, fronds: Array.from({ length: 11 }, (_, k) => ({ a: -170 + (k / 10) * 160 + (r() - 0.5) * 10, len: (t.h ?? h) * (0.36 + r() * 0.12), fall: r() })) }));
  }, [items, count, x0, x1, y, h, seed]);
  const leaf = mixColor(mixColor('#4e7a3a', '#c8b04a', Math.min(1, wither * 1.6)), '#7a5432', Math.max(0, wither - 0.5) * 2);
  return (
    <Svg>
      {trees.map((t, i) => {
        const th = t.h ?? h;
        const top = [t.x + (t.lean ?? 0) * th, t.y - th];
        return (
          <g key={i}>
            <path d={`M${t.x - th * 0.03},${t.y} Q${t.x + (t.lean ?? 0) * th * 0.3},${t.y - th * 0.5} ${top[0] - th * 0.018},${top[1]} L${top[0] + th * 0.018},${top[1]} Q${t.x + (t.lean ?? 0) * th * 0.3 + th * 0.04},${t.y - th * 0.5} ${t.x + th * 0.03},${t.y} Z`} fill="#7a5a3a" />
            {Array.from({ length: 9 }, (_, k) => (
              <path key={k} d={`M${f1(lerp(t.x, top[0], (k + 1) / 10) - th * 0.025)},${f1(lerp(t.y, top[1], (k + 1) / 10))} l${f1(th * 0.05)},${f1(-th * 0.008)}`} stroke="#4a3220" strokeWidth="2" opacity="0.6" />
            ))}
            {t.fronds.map((fr, k) => {
              if (wither > 0.6 && fr.fall < (wither - 0.6) * 2) return null;
              const a = ((fr.a + wither * 40 * Math.sign(fr.a + 90)) * Math.PI) / 180;
              const ex = top[0] + Math.cos(a) * fr.len;
              const ey = top[1] + Math.sin(a) * fr.len + fr.len * (0.25 + wither * 0.5);
              const mx = top[0] + Math.cos(a) * fr.len * 0.55;
              const my = top[1] + Math.sin(a) * fr.len * 0.55 - fr.len * 0.08;
              return <path key={k} d={`M${f1(top[0])},${f1(top[1])} Q${f1(mx)},${f1(my)} ${f1(ex)},${f1(ey)}`} stroke={leaf} strokeWidth={th * 0.03} strokeLinecap="round" fill="none" />;
            })}
            {wither > 0.5 && t.fronds.slice(0, 3).map((fr, k) => <path key={`g${k}`} d={`M${f1(t.x - 60 + k * 50)},${f1(t.y + 6)} q30,-8 70,2`} stroke="#7a5432" strokeWidth="5" strokeLinecap="round" fill="none" opacity={(wither - 0.5) * 2} />)}
          </g>
        );
      })}
    </Svg>
  );
}

/** Stepped garden terraces at (`x`, `y`): `tiers` of `rise`, rows of plants that `wither` (0–1) from green to dust. */
export function Terraces({ cfg }) {
  const { x = 800, y = 760, w = 900, tiers = 4, rise = 50, stone = '#c89a72', wither = 0, seed = 5 } = cfg;
  const plant = mixColor(mixColor('#4e7a3a', '#c0a848', Math.min(1, wither * 1.6)), '#8a6a44', Math.max(0, wither - 0.5) * 2);
  const rows = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: tiers }, (_, i) => Array.from({ length: Math.round((w * (1 - i * 0.12)) / 40) }, () => 0.7 + r() * 0.6));
  }, [tiers, w, seed]);
  return (
    <Svg>
      {rows.map((row, i) => {
        const tw = w * (1 - i * 0.12);
        const ty = y - i * rise;
        return (
          <g key={i}>
            <rect x={x - tw / 2} y={ty - rise} width={tw} height={rise} fill={mixColor(stone, '#5a3a3a', 0.25)} />
            <rect x={x - tw / 2} y={ty - rise} width={tw} height={rise * 0.25} fill={mixColor(stone, '#ffe8c8', 0.3)} />
            {row.map((s, k) => (
              <ellipse key={k} cx={x - tw / 2 + 20 + k * 40} cy={ty - rise - 6 * s * (1 - wither * 0.6)} rx={14 * s * (1 - wither * 0.4)} ry={11 * s * (1 - wither * 0.6)} fill={plant} />
            ))}
          </g>
        );
      })}
    </Svg>
  );
}
Terraces.bounds = (c) => {
  const { x = 800, y = 760, w = 900, tiers = 4, rise = 50 } = c;
  return [x - w / 2 - 20, y - tiers * rise - 50, x + w / 2 + 20, y + 20];
};

/** A dry riverbed winding through `points` (far to near), `w0` to `w1` wide: cracked mud, stones, dead reeds. */
export function Riverbed({ cfg }) {
  const { points = [[800, 600], [700, 700], [820, 820], [700, 1000]], w0 = 40, w1 = 300, mud = '#b08a5e', seed = 9 } = cfg;
  const { ribbon, cracks, reeds } = useMemo(() => {
    const r = rng(seed);
    const segs = points.map((p, i) => ({ p, w: lerp(w0, w1, i / (points.length - 1)) }));
    const left = segs.map(({ p, w }) => [p[0] - w / 2, p[1]]);
    const right = segs.map(({ p, w }) => [p[0] + w / 2, p[1]]).reverse();
    const cr = Array.from({ length: 40 }, () => {
      const k = r() * (points.length - 1);
      const i = Math.floor(k);
      const a = points[i];
      const b = points[Math.min(points.length - 1, i + 1)];
      const f = k - i;
      const w = lerp(w0, w1, k / (points.length - 1));
      const cx = lerp(a[0], b[0], f) + (r() - 0.5) * w * 0.8;
      const cy = lerp(a[1], b[1], f);
      return `M${f1(cx)},${f1(cy)} l${f1((r() - 0.5) * w * 0.3)},${f1((r() - 0.5) * 8)} l${f1((r() - 0.5) * w * 0.2)},${f1((r() - 0.5) * 6)}`;
    });
    const rd = Array.from({ length: 30 }, () => {
      const p = points[Math.floor(r() * points.length)];
      return { x: p[0] + (r() < 0.5 ? -1 : 1) * (lerp(w0, w1, r()) / 2 + 10 + r() * 30), y: p[1] + (r() - 0.5) * 40, h: 20 + r() * 30 };
    });
    return { ribbon: `M${pts(left)} L${pts(right)} Z`, cracks: cr, reeds: rd };
  }, [points, w0, w1, seed]);
  return (
    <Svg>
      <path d={ribbon} fill={mud} />
      {cracks.map((c, i) => (
        <path key={i} d={c} stroke="#4a3020" strokeWidth="2" fill="none" opacity="0.7" />
      ))}
      {reeds.map((rd, i) => (
        <path key={`r${i}`} d={`M${f1(rd.x)},${f1(rd.y)} q4,${f1(-rd.h * 0.5)} ${f1(10 + (i % 3) * 4)},${f1(-rd.h)}`} stroke="#9a7a4a" strokeWidth="2" fill="none" />
      ))}
    </Svg>
  );
}

// ── Cloud, storm, ruin ───────────────────────────────────

/**
 * A vast storm cloud filling the sky's width along `x0`–`x1`: billows of charcoal, slate blue and bruised
 * violet piled in rows from a flat dark underside at `y` up `h`, the higher rows behind the lower so each
 * shows only its top, lit along its upper edge (`edge`); their outlines are torn by the wind rather than
 * drawn as ellipses.
 */
export function Cloudbank({ cfg }) {
  const uid = useUid('cb');
  const { y = 420, h = 360, x0 = -800, x1 = 2400, colors = ['#2a2a34', '#3e4a5e', '#5a4a66'], edge = '#c8b8b0', seed = 13 } = cfg;
  const rows = 6;
  const billows = useMemo(() => {
    const r = rng(seed);
    const out = [];
    // the top row first: each lower row is nearer and overlaps the one above it
    for (let row = rows - 1; row >= 0; row--) {
      const lift = row / (rows - 1);
      const n = 16 + Math.round(r() * 4);
      for (let i = 0; i < n; i++) {
        const rx = (110 + r() * 120) * (1.15 - lift * 0.35);
        out.push({ x: x0 + ((i + r() * 0.9) / n) * (x1 - x0), y: y - lift * h * 0.86 - r() * 34, rx, ry: rx * (0.42 + r() * 0.18), row, tone: Math.min(colors.length - 1, Math.floor(lift * colors.length)) });
      }
    }
    return out;
    // the colours only pick a tone per billow
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, h, x0, x1, seed, colors.length]);
  return (
    <Svg>
      <defs>
        {colors.map((c, k) => (
          <linearGradient key={k} id={`${uid}g${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixColor(c, edge, 0.42)} />
            <stop offset="0.3" stopColor={mixColor(c, edge, 0.12)} />
            <stop offset="0.75" stopColor={c} />
            <stop offset="1" stopColor={mixColor(c, '#000000', 0.22)} />
          </linearGradient>
        ))}
        {/* the wind tears every outline: the billows are read through a slow turbulence */}
        <filter id={`${uid}t`} x="-4%" y="-25%" width="108%" height="150%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="3" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="54" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${uid}b`} x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <g filter={`url(#${uid}t)`}>
        {/* the flat, dark underside the whole mass sits on */}
        <rect x={x0} y={y - 40} width={x1 - x0} height="150" fill={colors[0]} filter={`url(#${uid}b)`} />
        {billows.map((b, i) => (
          <g key={i}>
            {/* light caught along the top of each billow, softly beyond its edge */}
            <ellipse cx={b.x} cy={b.y - b.ry * 0.18} rx={b.rx * 1.02} ry={b.ry * 0.96} fill={edge} opacity={0.16 + (b.row / rows) * 0.14} filter={`url(#${uid}b)`} />
            <ellipse cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={`url(#${uid}g${b.tone})`} opacity="0.95" />
          </g>
        ))}
      </g>
    </Svg>
  );
}

/** A towering wall of wind-driven sand standing on the line `y`, `h` high along `x0`–`x1`, streaked by the wind. */
export function Sandwall({ cfg }) {
  const uid = useUid('sw');
  const { y = 700, h = 700, x0 = -800, x1 = 2400, color = '#b89a78', shade = '#6a5a52', seed = 31 } = cfg;
  const puffs = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: 40 }, () => ({ x: x0 + r() * (x1 - x0), y: y - r() * h, r: 120 + r() * 200 }));
  }, [y, h, x0, x1, seed]);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1={y - h} x2="0" y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity="0.2" />
          <stop offset="0.4" stopColor={color} stopOpacity="0.85" />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
        <filter id={`${uid}b`}>
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <g filter={`url(#${uid}b)`}>
        {puffs.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={i % 3 ? color : shade} opacity="0.55" />
        ))}
      </g>
      <rect x={x0} y={y - h * 0.55} width={x1 - x0} height={h * 0.55 + 400} fill={`url(#${uid}g)`} />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${x0},${y - (i / 16) * h} C${x0 + 800},${y - (i / 16) * h - 30} ${x1 - 800},${y - (i / 16) * h + 30} ${x1},${y - (i / 16) * h}`} stroke="#e8d8c0" strokeOpacity="0.12" strokeWidth={4 + (i % 3) * 3} fill="none" />
      ))}
    </Svg>
  );
}

/** Fallen palm trunks, split and hollow, bleached white: `items` [{x, y, len, angle, r}]. */
export function Trunks({ cfg }) {
  const { items = [{ x: 700, y: 760, len: 420, angle: -8, r: 34 }] } = cfg;
  return (
    <Svg>
      {items.map((t, i) => {
        const rr = t.r ?? 34;
        return (
          <g key={i} transform={`translate(${t.x} ${t.y}) rotate(${t.angle ?? 0})`}>
            <ellipse cx={t.len * 0.5} cy={rr * 0.9} rx={t.len * 0.55} ry={rr * 0.35} fill="#7a5a48" opacity="0.25" />
            <rect x="0" y={-rr} width={t.len} height={rr * 2} rx={rr * 0.4} fill="#ebe2d2" />
            <rect x="0" y={rr * 0.2} width={t.len} height={rr * 0.8} rx={rr * 0.3} fill="#b8a890" opacity="0.6" />
            {Array.from({ length: Math.floor(t.len / 26) }, (_, k) => (
              <path key={k} d={`M${18 + k * 26},${-rr} q-6,${rr} 0,${rr * 2}`} stroke="#a89880" strokeWidth="2" fill="none" opacity="0.7" />
            ))}
            <path d={`M${t.len * 0.15},${-rr * 0.1} L${t.len * 0.8},${rr * 0.05}`} stroke="#3a2a22" strokeWidth={rr * 0.16} strokeLinecap="round" opacity="0.7" />
            <ellipse cx={t.len} cy="0" rx={rr * 0.42} ry={rr} fill="#d8ccb8" />
            <ellipse cx={t.len} cy="0" rx={rr * 0.3} ry={rr * 0.74} fill="#2a1e1a" />
          </g>
        );
      })}
    </Svg>
  );
}

/**
 * Cliffs of red and grey rock rising from the line `y` along `x0`–`x1`, `h` high, with homes carved straight
 * into the face: `homes` [{x, y, w, h}], each a facade crowned with stepped battlements and a dark door.
 */
export function Cliffs({ cfg }) {
  const uid = useUid('cf');
  const { y = 700, h = 460, x0 = -200, x1 = 1800, stone = '#b0603e', grey = '#8a8478', homes = [], seed = 41 } = cfg;
  const edge = useMemo(() => {
    const r = rng(seed);
    const top = [];
    for (let x = x0; x <= x1; x += 40) top.push([x, y - h + (r() - 0.5) * 70 + Math.sin(x / 210) * 40]);
    return top;
  }, [y, h, x0, x1, seed]);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}r`} x1="0" y1={y - h} x2="0" y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mixColor(stone, '#f0c8a0', 0.25)} />
          <stop offset="0.6" stopColor={stone} />
          <stop offset="1" stopColor={mixColor(stone, grey, 0.5)} />
        </linearGradient>
      </defs>
      <path d={`M${x0},${y + 30} L${pts(edge)} L${x1},${y + 30} Z`} fill={`url(#${uid}r)`} />
      {edge.filter((_, i) => i % 2).map(([ex, ey], i) => (
        <path key={i} d={`M${ex},${ey + 20} q${((i % 3) - 1) * 6},${h * 0.4} ${(i % 2 ? 8 : -8)},${h * 0.8}`} stroke="#5a2a1a" strokeOpacity="0.25" strokeWidth="3" fill="none" />
      ))}
      {homes.map((m, i) => (
        <g key={`h${i}`}>
          <rect x={m.x - m.w / 2} y={m.y - m.h} width={m.w} height={m.h} fill={mixColor(stone, '#f0c8a0', 0.18)} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={m.x - m.w * (0.36 - k * 0.12)} y={m.y - m.h - (k + 1) * m.w * 0.07} width={m.w * (0.72 - k * 0.24)} height={m.w * 0.07} fill={mixColor(stone, '#f0c8a0', 0.25)} />
          ))}
          <rect x={m.x - m.w * 0.16} y={m.y - m.h * 0.55} width={m.w * 0.32} height={m.h * 0.55} fill="#2a1612" />
          <rect x={m.x - m.w / 2} y={m.y - m.h} width={m.w * 0.08} height={m.h} fill="#5a2a1a" opacity="0.35" />
        </g>
      ))}
    </Svg>
  );
}

// ── The builders ─────────────────────────────────────────

/**
 * A monument half built: a stepped tower `stage` (0–1) of its height `h`, rising at `x` on the line `y`, a
 * long earthen ramp climbing to its working top, and great blocks waiting on the ground.
 */
export function Works({ cfg }) {
  const uid = useUid('wk');
  const { x = 1000, y = 720, w = 520, h = 520, stage = 0.6, stone = ROSE, lit = GOLD, dark = DUSK, ramp = true } = cfg;
  const tiers = 6;
  const built = Math.max(1, Math.round(tiers * stage));
  const top = y - (h / tiers) * built;
  return (
    <Svg>
      {Array.from({ length: built }, (_, i) => {
        const tw = w * (1 - i * 0.12);
        const ty = y - (h / tiers) * (i + 1);
        return (
          <g key={i}>
            <rect x={x - tw / 2} y={ty} width={tw} height={h / tiers} fill={mixColor(stone, dark, 0.15 + (i % 2) * 0.1)} />
            <rect x={x - tw / 2} y={ty} width={tw * 0.35} height={h / tiers} fill={lit} opacity="0.35" />
            {Array.from({ length: Math.floor(tw / 60) }, (_, k) => (
              <path key={k} d={`M${x - tw / 2 + 30 + k * 60 + (i % 2) * 30},${ty} l0,${h / tiers}`} stroke="#000" strokeOpacity="0.12" strokeWidth="2" />
            ))}
          </g>
        );
      })}
      {ramp && (
        <g>
          <defs>
            <linearGradient id={`${uid}r`} x1="0" y1={top} x2="0" y2={y} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#d2a470" />
              <stop offset="1" stopColor="#9a7048" />
            </linearGradient>
          </defs>
          <path d={`M${x - w * 1.6},${y} L${x - w * 0.42},${top} L${x - w * 0.3},${top} L${x - w * 0.3},${y} Z`} fill={`url(#${uid}r)`} />
          {/* the packed courses of earth the ramp was raised in, and its lit top edge */}
          {Array.from({ length: 7 }, (_, i) => {
            const yy = lerp(y, top, (i + 1) / 8);
            const xa = lerp(x - w * 1.6, x - w * 0.42, (i + 1) / 8);
            return <path key={i} d={`M${f1(xa)},${f1(yy)} L${f1(x - w * 0.3)},${f1(yy)}`} stroke="#7a5434" strokeWidth="2.5" opacity="0.35" />;
          })}
          <path d={`M${x - w * 1.6},${y} L${x - w * 0.42},${top} L${x - w * 0.3},${top}`} stroke="#ecc28c" strokeWidth="5" fill="none" strokeLinejoin="round" />
          <path d={`M${x - w * 0.3},${top} L${x - w * 0.3},${y}`} stroke="#6a4a30" strokeWidth="6" opacity="0.5" />
        </g>
      )}
      {[[x - w * 1.9, y], [x + w * 0.75, y + 10], [x + w * 0.95, y - 4]].map(([bx, by], i) => (
        <g key={`b${i}`}>
          <rect x={bx} y={by - 60} width="110" height="60" fill={mixColor(stone, dark, 0.2)} />
          <rect x={bx} y={by - 60} width="40" height="60" fill={lit} opacity="0.35" />
        </g>
      ))}
    </Svg>
  );
}
Works.bounds = (c) => {
  const { x = 1000, y = 720, w = 520, h = 520 } = c;
  return [x - w * 2, y - h - 40, x + w * 1.2, y + 40];
};

/** One great block of dressed stone at (`x`, `y`) (its base), ropes running out to `ropes` [[dx, dy]…]. */
export function Block({ cfg }) {
  const { x = 800, y = 700, w = 140, h = 80, stone = ROSE, lit = GOLD, dark = DUSK, ropes = [] } = cfg;
  return (
    <Svg>
      {ropes.map(([dx, dy], i) => (
        <path key={i} d={`M${x + w / 2},${y - h * 0.5} Q${x + w / 2 + dx * 0.5},${y - h * 0.5 + dy * 0.5 + 10} ${x + w / 2 + dx},${y - h * 0.5 + dy}`} stroke="#4a3018" strokeWidth={Math.max(3, h * 0.05)} strokeLinecap="round" fill="none" />
      ))}
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill={mixColor(stone, dark, 0.2)} />
      <rect x={x - w / 2} y={y - h} width={w * 0.3} height={h} fill={lit} opacity="0.4" />
      <path d={`M${x - w / 2},${y - h} l${w * 0.12},${-h * 0.18} l${w},0 l${-w * 0.12},${h * 0.18} Z`} fill={mixColor(stone, lit, 0.4)} />
    </Svg>
  );
}
Block.bounds = (c) => {
  const { x = 800, y = 700, w = 140, h = 80, ropes = [] } = c;
  const xs = ropes.map(([dx]) => x + w / 2 + dx);
  const ys = ropes.map(([, dy]) => y - h * 0.5 + dy);
  return [Math.min(x - w / 2, ...xs) - 20, Math.min(y - h * 1.3, ...ys) - 20, Math.max(x + w / 2, ...xs) + 20, Math.max(y, ...ys) + 30];
};
