import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { buildWorld } from '../lib/mapWorld.js';
import { chapterForNode, eraById, expandRef, ayah, nodeScenes, timeline } from '../lib/story.js';
import { lightNode, useStore } from '../lib/store.js';
import { go } from '../lib/router.js';
import { ambience } from '../lib/audio.js';
import { clamp, roman, smoothPath } from '../lib/geo.js';
import { Icon, Rule, starPath } from './Ornaments.jsx';

const world = buildWorld(timeline);
const ARABIC_FONT = '"Aref Ruqaa", Amiri, serif';

/** Static ink terrain. Memoised: it never changes, so pan and zoom only move a cached layer. */
const Terrain = memo(function Terrain() {
  const { W, H } = world;
  return (
    <g>
      <defs>
        <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3620" stopOpacity="0.62" />
          <stop offset="1" stopColor="#4a3620" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mtn-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a1410" stopOpacity="0.7" />
          <stop offset="1" stopColor="#3a1410" stopOpacity="0" />
        </linearGradient>
        {world.regions.map((g) => (
          <radialGradient key={g.id} id={`wash-${g.id}`}>
            <stop offset="0" stopColor={g.tone} stopOpacity="0.3" />
            <stop offset="0.7" stopColor={g.tone} stopOpacity="0.12" />
            <stop offset="1" stopColor={g.tone} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {world.regions.map((g) => (
        <ellipse key={g.id} cx={g.cx} cy={H / 2} rx={(g.x1 - g.x0) / 2 + 260} ry={H * 0.62} fill={`url(#wash-${g.id})`} />
      ))}

      {world.stars.map((s, i) => (
        <path key={i} d={starPath(4 * s.s, 0.35)} transform={`translate(${s.x.toFixed(0)} ${s.y.toFixed(0)})`} fill="#6b5428" opacity="0.55" />
      ))}
      {world.regions[0] && (
        <g opacity="0.35" fill="none" stroke="#6b5428">
          {Array.from({ length: 7 }, (_, i) => (
            <ellipse key={i} cx={world.regions[0].cx} cy={220} rx={200 + i * 46} ry={70 + i * 16} strokeWidth="1.2" />
          ))}
        </g>
      )}

      {world.rivers.map((pts, i) => (
        <g key={i}>
          <path d={smoothPath(pts)} fill="none" stroke="#6f8a92" strokeOpacity="0.38" strokeWidth="18" strokeLinecap="round" />
          <path d={smoothPath(pts)} fill="none" stroke="#3f5a66" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}

      {world.sea && (
        <g opacity="0.5" stroke="#3f5a66" fill="none" strokeWidth="1.6">
          <ellipse cx={world.sea.x} cy={world.sea.y} rx="230" ry="120" fill="#6f8a92" fillOpacity="0.18" stroke="none" />
          {Array.from({ length: 16 }, (_, i) => {
            const wx = world.sea.x - 160 + (i % 4) * 90 + (Math.floor(i / 4) % 2) * 40;
            const wy = world.sea.y - 70 + Math.floor(i / 4) * 40;
            return <path key={i} d={`M${wx},${wy} q12,-10 24,0 t24,0`} />;
          })}
        </g>
      )}

      {world.dunes.map((d, i) => (
        <path key={i} d={`M${(d.x - 24 * d.s).toFixed(0)},${d.y.toFixed(0)} q${24 * d.s},-${14 * d.s} ${48 * d.s},0`} fill="none" stroke="#8a6a3a" strokeOpacity="0.5" strokeWidth="1.4" />
      ))}

      {world.trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x.toFixed(0)} ${t.y.toFixed(0)}) scale(${t.s.toFixed(2)})`} opacity="0.7">
          <path d="M0,0 L0,-14" stroke="#3b2a18" strokeWidth="2" />
          <circle cx="0" cy="-22" r="11" fill="#4f5a2c" fillOpacity="0.55" stroke="#3b2a18" strokeWidth="1.2" />
        </g>
      ))}

      {world.palms.map((t, i) => (
        <g key={i} transform={`translate(${t.x.toFixed(0)} ${t.y.toFixed(0)}) scale(${t.s.toFixed(2)})`} stroke="#3b2a18" fill="none" strokeWidth="1.6" opacity="0.7">
          <path d="M0,0 Q3,-16 0,-30" />
          <path d="M0,-30 q-12,-4 -20,6 M0,-30 q12,-4 20,6 M0,-30 q-8,-10 -18,-8 M0,-30 q8,-10 18,-8" />
        </g>
      ))}

      {world.mountains.map((m, i) => (
        <g key={i} transform={`translate(${m.x.toFixed(0)} ${m.y.toFixed(0)}) scale(${m.s.toFixed(2)})`}>
          {m.v > 0 && <path d="M-6,0 C6,-16 18,-36 28,-44 C36,-30 46,-14 62,0 Z" fill={`url(#${m.dark ? 'mtn-dark' : 'mtn'})`} />}
          <path d="M-46,0 C-30,-20 -14,-52 0,-66 C10,-46 26,-22 48,0 Z" fill={`url(#${m.dark ? 'mtn-dark' : 'mtn'})`} />
          <path d="M-46,0 C-30,-20 -14,-52 0,-66 C10,-46 26,-22 48,0" fill="none" stroke={m.dark ? '#3a1410' : '#3b2a18'} strokeWidth="1.7" />
          <path d="M0,-66 C-4,-42 -10,-22 -19,0" fill="none" stroke="#3b2a18" strokeWidth="1" opacity="0.55" />
        </g>
      ))}

      {world.cracks.map((c, i) => (
        <path key={i} d={`M${c.x.toFixed(0)},${c.y.toFixed(0)} l${14 * c.s},${10 * c.s} l${-6 * c.s},${16 * c.s} l${18 * c.s},${8 * c.s} M${(c.x + 14 * c.s).toFixed(0)},${(c.y + 10 * c.s).toFixed(0)} l${16 * c.s},${-6 * c.s}`} fill="none" stroke="#5a1c14" strokeWidth="1.6" opacity="0.6" />
      ))}

      {world.regions.map((g) => (
        <g key={g.id} textAnchor="middle">
          <text x={g.cx} y={130} fontFamily="Cinzel, serif" fontSize="40" letterSpacing="10" fill="#3b2a18" opacity="0.8">
            {g.title.toUpperCase()}
          </text>
          <text x={g.cx} y={190} fontFamily={ARABIC_FONT} fontSize="40" fill="#6b4a22" opacity="0.75">
            {g.arabic}
          </text>
        </g>
      ))}

      <g transform={`translate(${W - 190} ${H - 190})`} opacity="0.65" fill="none" stroke="#3b2a18">
        <circle r="92" strokeWidth="1.4" />
        <circle r="70" strokeWidth="0.8" />
        <path d={starPath(84, 0.32)} strokeWidth="1.6" fill="#a5772f" fillOpacity="0.25" />
        <text y="-104" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="18" fill="#3b2a18" stroke="none">
          N
        </text>
      </g>
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
      <text y="-54" textAnchor="middle" fontFamily={ARABIC_FONT} fontSize="27" fill="#3b2a18">
        {n.arabic}
      </text>
      <text y="68" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="17" letterSpacing="2.5" fill="#24180e" fontWeight="600">
        {n.short.toUpperCase()}
      </text>
      {n.alt && (
        <text y="88" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="17" fontStyle="italic" fill="#4a3826">
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
      <div lang="ar" className="ruqaa mt-1 text-right text-[2.4rem] leading-tight text-[#6b4a22]">
        {n.arabic}
        {n.prophet && <span className="mr-2 align-middle text-[1rem] text-ink-soft">عليه السلام</span>}
      </div>
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
            {planned ? `This page of the chronicle will be painted in Chapter ${roman(planned.number)}, ${planned.title}.` : 'This page of the chronicle will be painted in a later chapter.'} The road is already drawn; the scenes are still to come.
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

  const kMin = clamp((vs.h / world.H) * 0.8, 0.3, 0.9);
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
  // Opens at an overview zoom (about a dozen seals across) so the road ahead is visible.
  useEffect(() => {
    const from = world.byId[query.from];
    const to = world.byId[query.arrive];
    const overview = clamp((vs.h / world.H) * 1.1, 0.45, 0.85);
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
                <ellipse key={`fog-${n.id}`} cx={n.x} cy={n.y} rx="190" ry="150" fill="url(#fog)" />
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
        <button type="button" className="hud-btn pointer-events-auto" onClick={() => go('/')} aria-label="Title screen">
          <svg viewBox="-50 -50 100 100" className="h-5 w-5" aria-hidden="true">
            <path d={starPath(44, 0.72)} fill="none" stroke="currentColor" strokeWidth="7" />
          </svg>
          <span className="hidden sm:inline">Amanah</span>
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

      {/* Zoom + era jumps */}
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
        <nav className={`pointer-events-auto -mb-1 flex max-w-[calc(100vw-90px)] gap-1.5 overflow-x-auto pb-1 thin-scroll ${sel ? 'hidden sm:flex' : 'flex'}`} aria-label="Eras">
          {timeline.eras.map((e) => {
            const firstNode = world.nodes.find((n) => n.era === e.id);
            return (
              <button key={e.id} type="button" className="hud-btn shrink-0 !text-[0.64rem]" onClick={() => flyTo(firstNode.id, { zoom: k.get() })}>
                {e.title}
              </button>
            );
          })}
        </nav>
      </div>

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
