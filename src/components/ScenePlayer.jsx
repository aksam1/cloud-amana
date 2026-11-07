import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import { Stage, useCamera } from './Stage.jsx';
import { VerseCaption } from './Captions.jsx';
import { Chronicle } from './Chronicle.jsx';
import { Icon, SourceBadge } from './Ornaments.jsx';
import { Toast, useToast } from './Toast.jsx';
import { BridgeCard } from './Bridge.jsx';
import { cameraAt, chapterByNumber, chapterScenes, nextNodeId, nextScene, nodeById, prevScene, sceneById, verseArabic } from '../lib/story.js';
import { captionHoldMs } from '../lib/pacing.js';
import { ambience } from '../lib/audio.js';
import { lightNode, markSeen, setLast, setPref, useStore } from '../lib/store.js';
import { inMode, useMode } from '../lib/words.js';
import { unitForChapter, unitStatus } from '../lib/pyramid.js';
import { lessonAfter, lessonKey, watchForAt } from '../lib/lessons.js';
import { go } from '../lib/router.js';
import { roman } from '../lib/geo.js';

// WebGL scenes load their renderer (Three.js) only when one is played.
const GLStage = lazy(() => import('../gl/GLStage.jsx'));

const EASE = { inOut: [0.45, 0, 0.25, 1], out: [0.15, 0.6, 0.3, 1], in: [0.6, 0, 0.9, 0.5], linear: 'linear' };
const TITLE_MS = 2800;
const WATCH_MS = 6500; // long enough to read the question to watch for

export default function ScenePlayer({ id, beat, still = false, moment, back, until }) {
  const scene = sceneById[id];
  if (!scene) {
    return (
      <div className="parchment-night grid h-full place-items-center p-6 text-center">
        <div>
          <p className="font-display text-xl text-gold-hi">This page of the chronicle is missing.</p>
          <p className="mt-2 font-body text-lg text-ivory/80">No scene is called “{id}”.</p>
          <button type="button" className="btn-gold mt-6" onClick={() => go('/map')}>
            Back to the map
          </button>
        </div>
      </div>
    );
  }
  const start = Math.min(scene.beats.length - 1, Math.max(0, parseInt(beat, 10) || 0));
  return <Player scene={scene} start={start} still={still} moment={moment} back={back} until={until} />;
}

/*
 * Player state machine
 *   playing ──beat timer──▶ next beat … last beat ──▶ ended (rest on final frame, Continue offered)
 *   playing ◀──Play/Pause──▶ paused        (timer frozen; ambient motion keeps breathing)
 *   any ──Next──▶ next beat (skip) · on ended ──Next──▶ next scene or map interlude
 *   any ──Prev──▶ previous beat · at beat 0 ──▶ previous scene
 *   reading the full ayat (or the help sheet) freezes the timer without changing play state.
 */
/*
 * `still` (#/scene/<id>?beat=n&still) holds one moment for review: paused, no title card, the camera
 * already where that beat ends; `moment` (&t=0–1) holds a WebGL scene's walks and moves part way through.
 */
function Player({ scene, start = 0, still = false, moment, back, until }) {
  const prefs = useStore((s) => s.prefs);
  const reduced = useReducedMotion();
  const cam = useCamera();
  const [beat, setBeat] = useState(start);
  const [playing, setPlaying] = useState(!still);
  const [ended, setEnded] = useState(false);
  const [titleCard, setTitleCard] = useState(!still);
  // the page between stories opens a chapter's first scene (not a still, not a scene entered part way)
  const [bridge, setBridge] = useState(() => !still && start === 0 && !!chapterByNumber[scene.chapter]?.bridge && chapterScenes(scene.chapter)[0]?.id === scene.id);
  const [ayahOpen, setAyahOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [dock, setDock] = useState(0); // how far up the screen the chronicle reaches
  const [toast, showToast] = useToast();
  const swipe = useRef(null);
  const wheelAt = useRef(0);

  const beats = scene.beats;
  const last = beats.length - 1;
  const b = beats[beat];
  const chapter = chapterByNumber[scene.chapter];
  // Scenes are numbered through the whole story (chapter 2 opens at XIX), so show the chapter's last number.
  const total = chapterScenes(scene.chapter).at(-1)?.order ?? scene.order;
  const next = nextScene(scene.id);
  // while this scene plays, the next WebGL scene paints its opening cards in the background
  useEffect(() => {
    if (still || next?.renderer !== 'gl') return undefined;
    const t = setTimeout(() => import('../gl/GLStage.jsx').then((m) => m.prepaint(next)), 5000);
    return () => clearTimeout(t);
  }, [next, still]);
  const prev = prevScene(scene.id);
  // a part that has a lesson opens with the question to watch for (on the bridge page for a chapter's first part)
  const watchFor = still || start !== 0 ? null : watchForAt(scene);
  const learned = useStore((s) => s.learned);

  const durations = useMemo(
    () => beats.map((bt) => Math.max(bt.dur ?? 6000, captionHoldMs({ en: bt.verse?.en || '', ar: bt.verse ? verseArabic(bt.verse) : '', say: bt.say || '' }))),
    [beats],
  );

  useEffect(() => {
    const c0 = cameraAt(scene, still ? start + 1 : start);
    cam.x.set(c0.x);
    cam.y.set(c0.y);
    cam.z.set(c0.z);
    cam.r.set(c0.r);
    if (!back) setLast(scene.id, scene.title); // a scene replayed from a lesson is not where the reader left the story
    lightNode(scene.node);
    if (bridge) return undefined;
    const t = setTimeout(() => setTitleCard(false), watchFor ? WATCH_MS : TITLE_MS);
    return () => clearTimeout(t);
  }, [scene, cam, start, still, bridge, watchFor]);

  // Camera: each beat glides (or cuts) to its framing; skipping ahead interrupts and re-aims.
  useEffect(() => {
    const c = b.cam;
    if (!c) return undefined;
    const opts = c.cut || reduced || still ? { duration: 0 } : { duration: (c.dur ?? durations[beat]) / 1000, ease: EASE[c.ease || 'inOut'] };
    const runs = ['x', 'y', 'z', 'r'].filter((k) => c[k] !== undefined).map((k) => animate(cam[k], c[k], opts));
    return () => runs.forEach((r) => r.stop());
  }, [b, beat, cam, durations, reduced, still]);

  // Sound cues: "sfx": "thunder" | ["a", { "name": "b", "at": 900 }]; "sfxAt" delays plain names.
  useEffect(() => {
    ambience.setBeds(b.ambient ?? scene.ambient ?? []);
    const timers = [].concat(b.sfx || []).map((s) => {
      const name = typeof s === 'string' ? s : s.name;
      const at = typeof s === 'string' ? (b.sfxAt ?? 0) : (s.at ?? 0);
      return setTimeout(() => ambience.sfx(name), at);
    });
    return () => timers.forEach(clearTimeout);
  }, [b, scene]);

  useEffect(() => {
    const onVis = () => document.hidden && setPlaying(false);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const finish = useCallback(() => {
    setEnded(true);
    markSeen(scene.id);
  }, [scene.id]);

  const onBeatTimer = useCallback(() => {
    if (beat < last) setBeat(beat + 1);
    else finish();
  }, [beat, last, finish]);

  const continueOn = useCallback(() => {
    markSeen(scene.id);
    // played from a lesson or a pyramid unit: go back there, at once or (with ?until=<scene>) once that
    // scene has played, carrying the way back along through the scenes between
    if (back) {
      if (!until || scene.id === until || !next) return go(back);
      return go(`/scene/${next.id}?back=${encodeURIComponent(back)}&until=${until}`);
    }
    const crossesNode = !next || next.node !== scene.node;
    const target = scene.then === 'map' || !next ? `/map?from=${scene.node}&arrive=${crossesNode && next ? next.node : nextNodeId(scene.node)}` : `/scene/${next.id}`;
    // the end of a part with a lesson goes to the lesson first; the lesson then continues to `target`
    const part = lessonAfter(scene);
    if (part !== null && !learned[lessonKey(scene.chapter, part)]) go(`/lesson/${scene.chapter}/${part}?then=${encodeURIComponent(target)}`);
    else go(target);
  }, [scene, next, back, until, learned]);

  // A part's last scene flows straight into the map ("the camera pulls back into the campaign map")
  // when the viewer is watching hands-free; in manual mode the Continue button waits for them.
  useEffect(() => {
    if (!ended || scene.then !== 'map' || !prefs.auto) return undefined;
    const t = setTimeout(continueOn, 700);
    return () => clearTimeout(t);
  }, [ended, scene.then, prefs.auto, continueOn]);

  const goNext = useCallback(() => {
    if (ended) continueOn();
    else if (beat < last) setBeat(beat + 1);
    else finish();
  }, [ended, beat, last, continueOn, finish]);

  const goPrev = useCallback(() => {
    if (ended) setEnded(false);
    if (beat > 0) setBeat(beat - 1);
    else if (prev) go(`/scene/${prev.id}`);
  }, [ended, beat, prev]);

  const toggleSound = useCallback(() => {
    const on = !prefs.sound;
    setPref('sound', on);
    ambience.setEnabled(on);
    showToast(on ? 'Ambient sound on: wind, fire and water. No music.' : 'Sound off');
  }, [prefs.sound, showToast]);

  const toggleAuto = useCallback(() => {
    setPref('auto', !prefs.auto);
    showToast(prefs.auto ? 'Manual: tap or press → for each moment' : 'Auto-advance on');
  }, [prefs.auto, showToast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onButton = e.target.closest?.('button, a, [role="button"]');
      if (help && e.key !== '?') {
        if (e.key === 'Escape') setHelp(false);
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case ' ':
        case 'Enter':
          if (onButton) return;
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'p':
        case 'P':
        case 'k':
        case 'K':
          setPlaying((p) => !p);
          break;
        case 'a':
        case 'A':
          if (!prefs.chronicle) setPref('chronicle', true);
          setAyahOpen((o) => !o);
          break;
        case 's':
        case 'S':
          toggleSound();
          break;
        case 'm':
        case 'M':
          go('/map');
          break;
        case 'Escape':
          if (ayahOpen) setAyahOpen(false);
          else go('/map');
          break;
        case '?':
          setHelp((h) => !h);
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, help, ayahOpen, prefs.chronicle, toggleSound]);

  const { mode } = useMode();
  const lines = useMemo(() => beats.slice(0, beat + 1).filter((bt) => bt.say).map((bt) => inMode(bt.say, mode)), [beats, beat, mode]);
  const frozen = !playing || ayahOpen || help || bridge;
  const relatedUnit = !back && (!next || next.chapter !== scene.chapter) ? unitForChapter(scene.chapter) : null;
  const related = relatedUnit && unitStatus(relatedUnit.id) === 'ready' ? relatedUnit : null; // only units with a lesson path yet
  const nextLabel = back ? (until && scene.id !== until && next ? `${roman(next.order)}. ${next.title}` : 'Back to the lesson') : scene.then === 'map' || !next ? `To the map: ${nodeById[next && next.node !== scene.node ? next.node : nextNodeId(scene.node)]?.title ?? 'onward'}` : `${roman(next.order)}. ${next.title}`;

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-night">
      {scene.renderer === 'gl' ? (
        // while the 3D renderer loads, the scene's own haze rather than the black behind it
        <Suspense fallback={<div className="absolute inset-0" style={{ background: scene.world?.fog || scene.base || '#07060a' }} />}>
          <GLStage scene={scene} beat={beat} start={start} still={still} moment={moment === undefined ? 1 : Number(moment)} reduced={reduced} durations={durations} />
        </Suspense>
      ) : (
        <Stage scene={scene} beat={beat} cam={cam} reduced={reduced} />
      )}

      {/* Tap / swipe / wheel surface: the whole picture is a "next" button, with visible buttons as the alternative. */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y)) (dx < 0 ? goNext : goPrev)();
          else if (Math.abs(dx) < 8 && Math.abs(e.clientY - s.y) < 8) goNext();
        }}
        onWheel={(e) => {
          const now = performance.now();
          if (Math.abs(e.deltaY) < 40 || now - wheelAt.current < 1100) return;
          wheelAt.current = now;
          (e.deltaY > 0 ? goNext : goPrev)();
        }}
        aria-hidden="true"
      />

      <AnimatePresence>{bridge && <BridgeCard chapter={chapter} watchFor={watchFor} onBegin={() => setBridge(false)} />}</AnimatePresence>

      <AnimatePresence>
        {titleCard && !bridge && (
          <motion.div key="title" className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1.1 } }}>
            <div className="text-center" style={{ textShadow: '0 2px 24px rgb(0 0 0 / .9)' }}>
              <div className="caps text-[0.66rem] text-gold/85">
                Chapter {roman(chapter?.number || 1)} · {chapter?.title}
              </div>
              <div className="caps mt-2 text-[0.8rem] text-gold-hi">Scene {roman(scene.order)}</div>
              <div lang="ar" className="ruqaa ink-reveal gold-text mt-1 text-[clamp(40px,6.4vw,92px)] leading-[1.35]" style={{ '--dur': '2s' }}>
                {scene.arabic}
              </div>
              <h1 className="font-display text-[clamp(20px,2.7vw,36px)] leading-tight text-ivory">{scene.title}</h1>
              <div className="mt-4 flex justify-center">
                <SourceBadge source={scene.source} />
              </div>
              {scene.source === 'tradition' && <p className="mt-2 font-body text-[1rem] italic text-ivory/80">Based on hadith and classical narrations, not the Quran.</p>}
              {watchFor && (
                <p className="mx-auto mt-5 max-w-[46ch] font-body text-[1.1rem] leading-snug text-ivory">
                  <span className="caps mr-2 text-[0.62rem] text-gold-hi">Watch for</span>
                  {inMode(watchFor, mode)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">{!titleCard && b.verse && <VerseCaption key={`${scene.id}-${beat}`} verse={b.verse} tone={scene.captions} dock={dock} pen={!!scene.pen} />}</AnimatePresence>

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex items-center gap-3">
          <button type="button" className="hud-btn" onClick={() => go('/map')} aria-label="Campaign map (M)">
            <Icon name="map" className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </button>
          <div className="hidden leading-tight sm:block" style={{ textShadow: '0 1px 8px #000' }}>
            <div className="caps text-[0.6rem] text-gold/80">
              Chapter {roman(chapter?.number || 1)} · {chapter?.title}
            </div>
            <div className="font-display text-[0.86rem] text-ivory">
              {roman(scene.order)} <span className="text-ivory/50">/ {roman(total)}</span> · {scene.title}
            </div>
          </div>
          <div className="caps text-[0.66rem] text-ivory/80 sm:hidden" style={{ textShadow: '0 1px 8px #000' }}>
            {roman(scene.order)} / {roman(total)}
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button type="button" className="hud-btn icon" aria-pressed={prefs.auto} onClick={toggleAuto} aria-label={prefs.auto ? 'Auto-advance is on' : 'Auto-advance is off'} title="Auto-advance">
            <Icon name="auto" className="h-[18px] w-[18px]" />
          </button>
          <button type="button" className="hud-btn icon" aria-pressed={prefs.sound} onClick={toggleSound} aria-label={prefs.sound ? 'Turn ambient sound off (S)' : 'Turn ambient sound on (S)'} title="Ambient sound">
            <Icon name={prefs.sound ? 'soundOn' : 'soundOff'} className="h-[18px] w-[18px]" />
          </button>
          <button type="button" className="hud-btn icon hidden sm:inline-flex" onClick={() => setHelp(true)} aria-label="Keyboard shortcuts (?)">
            <Icon name="help" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <Chronicle scene={scene} lines={ended ? lines : lines.slice(-1)} open={prefs.chronicle} onToggle={() => setPref('chronicle', !prefs.chronicle)} ayahOpen={ayahOpen} onAyah={() => setAyahOpen((o) => !o)} onTop={setDock} />

      {/* Transport */}
      <div className="pointer-events-none absolute bottom-0 right-0 z-30 flex w-full flex-col items-stretch gap-2 p-3 sm:w-auto sm:items-end sm:p-6">
        <AnimatePresence>
          {ended && (
            <motion.button key="continue" type="button" className="btn-gold pointer-events-auto self-end" onClick={continueOn} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} autoFocus>
              <span className="max-w-[62vw] truncate sm:max-w-[340px]">{nextLabel}</span>
              <Icon name="next" className="h-4 w-4" />
            </motion.button>
          )}
          {ended && related && (
            <motion.button key="related" type="button" className="hud-btn pointer-events-auto self-end" onClick={() => go(`/unit/${related.id}`)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="max-w-[62vw] truncate sm:max-w-[340px]">
                The pyramid: {related.title} · {related.english}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
        <div className="pointer-events-auto flex items-center justify-between gap-1 rounded-full border border-gold/25 bg-black/45 px-2 py-1.5 backdrop-blur-md sm:justify-end sm:gap-3">
          <button type="button" className="hud-btn icon border-transparent bg-transparent" onClick={goPrev} disabled={beat === 0 && !prev} aria-label="Previous moment (←)">
            <Icon name="prev" className="h-4 w-4" />
          </button>
          {/* On a phone, long scenes squeeze their marks to fit instead of pushing the buttons off screen. */}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1 sm:flex-none sm:gap-1.5" role="group" aria-label="Moments in this scene">
            {beats.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setBeat(i);
                  setEnded(false);
                }}
                className="group grid h-8 w-4 min-w-[7px] shrink place-items-center" aria-label={`Moment ${i + 1} of ${beats.length}`} aria-current={i === beat ? 'step' : undefined}>
                <span className={`relative block h-1.5 overflow-hidden rounded-full transition-all ${i === beat ? 'w-full bg-gold/30' : i < beat || ended ? 'w-1.5 bg-gold' : 'w-1.5 bg-ivory/30 group-hover:bg-ivory/60'}`}>
                  {i === beat && prefs.auto && !ended && (
                    <span
                      key={`${scene.id}-${beat}`}
                      className="beat-progress absolute inset-0 bg-gold"
                      style={{ animationDuration: `${durations[beat]}ms`, animationPlayState: frozen ? 'paused' : 'running' }}
                      onAnimationEnd={onBeatTimer}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="hud-btn icon border-transparent bg-transparent" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause (P)' : 'Play (P)'} disabled={!prefs.auto || ended}>
            <Icon name={playing ? 'pause' : 'play'} className="h-4 w-4" />
          </button>
          <button type="button" className={`hud-btn icon border-transparent bg-transparent ${!prefs.auto && !ended ? 'text-gold-hi' : ''}`} onClick={goNext} aria-label={ended ? 'Continue' : 'Next moment (→)'}>
            <Icon name="next" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {help && (
          <motion.div key="help" className="absolute inset-0 z-50 grid place-items-center bg-black/55 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHelp(false)}>
            <div className="parchment ruled cartouche w-[min(92vw,420px)] p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
              <h2 className="font-display text-lg font-semibold text-ink">Moving through the story</h2>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-body text-[1.05rem] text-ink">
                {[
                  ['→  Space  Click', 'next moment'],
                  ['←', 'previous moment'],
                  ['P', 'pause or play'],
                  ['A', 'read the full ayat'],
                  ['S', 'ambient sound'],
                  ['M  Esc', 'campaign map'],
                  ['Swipe', 'next or previous (touch)'],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="caps text-[0.68rem] leading-7 text-ink-soft">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" className="btn-ink mt-5" onClick={() => setHelp(false)}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast} />
    </div>
  );
}
