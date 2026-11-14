import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { buildWorld } from '../lib/mapWorld.js';
import { chapterForNode, eraById, expandRef, ayah, nodeScenes, timeline } from '../lib/story.js';
import { lightNode, useStore } from '../lib/store.js';
import { go } from '../lib/router.js';
import { ambience } from '../lib/audio.js';
import { clamp, roman } from '../lib/geo.js';
import { Icon, Rule, starPath } from './Ornaments.jsx';

const world = buildWorld(timeline);
const ARABIC_FONT = '"Aref Ruqaa", Amiri, serif';

/** The strata of time: five bands of parchment, the thread of light, and ruled lines. */
const Terrain = memo(function Terrain() {
  const { W, H } = world;
  return (
    <g>
      <defs>
        <linearGradient id="strata" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a18" stopOpacity="0.34" />
          <stop offset="1" stopColor="#3a2a18" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="thread" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7e0a3" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#c9993f" stopOpacity="0.6" />
          <stop offset="1" stopColor="#8a6a3a" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="origin" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3cd" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#f7d98a" stopOpacity="0.4" />
          <stop offset="1" stopColor="#f7d98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hour" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f2b8a0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f2b8a0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the strata: one band of parchment for each era */}
      {world.regions.map((g) => (
        <rect key={g.id} x="0" y={g.y0} width={W} height={g.y1 - g.y0} fill={g.tone} opacity="0.26" />
      ))}
      {world.regions.map((g) => (
        <rect key={`${g.id}-rule`} x="0" y={g.y0} width={W} height={g.y1 - g.y0} fill="url(#strata)" opacity="0.5" />
      ))}

      {/* the ruled lines of a page of time */}
      {world.regions.map((g) => (
        <g key={`${g.id}-lines`} opacity="0.3">
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1="0" y1={g.y0 + ((g.y1 - g.y0) * (i + 1)) / 6} x2={W} y2={g.y0 + ((g.y1 - g.y0) * (i + 1)) / 6} stroke="#5a4630" strokeWidth="0.7" strokeDasharray="1 9" />
          ))}
        </g>
      ))}

      {/* the stars of the first night */}
      {world.stars.map((s, i) => (
        <circle key={i} cx={s.x.toFixed(0)} cy={s.y.toFixed(0)} r={s.s.toFixed(1)} fill="#e8d9a8" opacity="0.5" />
      ))}

      {/* the point of light at the top: the Creation */}
      <g>
        <circle cx={W / 2} cy={110} r="86" fill="url(#origin)" />
        <circle cx={W / 2} cy={110} r="9" fill="#fff6d8" />
        <circle cx={W / 2} cy={110} r="20" fill="none" stroke="#f7d98a" strokeWidth="1.2" opacity="0.6" />
        <circle cx={W / 2} cy={110} r="34" fill="none" stroke="#f7d98a" strokeWidth="0.9" opacity="0.4" />
      </g>

      {/* the thread: one line of light from the first seal to the last */}
      {world.segs.map((s) => (
        <path key={`t-${s.from}-${s.to}`} d={s.d} fill="none" stroke="url(#thread)" strokeWidth="3.4" strokeLinecap="round" opacity="0.7" />
      ))}

      {/* the Hour, at the end of the thread */}
      <g>
        <circle cx={world.nodes.at(-1).x} cy={world.nodes.at(-1).y} r="120" fill="url(#hour)" />
      </g>

      {/* the era names, in the left margin */}
      {world.regions.map((g) => (
        <g key={`${g.id}-name`}>
          <text x="56" y={g.cy} fontFamily="Cinzel, serif" fontSize="30" letterSpacing="8" fill="#3b2a18" opacity="0.62" transform={`rotate(-90 56 ${g.cy})`}>
            {g.title.toUpperCase()}
          </text>
          <line x1="30" y1={g.y0} x2={W - 30} y2={g.y0} stroke="#3b2a18" strokeWidth="1" opacity="0.28" />
        </g>
      ))}
    </g>
  );
});

function nodeState(n, store) {
  const scenes = nodeScenes(n.id);
  const seen = scenes.filter((s) => store.seen[s.id]).length;
  return {
    scenes,
    seen,
    ready: scenes.length > 0,
    lit: !!store.lit[n.id],
    complete: scenes.length > 0 && seen === scenes.length,
    frac: scenes.length ? seen / scenes.length : 0,
  };
}

function MapNode({ n, st, selected, igniting, onSelect }) {
  const soon = !st.ready;
  const seal = soon ? (st.lit ? '#d8c08e' : '#cdb98f') : 'url(#bronze)';
  const status = soon ? 'in preparation' : st.complete ? 'watched' : st.seen ? `${st.seen} of ${st.scenes.length} scenes watched` : `${st.scenes.length} scenes`;
  return (
    <g
      className="map-node cursor-pointer"
      transform={`translate(${n.x} ${n.y})`}
      tabIndex={0}
      role="button"
      aria-label={`${n.title}. ${status}`}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(n.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(n.id);
        }
      }}
      opacity={soon && !st.lit ? 0.62 : 1}
    >
      <circle r="66" className="node-focus" fill="none" stroke="#f7e0a3" strokeWidth="3" opacity="0" />
      {st.lit && <circle r="62" fill="url(#halo)" className={st.ready && !st.complete ? 'halo-pulse' : undefined} />}
      {igniting && (
        <g>
          <motion.circle r={30} fill="none" stroke="#f7e0a3" strokeWidth="5" initial={{ r: 30, opacity: 1 }} animate={{ r: 170, opacity: 0 }} transition={{ duration: 1.6, ease: 'easeOut' }} />
          {Array.from({ length: 12 }, (_, i) => (
            <motion.line key={i} x1="0" y1="0" x2="0" y2="-120" stroke="#f7e0a3" strokeWidth="3" transform={`rotate(${i * 30})`} initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
          ))}
        </g>
      )}
      <motion.g whileHover={{ scale: 1.08 }} animate={selected ? { scale: 1.1 } : { scale: 1 }} style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
        {selected && <circle r="48" fill="none" stroke="#24180e" strokeWidth="1.6" strokeDasharray="4 6" />}
        {st.ready && st.frac > 0 && !st.complete && <circle r="43" fill="none" stroke="#b8862b" strokeWidth="4" strokeDasharray={`${st.frac * 270} 400`} transform="rotate(-90)" strokeLinecap="round" />}
        <circle r="36" fill={seal} stroke="#3b2a18" strokeWidth="2" />
        <path d={starPath(31, 0.72)} fill="none" stroke={soon ? '#7a6447' : '#3b2a18'} strokeWidth="1.6" />
        <circle r="14" fill={st.complete ? '#f3d48b' : st.lit ? '#2a1d12' : '#8a7452'} />
        {st.complete && <path d="M-7,0 L-2,5 L8,-6" stroke="#2a1d12" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
        {st.lit && !st.complete && <circle r="5" fill={st.ready ? '#f3d48b' : '#cdb98f'} />}
      </motion.g>
      {/* the name sits beside the seal, not below it: in the crowded centuries two
          seals can be level with one another, and a label underneath would land on
          the next seal down. The name is also kept off the thread — it lies outward
          from the seal, away from the centre line, so it never crosses the light. */}
      <text
        x={n.side === 'left' ? -52 : 52}
        y="-4"
        textAnchor={n.side === 'left' ? 'end' : 'start'}
        fontFamily="Cinzel, serif"
        fontSize="15"
        letterSpacing="2"
        fill="#24180e"
        fontWeight="600"
        stroke="#ecdcb9"
        strokeWidth="3"
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {n.short.toUpperCase()}
      </text>
      {n.alt && (
        <text
          x={n.side === 'left' ? -52 : 52}
          y="14"
          textAnchor={n.side === 'left' ? 'end' : 'start'}
          fontFamily="Cormorant Garamond, serif"
          fontSize="15"
          fontStyle="italic"
          fill="#4a3826"
          stroke="#ecdcb9"
          strokeWidth="2.5"
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {n.alt}
        </text>
      )}
    </g>
  );
}

function Dossier({ n, st, onClose, seen }) {
  const cta = useRef(null);
  // Keyboard users land on the action, but without scrolling the sheet past its title on phones.
  useEffect(() => cta.current?.focus({ preventScroll: true }), [n.id]);
  const era = eraById[n.era];
  const first = st.scenes.find((s) => !seen[s.id]);
  const target = first || st.scenes[0];
  const label = !st.ready ? null : st.seen === 0 ? 'Begin' : first ? `Continue: ${roman(first.order)}. ${first.title}` : 'Watch again';
  const refs = (n.ayahs || []).flatMap(expandRef);
  const planned = chapterForNode(n.id);
  return (
    <motion.aside
      key={n.id}
      className="parchment ruled cartouche thin-scroll pointer-events-auto absolute bottom-3 left-3 right-3 z-30 max-h-[64vh] overflow-y-auto p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,.85)] sm:bottom-24 sm:left-auto sm:right-6 sm:top-24 sm:max-h-none sm:w-[390px]"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.35 }}
      aria-label={n.title}
    >
      <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-black/5" aria-label="Close">
        <Icon name="close" className="h-4 w-4" />
      </button>
      <div className="caps text-[0.6rem] text-ink-soft">{era?.title}</div>
      <h2 className="font-display text-[1.35rem] font-semibold leading-tight text-ink">{n.title}</h2>
      {n.alt && <div className="font-body text-[1.05rem] italic text-ink-soft">{n.alt}</div>}
      <div className="caps mt-2 text-[0.6rem] text-ink-soft">{n.date}</div>
      <p className="mt-3 font-body text-[1.12rem] leading-snug text-ink">{n.summary}</p>

      {planned?.bridge && (
        <details className="mt-3 rounded-md border border-[#8a6a4e]/30 bg-[#5a3d22]/5 px-3 py-2">
          <summary className="caps cursor-pointer text-[0.62rem] text-ink">Before this story · Chapter {roman(planned.number)}</summary>
          {planned.bridge.where && <p className="mt-2 font-body text-[0.98rem] leading-snug text-ink-soft">{planned.bridge.where}</p>}
          {planned.bridge.line?.length > 0 && <p className="mt-1 font-display text-[0.92rem] text-ink">{planned.bridge.line.join(' → ')}</p>}
          {(planned.bridge.text || []).map((t, i) => (
            <p key={i} className="mt-2 font-body text-[1rem] leading-snug text-ink">
              {t}
            </p>
          ))}
        </details>
      )}

      {refs.length > 0 && (
        <div className="mt-4 space-y-3">
          {refs.map((ref) => {
            const a = ayah(ref);
            return (
              a && (
                <div key={ref}>
                  <p lang="ar" className="quran text-[1.35rem] text-ink">
                    {a.ar}
                  </p>
                  <p className="font-body text-[1rem] italic leading-snug text-ink">
                    “{a.en}” <span className="caps not-italic text-[0.56rem] text-ink-soft">{ref}</span>
                  </p>
                </div>
              )
            );
          })}
        </div>
      )}

      <Rule className="mx-auto my-4 h-3 w-40 text-[#7a5a2e]" />

      {st.ready ? (
        <>
          <ol className="space-y-1">
            {st.scenes.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => go(`/scene/${s.id}`)} className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-black/5">
                  <span className="caps w-8 shrink-0 text-[0.62rem] text-ink-soft">{roman(s.order)}</span>
                  <span className="flex-1 font-body text-[1.04rem] leading-tight text-ink">{s.title}</span>
                  {seen[s.id] && <Icon name="check" className="h-4 w-4 text-[#8a6a2e]" />}
                </button>
              </li>
            ))}
          </ol>
          <button ref={cta} type="button" className="btn-gold mt-5 w-full" onClick={() => go(`/scene/${target.id}`)}>
            <span className="truncate">{label}</span>
            <Icon name="play" className="h-4 w-4" />
          </button>
        </>
      ) : (
        <div className="rounded-md border border-[#8a6a4e]/40 bg-[#5a3d22]/5 p-4">
          <div className="caps text-[0.62rem] text-ink">In preparation{planned && ` · Chapter ${roman(planned.number)}`}</div>
          <p className="mt-1 font-body text-[1.04rem] leading-snug text-ink">
            {planned ? `This page of the chronicle will be painted in Chapter ${roman(planned.number)}, ${planned.title}.` : 'This page of the chronicle will be painted in a later chapter.'} Its place in time is already marked; the scenes are still to come.
          </p>
        </div>
      )}
    </motion.aside>
  );
}

export default function CampaignMap({ query = {} }) {
  const store = useStore();
  const viewport = useRef(null);
  const [vs, setVs] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [selected, setSelected] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [arrival, setArrival] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const k = useMotionValue(1);
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0) scale(${k})`;
  const drag = useRef({ pointers: new Map() });

  // The world is a tall column of time, so the map is read by scrolling down it.
  // The zoom that shows the whole width is the floor; the zoom that shows the whole
  // height is the ceiling, and the reader may go a little past both.
  const kMin = clamp((vs.w / world.W) * 0.95, 0.2, 0.9);
  const kMax = 1.7;
  const states = useMemo(() => Object.fromEntries(world.nodes.map((n) => [n.id, nodeState(n, store)])), [store]);
  const frontier = useMemo(() => Math.max(0, ...world.nodes.filter((n) => store.lit[n.id]).map((n) => n.i)), [store.lit]);

  const bound = useCallback(
    (nx, ny, nk) => {
      const W = world.W * nk;
      const H = world.H * nk;
      // Phones get extra slack at the bottom: the dossier sheet covers the lower part of the screen,
      // so a selected seal must be able to rise above it.
      const slack = vs.w < 768 ? vs.h * 0.6 : 60;
      const bx = W < vs.w ? [(vs.w - W) / 2, (vs.w - W) / 2] : [vs.w - W - 60, 60];
      const by = H + slack < vs.h ? [(vs.h - H) / 2, (vs.h - H) / 2] : [vs.h - H - slack, 60];
      return [clamp(nx, bx[0], bx[1]), clamp(ny, by[0], by[1])];
    },
    [vs],
  );

  const flyTo = useCallback(
    (id, { zoom, instant = false, duration = 1.1 } = {}) => {
      const n = world.byId[id];
      if (!n) return;
      const nk = clamp(zoom ?? k.get(), kMin, kMax);
      const wide = vs.w >= 768;
      const fx = wide && id === selected ? vs.w * 0.36 : vs.w * 0.5;
      const fy = wide ? vs.h * 0.5 : vs.h * 0.22;
      const [tx, ty] = bound(fx - n.x * nk, fy - n.y * nk, nk);
      const opts = instant ? { duration: 0 } : { duration, ease: [0.45, 0, 0.2, 1] };
      animate(k, nk, opts);
      animate(x, tx, opts);
      animate(y, ty, opts);
    },
    [vs, bound, k, x, y, kMin, selected],
  );

  const select = useCallback(
    (id) => {
      setSelected(id);
      setListOpen(false);
      ambience.sfx('page');
    },
    [],
  );

  useEffect(() => {
    if (selected) flyTo(selected);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => setVs({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // First view: the arrival ceremony if we came from a chapter's end, else the story's frontier.
  // Opens at the zoom that shows the whole width of the thread, so the ages are in view.
  useEffect(() => {
    const from = world.byId[query.from];
    const to = world.byId[query.arrive];
    const overview = clamp((vs.w / world.W) * 1.05, 0.3, 0.9);
    k.set(overview);
    if (from && to) {
      try {
        window.history.replaceState(null, '', '#/map');
      } catch {
        /* sandboxed hosts may refuse history changes; the ceremony still plays */
      }
      flyTo(from.id, { instant: true, zoom: overview });
      setArrival({ from: from.id, to: to.id, lit: false });
      const timers = [
        setTimeout(() => flyTo(to.id, { duration: 2.4 }), 500),
        setTimeout(() => {
          lightNode(to.id);
          ambience.sfx('ignite');
          setArrival((a) => a && { ...a, lit: true });
        }, 2700),
        setTimeout(() => setSelected(to.id), 3600),
      ];
      return () => timers.forEach(clearTimeout);
    }
    const last = store.last && world.nodes.find((n) => nodeScenes(n.id).some((s) => s.id === store.last));
    flyTo(last?.id || world.nodes[frontier]?.id || 'earth', { instant: true, zoom: overview });
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan (drag / wheel / trackpad), zoom (ctrl+wheel / pinch / buttons).
  useEffect(() => {
    const el = viewport.current;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const nk = clamp(k.get() * Math.exp(-e.deltaY * 0.0022), kMin, kMax);
        const f = nk / k.get();
        const [tx, ty] = bound(e.clientX - (e.clientX - x.get()) * f, e.clientY - (e.clientY - y.get()) * f, nk);
        k.set(nk);
        x.set(tx);
        y.set(ty);
      } else {
        const [tx, ty] = bound(x.get() - e.deltaX - e.deltaY, y.get() - (e.shiftKey ? e.deltaY : 0), k.get());
        x.set(tx);
        y.set(ty);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [bound, k, x, y, kMin]);

  const onPointerDown = (e) => {
    if (e.target.closest?.('.map-node')) return;
    const d = drag.current;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    d.start = { x: x.get(), y: y.get(), k: k.get(), px: e.clientX, py: e.clientY, dist: null, moved: false };
    if (d.pointers.size === 2) {
      const [a, b] = [...d.pointers.values()];
      d.start.dist = Math.hypot(a.x - b.x, a.y - b.y);
      d.start.mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.pointers.has(e.pointerId)) return;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = d.start;
    if (d.pointers.size === 2 && s.dist) {
      const [a, b] = [...d.pointers.values()];
      const nk = clamp(s.k * (Math.hypot(a.x - b.x, a.y - b.y) / s.dist), kMin, kMax);
      const f = nk / s.k;
      const [tx, ty] = bound(s.mid.x - (s.mid.x - s.x) * f, s.mid.y - (s.mid.y - s.y) * f, nk);
      k.set(nk);
      x.set(tx);
      y.set(ty);
    } else {
      const dx = e.clientX - s.px;
      const dy = e.clientY - s.py;
      if (Math.abs(dx) + Math.abs(dy) > 4) s.moved = true;
      const [tx, ty] = bound(s.x + dx, s.y + dy, k.get());
      x.set(tx);
      y.set(ty);
    }
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    d.pointers.delete(e.pointerId);
    if (d.pointers.size === 0 && d.start && !d.start.moved) setSelected(null);
    if (d.pointers.size === 1) {
      const [p] = [...d.pointers.values()];
      d.start = { x: x.get(), y: y.get(), k: k.get(), px: p.x, py: p.y, moved: true };
    }
  };

  const zoomBy = (f) => {
    const nk = clamp(k.get() * f, kMin, kMax);
    const cx = vs.w / 2;
    const cy = vs.h / 2;
    const [tx, ty] = bound(cx - (cx - x.get()) * (nk / k.get()), cy - (cy - y.get()) * (nk / k.get()), nk);
    animate(k, nk, { duration: 0.35 });
    animate(x, tx, { duration: 0.35 });
    animate(y, ty, { duration: 0.35 });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = world.nodes.findIndex((n) => n.id === selected);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const ni = clamp((idx < 0 ? frontier : idx) + (e.key === 'ArrowRight' ? 1 : -1), 0, world.nodes.length - 1);
        select(world.nodes[ni].id);
      } else if (e.key === '+' || e.key === '=') zoomBy(1.25);
      else if (e.key === '-') zoomBy(0.8);
      else if (e.key === 'Escape') {
        if (listOpen) setListOpen(false);
        else if (selected) setSelected(null);
        else go('/');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const sel = selected && world.byId[selected];
  const arrivalSeg = arrival && world.segs.find((s) => s.from === arrival.from && s.to === arrival.to);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a140e]">
      <div
        ref={viewport}
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div className="parchment absolute left-0 top-0 origin-top-left" style={{ width: world.W, height: world.H, transform }}>
          <svg width={world.W} height={world.H} viewBox={`0 0 ${world.W} ${world.H}`} className="absolute inset-0" role="group" aria-label="Campaign map of the timeline">
            <defs>
              <radialGradient id="bronze" cx="0.38" cy="0.32" r="0.8">
                <stop offset="0" stopColor="#f3d48b" />
                <stop offset="0.55" stopColor="#b8862b" />
                <stop offset="1" stopColor="#6b4a17" />
              </radialGradient>
              <radialGradient id="halo">
                <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.85" />
                <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="fog">
                <stop offset="0" stopColor="#efe2c4" stopOpacity="0.9" />
                <stop offset="1" stopColor="#efe2c4" stopOpacity="0" />
              </radialGradient>
            </defs>
            <Terrain />

            {world.segs.map((s) => {
              const done = store.lit[s.from] && store.lit[s.to];
              return done ? (
                <g key={`${s.from}-${s.to}`}>
                  <path d={s.d} fill="none" stroke="#2a1d12" strokeWidth="6" strokeLinecap="round" />
                  <path d={s.d} fill="none" stroke="#c9993f" strokeWidth="2" strokeLinecap="round" />
                </g>
              ) : (
                <path key={`${s.from}-${s.to}`} d={s.d} fill="none" stroke="#5a4630" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" opacity="0.6" />
              );
            })}
            {arrivalSeg && (
              <g>
                <motion.path d={arrivalSeg.d} fill="none" stroke="#2a1d12" strokeWidth="6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: 0.5, ease: 'easeInOut' }} />
                <motion.path d={arrivalSeg.d} fill="none" stroke="#f3d48b" strokeWidth="2.4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: 0.5, ease: 'easeInOut' }} />
              </g>
            )}

            {world.nodes
              .filter((n) => n.i > frontier + 1)
              .map((n) => (
                <ellipse key={`fog-${n.id}`} cx={n.x} cy={n.y} rx="150" ry="118" fill="url(#fog)" opacity="0.75" />
              ))}

            {world.nodes.map((n) => (
              <MapNode key={n.id} n={n} st={states[n.id]} selected={selected === n.id} igniting={arrival?.lit && arrival.to === n.id} onSelect={select} />
            ))}
          </svg>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 160px 40px rgb(20 13 7 / .75)' }} />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-5">
        <button type="button" className="hud-btn pointer-events-auto" onClick={() => go('/')} aria-label="Home">
          <Icon name="pyramid" className="h-5 w-5" />
          <span className="hidden sm:inline">Pyramid</span>
        </button>
        <div className="parchment cartouche pointer-events-none hidden px-6 py-2 text-center md:block">
          <div className="caps text-[0.58rem] text-ink-soft">The campaign map</div>
          <div className="font-display text-[1rem] font-semibold text-ink">The Chronicle of the Trust</div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" className="hud-btn" aria-pressed={listOpen} onClick={() => setListOpen((o) => !o)} aria-label="All events as a list">
            <Icon name="list" className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Zoom + the rail of time */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex flex-col gap-2">
          <button type="button" className="hud-btn icon" onClick={() => zoomBy(1.25)} aria-label="Zoom in (+)">
            <Icon name="plus" className="h-4 w-4" />
          </button>
          <button type="button" className="hud-btn icon" onClick={() => zoomBy(0.8)} aria-label="Zoom out (−)">
            <Icon name="minus" className="h-4 w-4" />
          </button>
          <button type="button" className="hud-btn icon" onClick={() => flyTo(world.nodes[frontier].id)} aria-label="Back to where the story has reached">
            <Icon name="target" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* The rail of time: the five eras, top to bottom, tappable. It reads downward
          like the thread itself, where the compass used to point. */}
      <nav
        className={`pointer-events-auto absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-1.5 transition-opacity sm:right-4 ${sel ? 'opacity-0 sm:opacity-0' : 'opacity-100'}`}
        aria-label="Eras"
      >
        {world.regions.map((g) => {
          const here = world.byId[g.first];
          const active = sel && here && world.byId[sel].era === g.id;
          return (
            <button
              key={g.id}
              type="button"
              className="hud-btn !text-[0.62rem]"
              aria-current={active ? 'true' : undefined}
              onClick={() => flyTo(g.first, { zoom: k.get() })}
            >
              <span className="hidden sm:inline">{g.title}</span>
              <span className="sm:hidden">{g.title.slice(0, 4)}</span>
            </button>
          );
        })}
      </nav>

      <AnimatePresence>{sel && <Dossier n={sel} st={states[sel.id]} seen={store.seen} onClose={() => setSelected(null)} />}</AnimatePresence>

      <AnimatePresence>
        {listOpen && (
          <motion.div key="list" className="parchment ruled cartouche thin-scroll absolute bottom-3 left-3 right-3 top-20 z-40 overflow-y-auto p-6 sm:left-6 sm:right-auto sm:w-[380px]" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} role="dialog" aria-label="All events">
            {timeline.eras.map((e) => (
              <section key={e.id} className="mb-4">
                <h3 className="caps mb-1 text-[0.62rem] text-ink-soft">{e.title}</h3>
                <ul>
                  {world.nodes
                    .filter((n) => n.era === e.id)
                    .map((n) => {
                      const st = states[n.id];
                      return (
                        <li key={n.id}>
                          <button type="button" className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-black/5" onClick={() => select(n.id)}>
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.complete ? 'bg-[#b8862b]' : st.ready ? 'border-2 border-[#b8862b]' : 'bg-[#bfae8a]'}`} />
                            <span className="flex-1 font-body text-[1.05rem] leading-tight text-ink">{n.title}</span>
                            <span className="caps text-[0.52rem] text-ink-soft">{st.ready ? `${st.seen}/${st.scenes.length}` : 'soon'}</span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
