// Rooms of the story, each its own place: walls of plaster, mudbrick, glazed tile, granite, cedar or marble,
// with friezes, windows and doorways onto their own views, and pillars of each land's style.
import { useMemo } from 'react';
import { Svg } from '../components/stageKit.jsx';
import { mixColor, rng } from '../lib/geo.js';

const INK = '#2a2420';

const MATERIAL = {
  plaster: { base: '#d8c4a0', dark: '#a88c68', line: null },
  mudbrick: { base: '#a8805a', dark: '#7a5838', line: '#5a3e26', brick: [44, 18] },
  glazed: { base: '#b07850', dark: '#7a5034', line: '#4a3020', brick: [36, 16] },
  granite: { base: '#3a3438', dark: '#1e1a1e', line: '#121014', block: [180, 90], speck: '#6a6068' },
  cedar: { base: '#7a4e2e', dark: '#4a2e1a', line: '#2e1a0e', plank: 46 },
  marble: { base: '#e8e4dc', dark: '#b8b2a8', line: '#a8a29a', block: [220, 120], vein: '#a8a0b0' },
  stone: { base: '#b8a080', dark: '#7a6448', line: '#5a4a38', block: [120, 60] },
};

function Frieze({ x0, x1, y, h, style, colors }) {
  const [c1, c2, c3] = colors;
  const n = Math.max(1, Math.floor((x1 - x0) / (h * 1.1)));
  const step = (x1 - x0) / n;
  const items = Array.from({ length: n }, (_, i) => x0 + step * (i + 0.5));
  return (
    <g>
      <rect x={x0} y={y} width={x1 - x0} height={h} fill={c1} />
      <rect x={x0} y={y} width={x1 - x0} height={h * 0.08} fill={c3} />
      <rect x={x0} y={y + h * 0.92} width={x1 - x0} height={h * 0.08} fill={c3} />
      {style === 'lotus' &&
        items.map((cx, i) => (
          <g key={i}>
            <path d={`M${cx},${y + h * 0.82} C${cx - h * 0.3},${y + h * 0.6} ${cx - h * 0.28},${y + h * 0.3} ${cx},${y + h * 0.16} C${cx + h * 0.28},${y + h * 0.3} ${cx + h * 0.3},${y + h * 0.6} ${cx},${y + h * 0.82} Z`} fill={i % 2 ? c2 : c3} />
            <line x1={cx + step / 2} y1={y + h * 0.2} x2={cx + step / 2} y2={y + h * 0.8} stroke={c3} strokeWidth={h * 0.05} />
          </g>
        ))}
      {style === 'rosette' &&
        items.map((cx, i) => (
          <g key={i}>
            {Array.from({ length: 8 }, (_, k) => {
              const a = (k / 8) * Math.PI * 2;
              return <ellipse key={k} cx={cx + Math.cos(a) * h * 0.18} cy={y + h / 2 + Math.sin(a) * h * 0.18} rx={h * 0.1} ry={h * 0.06} transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * h * 0.18} ${y + h / 2 + Math.sin(a) * h * 0.18})`} fill={c2} />;
            })}
            <circle cx={cx} cy={y + h / 2} r={h * 0.09} fill={c3} />
          </g>
        ))}
      {style === 'zigzag' && <path d={items.map((cx, i) => `${i ? 'L' : 'M'}${cx - step / 2},${y + h * 0.75} L${cx},${y + h * 0.25}`).join(' ') + ` L${x1},${y + h * 0.75}`} stroke={c2} strokeWidth={h * 0.14} fill="none" strokeLinejoin="miter" />}
      {style === 'vine' && (
        <g>
          <path d={items.map((cx, i) => `${i ? 'S' : 'M'}${cx - step / 4},${y + h * (i % 2 ? 0.3 : 0.7)} ${cx},${y + h / 2}`).join(' ')} stroke={c2} strokeWidth={h * 0.06} fill="none" />
          {items.map((cx, i) => <ellipse key={i} cx={cx + step * 0.2} cy={y + h * (i % 2 ? 0.32 : 0.68)} rx={h * 0.13} ry={h * 0.07} fill={c2} />)}
        </g>
      )}
      {style === 'lattice' &&
        items.map((cx, i) => <path key={i} d={`M${cx - step / 2},${y + h * 0.15} L${cx + step / 2},${y + h * 0.85} M${cx - step / 2},${y + h * 0.85} L${cx + step / 2},${y + h * 0.15}`} stroke={c2} strokeWidth={h * 0.05} />)}
    </g>
  );
}

function View({ x, y, w, h, view, arch, uid }) {
  // what is seen through an opening: sky and its land, at the opening's own scale
  const top = y - h;
  const clip = arch ? `M${x - w / 2},${y} L${x - w / 2},${top + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w / 2},${top + w / 2} L${x + w / 2},${y} Z` : `M${x - w / 2},${y} L${x - w / 2},${top} L${x + w / 2},${top} L${x + w / 2},${y} Z`;
  const sky = { day: ['#bcd0dc', '#f0e4c8'], dusk: ['#5a4a6a', '#e8a070'], night: ['#0e1426', '#2a3048'], dawn: ['#8a90b0', '#f0c8a0'], dark: ['#140e0a', '#2a1e14'] }[view.sky || 'day'];
  const land = view.land || 'none';
  const hor = y - h * (view.horizon ?? 0.32);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}`}>
          <path d={clip} />
        </clipPath>
        <linearGradient id={`${uid}s`} x1="0" y1={top} x2="0" y2={hor} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <rect x={x - w / 2} y={top} width={w} height={h} fill={`url(#${uid}s)`} />
        {land === 'garden' && (
          <g>
            <rect x={x - w / 2} y={hor} width={w} height={y - hor} fill="#6a8a4a" />
            <rect x={x - w * 0.4} y={hor + (y - hor) * 0.35} width={w * 0.8} height={(y - hor) * 0.25} fill="#7aa0b0" />
            {[-0.3, 0.05, 0.32].map((k, i) => (
              <g key={i}>
                <line x1={x + k * w} y1={hor + 4} x2={x + k * w + 3} y2={hor - h * 0.3} stroke="#5a3e28" strokeWidth={Math.max(2, w * 0.015)} />
                <ellipse cx={x + k * w + 3} cy={hor - h * 0.32} rx={w * 0.09} ry={h * 0.05} fill="#4a7a3a" />
              </g>
            ))}
          </g>
        )}
        {land === 'river' && (
          <g>
            <rect x={x - w / 2} y={hor} width={w} height={y - hor} fill="#8a9a5a" />
            <rect x={x - w / 2} y={hor + (y - hor) * 0.15} width={w} height={(y - hor) * 0.22} fill="#8ab0c0" />
            <path d={`M${x - w / 2},${hor} L${x - w * 0.2},${hor - h * 0.06} L${x + w * 0.1},${hor - h * 0.03} L${x + w / 2},${hor - h * 0.07} L${x + w / 2},${hor} Z`} fill="#c0a888" />
          </g>
        )}
        {land === 'granaries' && (
          <g>
            <rect x={x - w / 2} y={hor} width={w} height={y - hor} fill="#c8b088" />
            {[-0.32, -0.1, 0.12, 0.34].map((k, i) => (
              <path key={i} d={`M${x + k * w - w * 0.08},${hor + 2} L${x + k * w - w * 0.08},${hor - h * 0.12} Q${x + k * w},${hor - h * 0.26} ${x + k * w + w * 0.08},${hor - h * 0.12} L${x + k * w + w * 0.08},${hor + 2} Z`} fill="#e0cca8" stroke={INK} strokeWidth="1" />
            ))}
          </g>
        )}
        {land === 'hills' && <path d={`M${x - w / 2},${y} L${x - w / 2},${hor} Q${x - w * 0.2},${hor - h * 0.12} ${x},${hor - h * 0.04} T${x + w / 2},${hor - h * 0.08} L${x + w / 2},${y} Z`} fill="#7a8064" />}
        {land === 'city' && (
          <g>
            <rect x={x - w / 2} y={hor} width={w} height={y - hor} fill="#b0a080" />
            {Array.from({ length: 7 }, (_, i) => <rect key={i} x={x - w / 2 + (i / 7) * w + 2} y={hor - h * (0.06 + (i % 3) * 0.04)} width={w / 8} height={h * (0.06 + (i % 3) * 0.04) + 2} fill="#d8c8a8" stroke={INK} strokeWidth="0.8" />)}
          </g>
        )}
        {view.moon && <circle cx={x + w * 0.2} cy={top + h * 0.3} r={Math.max(4, w * 0.06)} fill="#f0f0e8" opacity="0.9" />}
      </g>
      <path d={clip} fill="none" stroke={INK} strokeWidth={Math.max(1.5, w * 0.02)} />
    </g>
  );
}

/**
 * The back wall of a room: `material` plaster | mudbrick | glazed | granite | cedar | marble | stone (with
 * `base`/`dark` colour overrides), standing on the floor line `y` and rising `h`, across `x0`–`x1`. A `frieze`
 * {at (0–1 up the wall), h, style lotus | rosette | zigzag | vine | lattice, colors [band, motif, edge]} and a
 * `dado` colour band at the foot. `openings` [{x, w, h, kind door | window | arch, lift (sill height), view:
 * {sky day | dusk | night | dawn | dark, land garden | river | granaries | hills | city | none, moon}, lit}]
 * open onto their own views; `beams` lays ceiling beams across the top; `niches` [{x, w, h, lift}] are lamp niches.
 */
export function Wall({ cfg }) {
  const { x0 = -800, x1 = 2400, y = 712, h = 820, material = 'plaster', frieze, dado, openings = [], beams = false, niches = [], seed = 3, light = 1 } = cfg;
  const m = { ...MATERIAL[material], ...(cfg.base ? { base: cfg.base } : {}), ...(cfg.dark ? { dark: cfg.dark } : {}) };
  const top = y - h;
  const uid = `wl${seed}${material}`;
  const tex = useMemo(() => {
    const r = rng(seed);
    const out = [];
    if (m.brick) {
      const [bw, bh] = m.brick;
      for (let row = 0, yy = y - bh; yy > top; row++, yy -= bh) {
        out.push(<line key={`h${row}`} x1={x0} y1={yy} x2={x1} y2={yy} stroke={m.line} strokeWidth="1.2" opacity="0.5" />);
        for (let xx = x0 + (row % 2 ? bw / 2 : 0); xx < x1; xx += bw) out.push(<line key={`v${row}-${xx}`} x1={xx} y1={yy} x2={xx} y2={yy + bh} stroke={m.line} strokeWidth="1" opacity="0.4" />);
        if (row % 3 === 0) for (let xx = x0; xx < x1; xx += bw * (3 + Math.floor(r() * 4))) out.push(<rect key={`t${row}-${xx}`} x={xx} y={yy} width={bw} height={bh} fill={m.dark} opacity={0.15 + r() * 0.15} />);
      }
    } else if (m.block) {
      const [bw, bh] = m.block;
      for (let row = 0, yy = y - bh; yy > top - bh; row++, yy -= bh) {
        out.push(<line key={`h${row}`} x1={x0} y1={yy} x2={x1} y2={yy} stroke={m.line} strokeWidth="1.6" opacity="0.5" />);
        for (let xx = x0 + (row % 2 ? bw / 2 : 0); xx < x1; xx += bw) out.push(<line key={`v${row}-${xx}`} x1={xx} y1={yy} x2={xx} y2={yy + bh} stroke={m.line} strokeWidth="1.4" opacity="0.45" />);
      }
      if (m.speck) for (let k = 0; k < 900; k++) out.push(<circle key={`s${k}`} cx={x0 + r() * (x1 - x0)} cy={top + r() * h} r={0.8 + r() * 1.6} fill={m.speck} opacity="0.35" />);
      if (m.vein) for (let k = 0; k < 40; k++) {
        const vx = x0 + r() * (x1 - x0);
        const vy = top + r() * h;
        out.push(<path key={`v${k}`} d={`M${vx},${vy} q${30 + r() * 60},${20 + r() * 40} ${60 + r() * 120},${-10 + r() * 30}`} stroke={m.vein} strokeWidth="1.2" fill="none" opacity="0.45" />);
      }
    } else if (m.plank) {
      for (let xx = x0; xx < x1; xx += m.plank) {
        out.push(<line key={`p${xx}`} x1={xx} y1={top} x2={xx} y2={y} stroke={m.line} strokeWidth="2" opacity="0.6" />);
        for (let k = 0; k < 3; k++) {
          const gx = xx + 8 + r() * (m.plank - 16);
          out.push(<path key={`g${xx}-${k}`} d={`M${gx},${top} Q${gx + (r() - 0.5) * 12},${top + h / 2} ${gx},${y}`} stroke={m.line} strokeWidth="0.8" fill="none" opacity="0.3" />);
        }
      }
    } else {
      for (let k = 0; k < 60; k++) out.push(<ellipse key={`m${k}`} cx={x0 + r() * (x1 - x0)} cy={top + r() * h} rx={40 + r() * 120} ry={20 + r() * 60} fill={r() > 0.5 ? m.dark : '#fff8ec'} opacity="0.07" />);
    }
    return out;
  }, [seed, material, x0, x1, y, h]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1={top} x2="0" y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mixColor(m.dark, '#000000', 0.25)} />
          <stop offset="0.45" stopColor={mixColor(m.base, '#ffffff', 0.08 * light)} />
          <stop offset="1" stopColor={m.dark} />
        </linearGradient>
      </defs>
      <rect x={x0} y={top} width={x1 - x0} height={h} fill={`url(#${uid}g)`} />
      {tex}
      {dado && <rect x={x0} y={y - h * 0.09} width={x1 - x0} height={h * 0.09} fill={dado} opacity="0.85" />}
      {frieze && <Frieze x0={x0} x1={x1} y={y - h * (frieze.at ?? 0.72)} h={frieze.h ?? 34} style={frieze.style} colors={frieze.colors || ['#2a5a8a', '#d8a838', '#1a1a1a']} />}
      {beams &&
        Array.from({ length: Math.floor((x1 - x0) / 140) }, (_, i) => (
          <g key={`b${i}`}>
            <rect x={x0 + i * 140} y={top} width={46} height={h * 0.06} fill="#3a2414" />
          </g>
        ))}
      {beams && <rect x={x0} y={top + h * 0.06} width={x1 - x0} height={h * 0.02} fill="#2a1a10" />}
      {niches.map((n, i) => {
        const ny = y - (n.lift ?? 140);
        return (
          <g key={`n${i}`}>
            <path d={`M${n.x - n.w / 2},${ny} L${n.x - n.w / 2},${ny - n.h + n.w / 2} A${n.w / 2},${n.w / 2} 0 0 1 ${n.x + n.w / 2},${ny - n.h + n.w / 2} L${n.x + n.w / 2},${ny} Z`} fill="#1a120c" opacity="0.8" />
            <ellipse cx={n.x} cy={ny - n.h * 0.35} rx={n.w * 0.6} ry={n.h * 0.5} fill="#ffc060" opacity="0.25" />
          </g>
        );
      })}
      {openings.map((o, i) => {
        const oy = y - (o.lift ?? 0);
        const arch = o.kind === 'arch' || o.kind === 'window-arch';
        return (
          <g key={`o${i}`}>
            <rect x={o.x - o.w / 2 - o.w * 0.08} y={oy - o.h - o.w * 0.08} width={o.w * 1.16} height={o.h + o.w * 0.08} fill={m.dark} opacity="0.5" />
            {o.view ? (
              <View x={o.x} y={oy} w={o.w} h={o.h} view={o.view} arch={arch} uid={`${uid}v${i}`} />
            ) : (
              <path d={arch ? `M${o.x - o.w / 2},${oy} L${o.x - o.w / 2},${oy - o.h + o.w / 2} A${o.w / 2},${o.w / 2} 0 0 1 ${o.x + o.w / 2},${oy - o.h + o.w / 2} L${o.x + o.w / 2},${oy} Z` : `M${o.x - o.w / 2},${oy} L${o.x - o.w / 2},${oy - o.h} L${o.x + o.w / 2},${oy - o.h} L${o.x + o.w / 2},${oy} Z`} fill={o.lit ? '#f0c88a' : '#140e0a'} opacity={o.lit ? 0.9 : 1} stroke={INK} strokeWidth="2" />
            )}
            {o.lit && <ellipse cx={o.x} cy={oy - o.h * 0.4} rx={o.w * 0.9} ry={o.h * 0.6} fill="#ffe0a8" opacity="0.18" />}
          </g>
        );
      })}
    </Svg>
  );
}

/**
 * A row of pillars on the floor line `y`, `h` tall and `w` thick, at `xs`: `style` papyrus (a bundled shaft
 * with an open flaring capital, painted bands), lotus (a closed bud capital), pier (square brick pier with a
 * glazed band), cedar (timber post with a bracket), crystal (a slender pale shaft) or colossus (a seated,
 * faceless statue of stone on its throne). `colors` [body, band, dark].
 */
export function Colonnade({ cfg }) {
  const { xs = [400, 1200], y = 740, h = 600, w = 50, style = 'papyrus', colors } = cfg;
  const [body, band, dark] = colors || { papyrus: ['#d8c098', '#2a6a8a', '#7a5a38'], lotus: ['#e0cca8', '#a83a2a', '#7a5a38'], pier: ['#b07850', '#2a5a9a', '#5a3820'], cedar: ['#7a4e2e', '#c8a060', '#3a2414'], crystal: ['#dce8f0', '#ffffff', '#8aa0b0'], colossus: ['#4a4448', '#8a7a5a', '#1e1a1e'] }[style];
  return (
    <Svg>
      {xs.map((x, i) => {
        const top = y - h;
        if (style === 'colossus') {
          const W = w * 3.2;
          return (
            <g key={i}>
              <rect x={x - W / 2} y={y - h * 0.42} width={W} height={h * 0.42} fill={dark} stroke={INK} strokeWidth="2" />
              <rect x={x - W / 2} y={y - h * 0.46} width={W} height={h * 0.05} fill={band} />
              <path d={`M${x - W * 0.32},${y - h * 0.42} L${x - W * 0.3},${y - h * 0.78} Q${x},${y - h * 0.84} ${x + W * 0.3},${y - h * 0.78} L${x + W * 0.32},${y - h * 0.42} Z`} fill={body} stroke={INK} strokeWidth="2" />
              <path d={`M${x - W * 0.3},${y - h * 0.42} L${x - W * 0.3},${y - h * 0.06} L${x - W * 0.1},${y - h * 0.06} L${x - W * 0.1},${y - h * 0.42} M${x + W * 0.1},${y - h * 0.42} L${x + W * 0.1},${y - h * 0.06} L${x + W * 0.3},${y - h * 0.06} L${x + W * 0.3},${y - h * 0.42}`} fill={body} stroke={INK} strokeWidth="2" />
              <path d={`M${x - W * 0.2},${y - h * 0.8} L${x - W * 0.26},${y - h * 0.94} Q${x},${y - h * 1.02} ${x + W * 0.26},${y - h * 0.94} L${x + W * 0.2},${y - h * 0.8} Z`} fill={body} stroke={INK} strokeWidth="2" />
              <path d={`M${x - W * 0.26},${y - h * 0.94} L${x - W * 0.34},${y - h * 0.76} L${x - W * 0.22},${y - h * 0.76} Z M${x + W * 0.26},${y - h * 0.94} L${x + W * 0.34},${y - h * 0.76} L${x + W * 0.22},${y - h * 0.76} Z`} fill={band} stroke={INK} strokeWidth="1.5" />
            </g>
          );
        }
        if (style === 'cedar') {
          return (
            <g key={i}>
              <rect x={x - w / 2} y={top} width={w} height={h} fill={body} stroke={INK} strokeWidth="2" />
              {[0.2, 0.5, 0.8].map((k) => <line key={k} x1={x - w * 0.2} y1={top + h * 0.05} x2={x - w * 0.15} y2={y} stroke={dark} strokeWidth="1" opacity="0.5" />)}
              <path d={`M${x - w * 2},${top} L${x + w * 2},${top} L${x + w * 0.5},${top + w * 1.2} L${x - w * 0.5},${top + w * 1.2} Z`} fill={dark} stroke={INK} strokeWidth="1.5" />
              <rect x={x - w * 0.7} y={y - w * 0.4} width={w * 1.4} height={w * 0.4} fill={dark} />
              <rect x={x - w / 2} y={top + w * 1.4} width={w} height={w * 0.25} fill={band} />
            </g>
          );
        }
        if (style === 'crystal') {
          return (
            <g key={i} opacity="0.8">
              <rect x={x - w * 0.35} y={top} width={w * 0.7} height={h} fill={body} stroke={dark} strokeWidth="1.5" />
              <rect x={x - w * 0.2} y={top} width={w * 0.12} height={h} fill={band} opacity="0.8" />
              <rect x={x - w * 0.6} y={top - w * 0.2} width={w * 1.2} height={w * 0.25} fill={body} stroke={dark} strokeWidth="1.2" />
              <rect x={x - w * 0.6} y={y - w * 0.25} width={w * 1.2} height={w * 0.25} fill={body} stroke={dark} strokeWidth="1.2" />
            </g>
          );
        }
        if (style === 'pier') {
          return (
            <g key={i}>
              <rect x={x - w / 2} y={top} width={w} height={h} fill={body} stroke={INK} strokeWidth="2" />
              {Array.from({ length: Math.floor(h / 18) }, (_, k) => <line key={k} x1={x - w / 2} y1={y - k * 18} x2={x + w / 2} y2={y - k * 18} stroke={dark} strokeWidth="1" opacity="0.4" />)}
              <rect x={x - w / 2} y={top + h * 0.12} width={w} height={h * 0.08} fill={band} />
              <rect x={x - w * 0.62} y={top - w * 0.2} width={w * 1.24} height={w * 0.3} fill={dark} />
            </g>
          );
        }
        // papyrus and lotus: a swelling shaft bound with bands, under a capital
        const capH = w * 1.4;
        const shaft = `M${x - w * 0.42},${y} C${x - w * 0.55},${y - h * 0.4} ${x - w * 0.5},${top + capH} ${x - w * 0.36},${top + capH} L${x + w * 0.36},${top + capH} C${x + w * 0.5},${top + capH} ${x + w * 0.55},${y - h * 0.4} ${x + w * 0.42},${y} Z`;
        return (
          <g key={i}>
            <path d={shaft} fill={body} stroke={INK} strokeWidth="2" />
            {[-0.18, 0, 0.18].map((k) => <line key={k} x1={x + k * w} y1={top + capH + 6} x2={x + k * w * 1.1} y2={y - 4} stroke={dark} strokeWidth="1.2" opacity="0.4" />)}
            {[0.04, 0.08, 0.12].map((k) => <rect key={k} x={x - w * 0.42} y={top + capH + h * k} width={w * 0.84} height={h * 0.012} fill={band} />)}
            {style === 'papyrus' ? (
              <path d={`M${x - w * 0.36},${top + capH} C${x - w * 0.9},${top + capH * 0.6} ${x - w * 1.1},${top + capH * 0.15} ${x - w * 1.05},${top} L${x + w * 1.05},${top} C${x + w * 1.1},${top + capH * 0.15} ${x + w * 0.9},${top + capH * 0.6} ${x + w * 0.36},${top + capH} Z`} fill={body} stroke={INK} strokeWidth="2" />
            ) : (
              <path d={`M${x - w * 0.36},${top + capH} C${x - w * 0.7},${top + capH * 0.5} ${x - w * 0.5},${top + capH * 0.1} ${x},${top} C${x + w * 0.5},${top + capH * 0.1} ${x + w * 0.7},${top + capH * 0.5} ${x + w * 0.36},${top + capH} Z`} fill={body} stroke={INK} strokeWidth="2" />
            )}
            <path d={`M${x - w * 0.8},${top + capH * 0.45} L${x + w * 0.8},${top + capH * 0.45}`} stroke={band} strokeWidth={w * 0.1} opacity="0.85" />
            <rect x={x - w * 1.1} y={top - w * 0.25} width={w * 2.2} height={w * 0.25} fill={dark} />
            <rect x={x - w * 0.55} y={y - w * 0.2} width={w * 1.1} height={w * 0.2} fill={dark} />
          </g>
        );
      })}
    </Svg>
  );
}
Colonnade.bounds = (c) => {
  const { xs = [400, 1200], y = 740, h = 600, w = 50, style } = c;
  const pad = style === 'colossus' ? w * 2 : style === 'cedar' ? w * 2.2 : w * 1.2;
  return [Math.min(...xs) - pad, y - h * 1.08, Math.max(...xs) + pad, y + 8];
};
