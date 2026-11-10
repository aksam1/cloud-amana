import { LEVELS, STORY_PARTS } from '../lib/pyramid.js';

// Where every star stands (fixed, so the sky is the same on every visit and only its lights change).
// The story's lessons run left to right as a winding band, one small cluster per chapter; the pyramid's
// lessons form a triangle of their own below it.
const W = 640;
const H = 430;

const chapters = [...new Set(STORY_PARTS.map((p) => p.chapter))];
const centre = (i) => ({
  x: 44 + (i * (W - 88)) / Math.max(1, chapters.length - 1),
  y: 128 + 46 * Math.sin(i * 0.78 + 0.5) + (i % 2 ? 44 : -36),
});
export const STORY_STARS = STORY_PARTS.map((p) => {
  const i = chapters.indexOf(p.chapter);
  const mates = STORY_PARTS.filter((q) => q.chapter === p.chapter);
  const k = mates.indexOf(p);
  const c = centre(i);
  const r = mates.length === 1 ? 0 : 17 + (k % 2) * 8;
  const a = (k / mates.length) * Math.PI * 2 + i * 1.3;
  return { ...p, x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) * 0.8, group: i };
});

// the pyramid's lessons: the peak's level on top, the base widest
const ROWS = [...LEVELS].reverse();
export const UNIT_STARS = ROWS.flatMap((level, row) => {
  const y = 302 + row * 40;
  const span = 84 + row * 70;
  return level.units.map((u, k) => ({
    id: u.id,
    title: u.title,
    level: level.title,
    x: W / 2 + (level.units.length === 1 ? 0 : (k / (level.units.length - 1) - 0.5) * span),
    y,
  }));
});

function Star({ x, y, lit, label }) {
  return (
    <g>
      <title>{label}</title>
      {lit && <circle cx={x} cy={y} r="17" fill="#f6d68c" opacity="0.14" />}
      {lit && <circle cx={x} cy={y} r="9" fill="#f6d68c" opacity="0.3" />}
      <circle cx={x} cy={y} r={lit ? 4.6 : 2.4} fill={lit ? '#fff1cc' : '#e9e4d6'} opacity={lit ? 1 : 0.4} />
    </g>
  );
}

/**
 * The reader's private sky: one star for every lesson, lit once that lesson is finished. It never resets
 * with time and counts no days: it only ever shows what has been understood so far.
 * `learned` is the store's story-lesson record ("chapter:part" → true); `done` maps unit id → finished.
 */
export default function Sky({ learned = {}, done = {}, className = '' }) {
  const total = STORY_STARS.length + UNIT_STARS.length;
  const lit = STORY_STARS.filter((s) => learned[s.key]).length + UNIT_STARS.filter((u) => done[u.id]).length;
  const groups = chapters.map((_, i) => STORY_STARS.filter((s) => s.group === i));
  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Your sky: ${lit} of ${total} stars lit`} className="block w-full rounded-2xl border border-gold/20" style={{ background: 'radial-gradient(120% 90% at 50% 0%, #121a3a 0%, #0a0d1f 55%, #07080f 100%)' }}>
        {/* the thread of the story, from the creation onward */}
        <polyline points={chapters.map((_, i) => `${centre(i).x},${centre(i).y}`).join(' ')} fill="none" stroke="#f6d68c" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 7" />
        {groups.map((g, i) => {
          const all = g.length > 1 && g.every((s) => learned[s.key]);
          return g.length > 1 ? <polygon key={i} points={g.map((s) => `${s.x},${s.y}`).join(' ')} fill="none" stroke="#f6d68c" strokeOpacity={all ? 0.6 : 0.14} strokeWidth="1.2" /> : null;
        })}
        {STORY_STARS.map((s) => (
          <Star key={s.key} x={s.x} y={s.y} lit={!!learned[s.key]} label={`${s.title}${learned[s.key] ? ', lit' : ''}`} />
        ))}
        {/* the pyramid's own constellation */}
        <polygon points={`${W / 2},268 ${W / 2 - 138},410 ${W / 2 + 138},410`} fill="none" stroke="#f6d68c" strokeOpacity="0.14" strokeWidth="1" />
        {UNIT_STARS.map((u) => (
          <Star key={u.id} x={u.x} y={u.y} lit={!!done[u.id]} label={`${u.title}, ${u.level}${done[u.id] ? ', lit' : ''}`} />
        ))}
      </svg>
      <figcaption className="mt-2 font-body text-[1.05rem] leading-snug text-ivory/75">
        <span className="text-gold-hi">
          {lit} of {total} stars lit.
        </span>{' '}
        Each lesson you finish lights one. The winding band is the story, from the creation onward; the triangle is the pyramid. Nothing here counts days, and a star never goes out.
      </figcaption>
    </figure>
  );
}
