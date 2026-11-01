import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, useCamera } from './Stage.jsx';
import { cameraAt, chapterByNumber, chapterScenes, sceneById, verseArabic } from '../lib/story.js';
import { roman } from '../lib/geo.js';

const GLStage = lazy(() => import('../gl/GLStage.jsx'));

/*
 * Contact sheet for reviewing compositions: every beat of a chapter (#/sheet/4) or of one scene
 * (#/sheet/<sceneId>), each held where its camera move ends. Outlines show where the chronicle and a
 * lower-third verse will sit on the chosen device (?device=phone; desktop 1024×768 by default), so a
 * subject hiding under the panels is visible at a glance. Tiles mount only while on screen.
 */
const DEVICES = {
  desk: { w: 1024, h: 768, tile: 360 },
  phone: { w: 390, h: 844, tile: 180 },
};

/** Rough panel boxes in device pixels, from the amount of text (a guide, not a measurement). */
function zones(scene, beat, device) {
  const d = DEVICES[device];
  const say = scene.beats.slice(0, beat + 1).findLast((bt) => bt.say)?.say ?? '';
  const v = scene.beats[beat].verse;
  const out = [];
  const phone = device === 'phone';
  const sayLines = Math.ceil(say.length / (phone ? 34 : 42));
  const chronicleH = (phone ? 170 : 150) + sayLines * 24 + (scene.title.length > 22 ? 28 : 0);
  out.push(phone ? { name: 'chronicle', x: 12, y: d.h - 96 - chronicleH, w: d.w - 24, h: chronicleH } : { name: 'chronicle', x: 24, y: d.h - 24 - chronicleH, w: 400, h: chronicleH });
  const pending = scene.beats[beat].pendingVerse;
  if (!v && pending && !phone) {
    // not fetched yet: a medium verse's panel, so its framing can be judged before the words arrive
    const h = 275;
    out.push(pending.place === 'lower' ? { name: 'verse', x: 448, y: d.h - 150 - h, w: 552, h } : { name: 'verse', x: 72, y: d.h * 0.13, w: 880, h });
  }
  if (v) {
    const ar = verseArabic(v);
    const width = phone ? d.w * 0.92 - 32 : 552;
    const arSize = phone ? 22 : 24.6;
    const arLines = Math.ceil((ar.length * arSize * 0.42) / (width - 80));
    const enLines = Math.ceil((v.en.length * 17 * 0.47) / (width - 80));
    const h = 44 + arLines * arSize * 1.9 + enLines * 23 + 22;
    const lower = v.place === 'lower';
    if (phone) out.push({ name: 'verse', x: d.w * 0.04, y: lower ? d.h * 0.11 : d.h * 0.11, w: d.w * 0.92, h });
    else if (lower) out.push({ name: 'verse', x: 448, y: d.h - 150 - h, w: 552, h });
    else out.push({ name: 'verse', x: (d.w - Math.min(d.w * 0.92, 880)) / 2, y: d.h * 0.13, w: Math.min(d.w * 0.92, 880), h });
  }
  return out;
}

function useInView(ref) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: '300px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref]);
  return seen;
}

function Tile({ scene, beat, device }) {
  const d = DEVICES[device];
  const box = useRef(null);
  const visible = useInView(box);
  const cam = useCamera();
  const end = useMemo(() => cameraAt(scene, beat + 1), [scene, beat]);
  useEffect(() => {
    cam.x.set(end.x);
    cam.y.set(end.y);
    cam.z.set(end.z);
    cam.r.set(end.r);
  }, [cam, end]);
  const bt = scene.beats[beat];
  const tileH = (d.tile * d.h) / d.w;
  return (
    <figure className="m-0 flex flex-col gap-1">
      <div ref={box} className="relative overflow-hidden rounded border border-gold/30 bg-black" style={{ width: d.tile, height: tileH }}>
        {visible &&
          (scene.renderer === 'gl' ? (
            <Suspense fallback={null}>
              <GLStage scene={scene} beat={beat} still />
            </Suspense>
          ) : (
            <Stage scene={scene} beat={beat} cam={cam} reduced={false} />
          ))}
        {zones(scene, beat, device).map((z) => (
          <div key={z.name} className="pointer-events-none absolute border border-dashed" style={{ left: `${(z.x / d.w) * 100}%`, top: `${(z.y / d.h) * 100}%`, width: `${(z.w / d.w) * 100}%`, height: `${(z.h / d.h) * 100}%`, borderColor: z.name === 'verse' ? '#7fd3ff' : '#ffcf7f', background: z.name === 'verse' ? 'rgb(127 211 255 / .12)' : 'rgb(255 207 127 / .12)' }} />
        ))}
        <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 font-mono text-[10px] text-ivory">{beat}</div>
      </div>
      <figcaption className="max-w-full font-body text-[12px] leading-tight text-ivory/80" style={{ width: d.tile }}>
        {(bt.dur ?? 6000) / 1000}s{bt.verse ? ` · ${bt.verse.ref}` : ''}
        {bt.say ? ` · ${bt.say}` : ''}
      </figcaption>
    </figure>
  );
}

export default function Sheet({ id, device = 'desk' }) {
  const dev = DEVICES[device] ? device : 'desk';
  const chapterNo = /^\d+$/.test(id) ? +id : null;
  const scenes = chapterNo ? chapterScenes(chapterNo) : [sceneById[id]].filter(Boolean);
  const chapter = chapterByNumber[chapterNo ?? scenes[0]?.chapter];
  return (
    <div className="parchment-night thin-scroll h-full overflow-y-auto p-6">
      <header className="mb-6 flex flex-wrap items-baseline gap-4">
        <h1 className="font-display text-xl text-gold-hi">{chapter ? `Chapter ${roman(chapter.number)} · ${chapter.title}` : 'Contact sheet'}</h1>
        <a className="caps text-xs text-ivory/70 underline" href={`#/sheet/${id}`}>Desktop</a>
        <a className="caps text-xs text-ivory/70 underline" href={`#/sheet/${id}?device=phone`}>Phone</a>
        <span className="font-body text-sm text-ivory/60">Dashed boxes: chronicle (gold) and verse panel (blue), estimated from the text.</span>
      </header>
      {scenes.length === 0 && <p className="font-body text-ivory">Nothing to show for “{id}”.</p>}
      {scenes.map((s) => (
        <section key={s.id} className="mb-8">
          <h2 className="mb-2 font-display text-base text-ivory">
            <a href={`#/scene/${s.id}`} className="hover:text-gold-hi">
              {roman(s.order)} · {s.title}
            </a>
            <span className="ml-3 font-mono text-xs text-ivory/50">{s.id}</span>
          </h2>
          <div className="flex flex-wrap gap-4">
            {s.beats.map((_, i) => (
              <Tile key={i} scene={s} beat={i} device={dev} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
