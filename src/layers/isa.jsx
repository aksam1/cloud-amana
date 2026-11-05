// Maryam's and Isa's story: fruit out of season, birds shaped of clay, the table sent down.
import { useMemo } from 'react';
import { Svg } from '../components/stageKit.jsx';
import { rng } from '../lib/geo.js';

const INK = '#2a2420';

/**
 * Birds shaped of clay standing on a board: `count` of them from `x0` to `x1` with their feet on `y`, each
 * `s` long (about 1 ≈ 30 units). `wet` darkens them as fresh clay.
 */
export function ClayBirds({ cfg }) {
  const { x0 = 600, x1 = 1000, y = 780, count = 5, s = 1, wet = 0.4, board = true, seed = 3 } = cfg;
  const clay = wet > 0.5 ? '#8a5a3a' : '#a8724a';
  const birds = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => ({ x: x0 + ((x1 - x0) * (i + 0.5)) / count + (r() - 0.5) * 10 * s, face: r() > 0.5 ? 1 : -1, tilt: (r() - 0.5) * 14, k: 0.85 + r() * 0.3 }));
  }, [x0, x1, count, s, seed]);
  return (
    <Svg>
      {board && <path d={`M${x0 - 30 * s},${y + 3 * s} L${x1 + 30 * s},${y + 3 * s} L${x1 + 22 * s},${y + 10 * s} L${x0 - 22 * s},${y + 10 * s} Z`} fill="#6a4a30" stroke={INK} strokeWidth={s} />}
      {birds.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${y}) scale(${b.face * s * b.k} ${s * b.k}) rotate(${b.tilt})`}>
          <ellipse cx="0" cy="1" rx="13" ry="2.5" fill="#000" opacity="0.2" />
          <path d="M-14,-8 C-12,-16 2,-18 8,-14 C12,-20 18,-20 20,-16 L25,-15 L20,-12 C18,-6 12,-2 2,-2 C-6,-2 -12,-3 -14,-8 Z" fill={clay} stroke={INK} strokeWidth="1.1" />
          <path d="M-14,-8 L-22,-12 L-20,-6 Z" fill={clay} stroke={INK} strokeWidth="1" />
          <path d="M-6,-12 C-2,-16 4,-16 6,-12" stroke={INK} strokeWidth="0.9" fill="none" opacity="0.7" />
          <circle cx="17" cy="-16" r="0.9" fill={INK} />
          <path d="M-2,-2 L-3,1 M3,-2 L4,1" stroke={INK} strokeWidth="1" />
          {/* thumb marks in the clay */}
          <path d="M-8,-6 q2,-2 4,0 M0,-5 q2,-2 4,0" stroke="#6a4028" strokeWidth="0.8" fill="none" opacity="0.6" />
        </g>
      ))}
    </Svg>
  );
}
ClayBirds.bounds = (c) => {
  const { x0 = 600, x1 = 1000, y = 780, s = 1 } = c;
  return [x0 - 40 * s, y - 30 * s, x1 + 40 * s, y + 14 * s];
};

/** A shallow bowl heaped with fruit out of season (grapes, pomegranates, figs), at (`x`, `y`), `w` across; `glow` warms it. */
export function Fruit({ cfg }) {
  const { x = 800, y = 780, w = 60, glow = 0.6, seed = 2 } = cfg;
  const r = useMemo(() => rng(seed), [seed]);
  const items = useMemo(() => {
    const out = [];
    const kinds = ['pom', 'grape', 'fig', 'grape', 'pom', 'fig', 'grape'];
    kinds.forEach((k, i) => {
      const a = (i / kinds.length) * Math.PI;
      out.push({ k, x: x - w * 0.36 + (i / (kinds.length - 1)) * w * 0.72, y: y - w * 0.12 - Math.sin(a) * w * 0.16 - r() * w * 0.04 });
    });
    return out;
  }, [x, y, w, r]);
  const u = w / 60;
  return (
    <Svg>
      {glow > 0 && <ellipse cx={x} cy={y - w * 0.2} rx={w * 0.9} ry={w * 0.5} fill="#ffe0a0" opacity={glow * 0.3} />}
      {items.map((f, i) =>
        f.k === 'pom' ? (
          <g key={i}><circle cx={f.x} cy={f.y} r={6 * u} fill="#b8342a" stroke={INK} strokeWidth={0.8 * u} /><path d={`M${f.x - 1.5 * u},${f.y - 6 * u} l${1.5 * u},${-2 * u} l${1.5 * u},${2 * u}`} fill="#8a2a20" /></g>
        ) : f.k === 'fig' ? (
          <path key={i} d={`M${f.x},${f.y - 6 * u} C${f.x + 6 * u},${f.y - 2 * u} ${f.x + 5 * u},${f.y + 5 * u} ${f.x},${f.y + 5 * u} C${f.x - 5 * u},${f.y + 5 * u} ${f.x - 6 * u},${f.y - 2 * u} ${f.x},${f.y - 6 * u} Z`} fill="#6a3a5a" stroke={INK} strokeWidth={0.8 * u} />
        ) : (
          <g key={i}>{[[0, 0], [-2.6, 2.4], [2.6, 2.4], [0, 4.8], [-1.3, 7], [1.3, 7]].map(([dx, dy], k) => <circle key={k} cx={f.x + dx * u} cy={f.y - 3 * u + dy * u} r={2.1 * u} fill="#8a9a3a" stroke={INK} strokeWidth={0.5 * u} />)}</g>
        ),
      )}
      <path d={`M${x - w / 2},${y - w * 0.1} Q${x},${y + w * 0.16} ${x + w / 2},${y - w * 0.1} Z`} fill="#c8a070" stroke={INK} strokeWidth={u} />
      <ellipse cx={x} cy={y - w * 0.1} rx={w / 2} ry={w * 0.05} fill="#a8804a" stroke={INK} strokeWidth={0.8 * u} />
    </Svg>
  );
}
Fruit.bounds = (c) => {
  const { x = 800, y = 780, w = 60 } = c;
  return [x - w, y - w * 0.8, x + w, y + w * 0.2];
};

/** The table sent down (5:112–115): a low table spread with a white cloth, loaves and fish, `w` across at (`x`, `y`). */
export function Table({ cfg }) {
  const { x = 800, y = 780, w = 160, cloth = '#f4ecdc', glow = 0.6 } = cfg;
  const u = w / 160;
  const loaves = [-50, -18, 16, 48].map((dx, i) => ({ dx, dy: (i % 2) * 4 }));
  return (
    <Svg>
      {glow > 0 && <ellipse cx={x} cy={y - 30 * u} rx={w * 0.9} ry={60 * u} fill="#fff4d6" opacity={glow * 0.35} />}
      <path d={`M${x - w / 2},${y - 26 * u} L${x + w / 2},${y - 26 * u} L${x + w / 2 + 6 * u},${y - 4 * u} L${x - w / 2 - 6 * u},${y - 4 * u} Z`} fill={cloth} stroke={INK} strokeWidth={u} />
      <path d={`M${x - w / 2 - 6 * u},${y - 4 * u} Q${x - w / 4},${y + 2 * u} ${x},${y - 4 * u} Q${x + w / 4},${y + 2 * u} ${x + w / 2 + 6 * u},${y - 4 * u}`} stroke={INK} strokeWidth={0.8 * u} fill="none" />
      <path d={`M${x - w * 0.42},${y - 4 * u} L${x - w * 0.42},${y + 8 * u} M${x + w * 0.42},${y - 4 * u} L${x + w * 0.42},${y + 8 * u}`} stroke="#6a4a30" strokeWidth={3 * u} />
      {loaves.map((l, i) => <ellipse key={i} cx={x + l.dx * u} cy={y - 30 * u + l.dy * u} rx={12 * u} ry={6 * u} fill="#d8a860" stroke={INK} strokeWidth={0.8 * u} />)}
      <path d={`M${x - 20 * u},${y - 16 * u} q10,-6 22,0 l6,-4 l0,8 l-6,-4 q-12,6 -22,0 Z`} fill="#9ab0b8" stroke={INK} strokeWidth={0.8 * u} transform={`scale(${1}) `} />
    </Svg>
  );
}
Table.bounds = (c) => {
  const { x = 800, y = 780, w = 160 } = c;
  return [x - w * 0.95, y - w * 0.6, x + w * 0.95, y + w * 0.1];
};
