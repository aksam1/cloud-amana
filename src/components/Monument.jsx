import { motion, useReducedMotion } from 'motion/react';
import { LEVELS, unitStatus } from '../lib/pyramid.js';

/*
 * The Pyramid of Righteousness as a stepped stone monument: Islam the base, Iman the middle, Ihsan the
 * peak, every unit one stone. A stone fills with gold as its meter rises and glows once the unit is
 * completed; a level's ledge lights when all its stones are done, and the capstone when all three are.
 *
 * Props: meters {unitId: 0–100}, done {unitId: bool}, lit {levelId: bool}, peak, start (levelId to glow),
 * recommended (unitId), selected (unitId), onSelect(unitId) — omit onSelect for a still picture.
 */

// Tier geometry in a 360 × 320 frame, base first. rows = how many courses of stones the tier has.
const TIERS = [
  { x0: 18, x1: 342, y0: 222, y1: 290, rows: 1 },
  { x0: 64, x1: 296, y0: 148, y1: 222, rows: 2 },
  { x0: 106, x1: 254, y0: 64, y1: 148, rows: 3 },
];
const GAP = 3;

function stones(level, tier) {
  const n = level.units.length;
  const perRow = Math.ceil(n / tier.rows);
  const rowH = (tier.y1 - tier.y0 - 6) / tier.rows; // 6 = the ledge on top of the tier
  return level.units.map((u, i) => {
    const row = Math.floor(i / perRow); // from the top course down
    const inRow = Math.min(perRow, n - row * perRow);
    const w = (tier.x1 - tier.x0 - 8 - GAP * (inRow - 1)) / inRow;
    const x = tier.x0 + 4 + (i - row * perRow) * (w + GAP);
    const y = tier.y0 + 6 + row * rowH + GAP / 2;
    return { unit: u, x, y, w, h: rowH - GAP };
  });
}

export default function Monument({ meters = {}, done = {}, lit = {}, peak = false, start, recommended, selected, onSelect, className = '' }) {
  const still = useReducedMotion();
  const pulse = still ? {} : { animate: { opacity: [0.35, 1, 0.35] }, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } };
  return (
    <svg viewBox="0 0 360 320" className={className} role="group" aria-label="The pyramid: Islam at the base, Iman in the middle, Ihsan at the peak">
      <defs>
        <linearGradient id="mn-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a6242" />
          <stop offset="1" stopColor="#4d3c27" />
        </linearGradient>
        <linearGradient id="mn-ledge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a68b5e" />
          <stop offset="1" stopColor="#6e5838" />
        </linearGradient>
        <linearGradient id="mn-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7e0a3" />
          <stop offset="1" stopColor="#c99a45" />
        </linearGradient>
        <radialGradient id="mn-sky" cx="0.5" cy="0.86" r="0.62">
          <stop offset="0" stopColor="#e0662c" stopOpacity="0.62" />
          <stop offset="0.38" stopColor="#a5772f" stopOpacity="0.3" />
          <stop offset="1" stopColor="#1c2748" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mn-dune" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4128" />
          <stop offset="0.55" stopColor="#2e2217" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2e2217" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mn-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b4a2a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3b2a1a" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mn-vign" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="mn-fade">
          <rect x="0" y="0" width="360" height="320" fill="url(#mn-vign)" />
        </mask>
        <filter id="mn-glow" x="-40%" y="-60%" width="180%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <pattern id="mn-grain" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 5h2M3 2h2M4 6h1" stroke="#2a2016" strokeOpacity="0.35" strokeWidth="0.6" />
        </pattern>
      </defs>

      {/* the sky's glow behind the monument, and the desert floor */}
      <g mask="url(#mn-fade)">
      <rect x="0" y="0" width="360" height="320" fill="url(#mn-sky)" />
      <path d="M0 262 Q50 246 104 258 T214 252 T360 256 V320 H0z" fill="url(#mn-far)" />
      <path d="M0 296 Q70 282 150 290 T300 286 Q336 284 360 292 V320 H0z" fill="url(#mn-dune)" />
      </g>
      <ellipse cx="180" cy="292" rx="172" ry="6" fill="#000" opacity="0.4" />

      {/* capstone: lights only at the peak */}
      <g>
        <polygon points="180,20 226,64 134,64" fill="url(#mn-stone)" stroke="#2a2016" strokeWidth="1" />
        <polygon points="180,20 226,64 134,64" fill="url(#mn-grain)" />
        {peak && (
          <>
            <polygon points="180,20 226,64 134,64" fill="#f7e0a3" filter="url(#mn-glow)" opacity="0.9" />
            <polygon points="180,20 226,64 134,64" fill="url(#mn-gold)" />
          </>
        )}
      </g>

      {LEVELS.map((level, li) => {
        const t = TIERS[li];
        const isStart = start === level.id;
        return (
          <g key={level.id}>
            {/* the tier's body and the ledge (step) on top of it */}
            <rect x={t.x0} y={t.y0} width={t.x1 - t.x0} height={t.y1 - t.y0} fill="#2a2016" />
            <rect x={t.x0 - 2} y={t.y0} width={t.x1 - t.x0 + 4} height={6} fill={lit[level.id] ? 'url(#mn-gold)' : 'url(#mn-ledge)'} />
            {lit[level.id] && <rect x={t.x0 - 2} y={t.y0 - 2} width={t.x1 - t.x0 + 4} height={10} fill="#f7e0a3" filter="url(#mn-glow)" opacity="0.8" />}

            {stones(level, t).map(({ unit, x, y, w, h }) => {
              const m = meters[unit.id] || 0;
              const status = unitStatus(unit.id);
              const label = `${unit.title}, ${unit.english}: ${m}%${done[unit.id] ? ', completed' : ''}${status === 'soon' ? ', coming soon' : ''}`;
              const interactive = !!onSelect;
              return (
                <g
                  key={unit.id}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  aria-label={interactive ? label : undefined}
                  aria-pressed={interactive ? selected === unit.id : undefined}
                  onClick={interactive ? () => onSelect(unit.id) : undefined}
                  onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(unit.id)) : undefined}
                  className={interactive ? 'cursor-pointer outline-none [&:focus-visible>rect.sel]:opacity-100' : ''}
                >
                  {done[unit.id] && <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} fill="#f7e0a3" filter="url(#mn-glow)" opacity="0.75" />}
                  <rect x={x} y={y} width={w} height={h} rx="1.5" fill="url(#mn-stone)" stroke="#2a2016" strokeWidth="0.8" />
                  <rect x={x} y={y} width={w} height={h} rx="1.5" fill="url(#mn-grain)" />
                  {/* gold rises from the bottom of the stone with its meter */}
                  {m > 0 && <rect x={x} y={y + h * (1 - m / 100)} width={w} height={(h * m) / 100} rx="1.5" fill="url(#mn-gold)" opacity={done[unit.id] ? 1 : 0.85} />}
                  <rect x={x + 1} y={y + 1} width={w - 2} height={1.2} fill="#fff" opacity="0.12" />
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="Cinzel, serif"
                    fontSize={w < 64 ? 9.5 : 10.5}
                    fontWeight="600"
                    fill={m >= 55 ? '#2a1c0e' : status === 'soon' ? 'rgba(243,231,204,0.55)' : '#f3e7cc'}
                  >
                    {unit.title}
                  </text>
                  {/* selection and keyboard focus ring */}
                  <rect className="sel" x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} rx="2.5" fill="none" stroke="#f7e0a3" strokeWidth="1.6" opacity={selected === unit.id ? 1 : 0} />
                  {recommended === unit.id && selected !== unit.id && (
                    <motion.rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx="3" fill="none" stroke="#f7e0a3" strokeWidth="1.4" strokeDasharray="4 3" {...pulse} />
                  )}
                </g>
              );
            })}

            {/* the starting point from placement glows around the whole tier */}
            {isStart && <motion.rect x={t.x0 - 5} y={t.y0 - 4} width={t.x1 - t.x0 + 10} height={t.y1 - t.y0 + 7} rx="4" fill="none" stroke="#e2bb68" strokeWidth="2" pointerEvents="none" {...pulse} />}
          </g>
        );
      })}
    </svg>
  );
}
