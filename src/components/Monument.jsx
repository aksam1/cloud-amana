import { motion, useReducedMotion } from 'motion/react';
import { LEVELS, unitStatus } from '../lib/pyramid.js';

/*
 * The Pyramid of Righteousness as a stepped monument of sunlit sandstone: Islam the base, Iman the middle,
 * Ihsan the peak, each level's name carved in Arabic on its frieze, every unit one stone. Stones that can be
 * explored today carry a gold edge; a stone fills with gold leaf as its meter rises and glows once the unit
 * is completed; a level's frieze is gilded when all its stones are done, and the capstone at the peak.
 *
 * Props: meters {unitId: 0–100}, done {unitId: bool}, lit {levelId: bool}, peak, start (levelId to glow),
 * recommended (unitId), selected (unitId), onSelect(unitId) — omit onSelect for a still picture —
 * scenery (default true): its own glow and sand, for pages without the home page's dusk sky behind it.
 */

// Tier geometry in a 360 × 316 frame, base first: frieze band on top, then `rows` courses of stones.
const TIERS = [
  { x0: 14, x1: 346, y0: 218, y1: 300, rows: 1 },
  { x0: 58, x1: 302, y0: 130, y1: 218, rows: 2 },
  { x0: 100, x1: 260, y0: 44, y1: 130, rows: 3 },
];
const FRIEZE = 17;
const GAP = 3;

function stones(level, tier) {
  const n = level.units.length;
  const perRow = Math.ceil(n / tier.rows);
  const rowH = (tier.y1 - tier.y0 - FRIEZE - 4) / tier.rows;
  return level.units.map((u, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const w = (tier.x1 - tier.x0 - 10 - GAP * (inRow - 1)) / inRow;
    const x = tier.x0 + 5 + (i - row * perRow) * (w + GAP);
    const y = tier.y0 + FRIEZE + 2 + row * rowH + GAP / 2;
    return { unit: u, x, y, w, h: rowH - GAP };
  });
}

export default function Monument({ meters = {}, done = {}, lit = {}, peak = false, start, recommended, selected, onSelect, scenery = true, className = '' }) {
  const still = useReducedMotion();
  const pulse = still ? {} : { animate: { opacity: [0.35, 1, 0.35] }, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } };
  return (
    <svg viewBox="0 0 360 316" className={className} role="group" aria-label="The pyramid: Islam at the base, Iman in the middle, Ihsan at the peak">
      <defs>
        <linearGradient id="mn-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ead0a0" />
          <stop offset="0.5" stopColor="#cba872" />
          <stop offset="1" stopColor="#9c7a4a" />
        </linearGradient>
        <linearGradient id="mn-stone-dim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfa27a" />
          <stop offset="1" stopColor="#866846" />
        </linearGradient>
        <linearGradient id="mn-frieze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4c58e" />
          <stop offset="1" stopColor="#a8834f" />
        </linearGradient>
        <linearGradient id="mn-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbe7b0" />
          <stop offset="1" stopColor="#d4a24c" />
        </linearGradient>
        {/* the far side of each tier falls into shade: the sun is low, ahead and to the left */}
        <linearGradient id="mn-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#1a0f06" stopOpacity="0" />
          <stop offset="1" stopColor="#1a0f06" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id="mn-glow-bg" cx="0.5" cy="0.9" r="0.6">
          <stop offset="0" stopColor="#e98c46" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#a5582f" stopOpacity="0.18" />
          <stop offset="1" stopColor="#1c2748" stopOpacity="0" />
        </radialGradient>
        <filter id="mn-glow" x="-40%" y="-60%" width="180%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <pattern id="mn-grain" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 6h2M3 2h2M5 5h1M1 3h1" stroke="#3a2614" strokeOpacity="0.16" strokeWidth="0.6" />
        </pattern>
      </defs>

      {scenery && (
        <>
          <rect x="0" y="0" width="360" height="316" fill="url(#mn-glow-bg)" />
        </>
      )}
      {/* the shadow the monument throws onto the sand */}
      <ellipse cx="186" cy="301" rx="178" ry="6" fill="#0d0805" opacity="0.55" />

      {/* capstone */}
      <g>
        <polygon points="180,8 226,44 134,44" fill="url(#mn-stone)" stroke="#3a2614" strokeWidth="0.8" />
        <polygon points="180,8 226,44 180,44" fill="#1a0f06" opacity="0.32" />
        <polygon points="180,8 226,44 134,44" fill="url(#mn-grain)" />
        <polygon points="180,8 191.5,17 168.5,17" fill="url(#mn-gold)" />
        <polygon points="180,8 191.5,17 180,17" fill="#8a5e1c" opacity="0.35" />
        {peak && (
          <>
            <polygon points="180,8 226,44 134,44" fill="#fbe7b0" filter="url(#mn-glow)" opacity="0.9" />
            <polygon points="180,8 226,44 134,44" fill="url(#mn-gold)" />
          </>
        )}
      </g>

      {LEVELS.map((level, li) => {
        const t = TIERS[li];
        const isStart = start === level.id;
        const gilded = lit[level.id];
        return (
          <g key={level.id}>
            {/* the tier's mortar body and its carved frieze */}
            <rect x={t.x0} y={t.y0} width={t.x1 - t.x0} height={t.y1 - t.y0} fill="#2a1a0c" />
            <rect x={t.x0 - 3} y={t.y0} width={t.x1 - t.x0 + 6} height={FRIEZE} fill={gilded ? 'url(#mn-gold)' : 'url(#mn-frieze)'} />
            <rect x={t.x0 - 3} y={t.y0} width={t.x1 - t.x0 + 6} height="1.4" fill="#fff6dc" opacity="0.55" />
            {gilded && <rect x={t.x0 - 3} y={t.y0 - 2} width={t.x1 - t.x0 + 6} height={FRIEZE + 4} fill="#fbe7b0" filter="url(#mn-glow)" opacity="0.6" />}
            {/* the level's name, carved: a light lip under a dark cut */}
            <text x={(t.x0 + t.x1) / 2} y={t.y0 + 13.2} textAnchor="middle" fontFamily="'Aref Ruqaa', 'Amiri Quran', serif" fontSize="12.5" fontWeight="700" fill="#fff3d6" opacity="0.5" aria-hidden="true">
              {level.arabic}
            </text>
            <text x={(t.x0 + t.x1) / 2} y={t.y0 + 12.4} textAnchor="middle" fontFamily="'Aref Ruqaa', 'Amiri Quran', serif" fontSize="12.5" fontWeight="700" fill="#4a2f16" aria-hidden="true">
              {level.arabic}
            </text>

            {stones(level, t).map(({ unit, x, y, w, h }) => {
              const m = meters[unit.id] || 0;
              const status = unitStatus(unit.id);
              const ready = status !== 'soon';
              const label = `${unit.title}, ${unit.english}: ${m}%${done[unit.id] ? ', completed' : ''}${ready ? '' : ', still being written'}`;
              const interactive = !!onSelect;
              const fs = h < 26 ? 9.5 : w < 66 ? 10 : 10.5;
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
                  {done[unit.id] && <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} fill="#fbe7b0" filter="url(#mn-glow)" opacity="0.8" />}
                  <rect x={x} y={y} width={w} height={h} rx="1.2" fill={ready ? 'url(#mn-stone)' : 'url(#mn-stone-dim)'} />
                  <rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#mn-grain)" />
                  {m > 0 && (
                    <motion.rect
                      x={x}
                      width={w}
                      rx="1.2"
                      fill="url(#mn-gold)"
                      opacity={done[unit.id] ? 1 : 0.9}
                      initial={still ? false : { y: y + h, height: 0 }}
                      animate={{ y: y + h * (1 - m / 100), height: (h * m) / 100 }}
                      transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }}
                    />
                  )}
                  <rect x={x} y={y} width={w} height="1.2" fill="#fff6dc" opacity="0.5" />
                  {/* a gold edge marks a stone that can be explored today */}
                  {ready && <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="1" fill="none" stroke="#f5cf73" strokeWidth="1.7" />}
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="Cinzel, serif"
                    fontSize={fs}
                    fontWeight="700"
                    fill="#2a1a0b"
                    opacity={ready ? 1 : 0.68}
                  >
                    {unit.title}
                  </text>
                  <rect className="sel" x={x - 1.8} y={y - 1.8} width={w + 3.6} height={h + 3.6} rx="2.5" fill="none" stroke="#fff3d6" strokeWidth="1.8" opacity={selected === unit.id ? 1 : 0} />
                  {recommended === unit.id && selected !== unit.id && (
                    <motion.rect x={x - 2.2} y={y - 2.2} width={w + 4.4} height={h + 4.4} rx="3" fill="none" stroke="#fff3d6" strokeWidth="1.4" strokeDasharray="4 3" {...pulse} />
                  )}
                </g>
              );
            })}

            {/* the far side of the tier in shade, over everything but the labels' legibility */}
            <rect x={t.x0 - 3} y={t.y0} width={t.x1 - t.x0 + 6} height={t.y1 - t.y0} fill="url(#mn-shade)" pointerEvents="none" />

            {isStart && <motion.rect x={t.x0 - 7} y={t.y0 - 5} width={t.x1 - t.x0 + 14} height={t.y1 - t.y0 + 8} rx="4" fill="none" stroke="#fbe7b0" strokeWidth="2" pointerEvents="none" {...pulse} />}
          </g>
        );
      })}
    </svg>
  );
}
