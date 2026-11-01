// The WebGL stage for scenes with `"renderer": "gl"`: a true 3D space of painted cards the camera can move
// through, with people of light, crowds, particles, cloth and wind, finished by bloom, god-rays and an
// ink-wash pass. Writing and colour washes stay flat on the screen above it, drawn by the 2D stage.
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, GodRays } from '@react-three/postprocessing';
import { Color, Vector3 } from 'three';
import { Stage, useCamera } from '../components/Stage.jsx';
import { expandLayers, resolveLayer, visibleAt } from '../lib/story.js';
import { areaOf, captureLayer } from './capture.jsx';
import { CameraRig, changesSet } from './CameraRig.jsx';
import { Card, Cloth, Crowd, Dust, Light, Ribbons, Storm, Sun } from './elements.jsx';
import { InkWashEffect } from './InkWash.js';
import { FOV, R, place, shift } from './space.js';
import GL_TYPES from './types.json';

const NATIVE = { light: Light, crowd: Crowd, dust: Dust, ribbons: Ribbons, cloth: Cloth, storm: Storm };
// Layers that stay flat on the screen above the 3D world: writing, flashes, colour washes.
const OVERLAY = new Set(['calligraphy', 'lightning', 'tint', 'particles', 'inkdrop', 'guidance', 'jeers', 'numerals']);

/** The world for a beat: the scene's `world`, with each beat's `world` changes applied in turn. */
function worldAt(scene, beat) {
  const w = { fog: '#d8c4a8', fogNear: 2500, fogFar: 14000, light: 1, dof: 0, rays: 0.5, bloom: 0.8, haze: 0, hazeY: 0.55, shake: 1, cycle: null, ...scene.world };
  scene.beats.slice(0, beat + 1).forEach((b) => b.world && Object.assign(w, b.world));
  return w;
}

const scratch = new Color();

/**
 * Eases the shared environment toward the beat's world (at once when the stage dissolved to it), keeps the
 * sun's direction for the dust, and clears the frame to the haze colour, so any gap between painted cards
 * reads as distance rather than as a black hole.
 */
function Env({ target, env, sun, beat }) {
  useFrame(({ camera, clock, scene }, dt) => {
    const e = env.current;
    const snap = e.still || e.snapBeat === beat;
    const k = snap ? 1 : Math.min(1, dt * 0.9);
    e.fogColor.lerp(scratch.set(target.fog), k);
    e.fogNear += (target.fogNear - e.fogNear) * k;
    e.fogFar += (target.fogFar - e.fogFar) * k;
    e.dof += (target.dof - e.dof) * k;
    let light = target.light;
    // `cycle` {period, min}: day and night flickering past, as in a storm that lasts for days. It starts
    // at full day when it begins, so numerals counting the days can keep time with it.
    if (target.cycle) {
      e.cycleStart ??= clock.elapsedTime;
      light *= target.cycle.min + (1 - target.cycle.min) * (0.5 + 0.5 * Math.cos(((clock.elapsedTime - e.cycleStart) / target.cycle.period) * Math.PI * 2));
    } else e.cycleStart = null;
    e.light += (light - e.light) * (snap ? 1 : Math.min(1, dt * (target.cycle ? 8 : 0.9)));
    if (sun) e.sunDir.set(...shift(place(sun.pos ?? [1100, 300, -6000]), sun)).applyMatrix4(camera.matrixWorldInverse).normalize();
    if (scene.background?.isColor) scene.background.copy(e.fogColor);
  });
  return null;
}

/**
 * Holds the stage hidden until its paintings are in and every shader has finished compiling (browsers
 * compile them in the background and draw nothing with an unfinished one), so it never fades in on an
 * empty frame.
 */
function ReadyGate({ painted, onReady }) {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  useFrame(() => {
    if (!painted || frames.current < 0) return;
    const compiled = gl.info.programs.every((p) => !p.isReady || p.isReady());
    frames.current = compiled ? frames.current + 1 : 0;
    if (frames.current > 2) {
      frames.current = -1;
      onReady();
    }
  });
  return null;
}

/**
 * Takes a picture of the frame just drawn when asked (`pending` holds the beat to go to), so the stage can
 * dissolve from it to the next shot. It runs after the finishing passes, while the frame is still there.
 */
function Snapshot({ pending, onShot }) {
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    const src = gl.domElement;
    const copy = document.createElement('canvas');
    copy.width = src.width;
    copy.height = src.height;
    copy.getContext('2d').drawImage(src, 0, 0);
    onShot(copy, next);
  }, 2);
  return null;
}

/** The last shot laid over the new one and faded away: a dissolve with nothing showing between the two. */
function Veil({ shot, dur }) {
  const box = useRef(null);
  useEffect(() => {
    if (!shot) return undefined;
    const el = shot.canvas;
    el.style.cssText = `position:absolute;inset:0;width:100%;height:100%;opacity:1;pointer-events:none;transition:opacity ${dur}ms cubic-bezier(0.45,0.05,0.3,1)`;
    box.current.appendChild(el);
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => (el.style.opacity = '0'));
    });
    const done = setTimeout(() => el.remove(), dur + 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
      el.remove();
    };
  }, [shot, dur]);
  return <div ref={box} className="pointer-events-none absolute inset-0" />;
}

/**
 * Still mode draws its one moment on demand rather than every animation frame, and hands back a picture
 * of it, so a held frame shows even where WebGL frames are not being composited (a background tab, a
 * hidden preview) and a contact sheet of many scenes needs no live WebGL contexts.
 */
function StillDriver({ ready, painted, onShot }) {
  const advance = useThree((s) => s.advance);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const kick = () => {
      advance(performance.now());
      if (ready) onShot(gl.domElement.toDataURL('image/jpeg', 0.9));
    };
    // now, again once the cards' paintings have attached (they resolve as microtasks), then a few more
    // times on timers (which a hidden page may throttle, so they are only the fallback); the late ones
    // catch the finishing passes, whose shaders may still be compiling for the first frames
    kick();
    queueMicrotask(() => queueMicrotask(kick));
    const channel = new MessageChannel();
    channel.port1.onmessage = kick;
    channel.port2.postMessage(0);
    const timers = [60, 250, 600, 1200, 2200, 3500, 5000, 7500, 11000].map((ms) => setTimeout(kick, ms));
    return () => {
      timers.forEach(clearTimeout);
      channel.port1.close();
    };
  }, [advance, gl, ready, painted, onShot]);
  return null;
}

// The finishing passes. The composer is rebuilt when god-rays come or go; each build gets its own ink-wash
// effect, because a composer disposes the effects it held when it goes.
function Effects({ target, sun, lite, env }) {
  const rays = !!(sun && !lite && target.rays > 0);
  return <Composer key={rays ? 'rays' : 'plain'} rays={rays} sun={sun} target={target} env={env} />;
}

// The palette leans toward the world's `key` colour (its haze colour unless given) by `keyAmt`.
function Composer({ rays, sun, target, env }) {
  const ink = useMemo(() => new InkWashEffect(), []);
  useEffect(() => {
    ink.uniforms.get('haze').value = target.haze ?? 0;
    ink.uniforms.get('hazeY').value = target.hazeY ?? 0.55;
    ink.uniforms.get('keyAmt').value = target.keyAmt ?? 0.16;
  }, [ink, target]);
  useFrame(() => {
    const key = ink.uniforms.get('key').value;
    if (target.key) key.set(target.key);
    else key.copy(env.current.fogColor);
  });
  const bloom = <Bloom intensity={target.bloom} luminanceThreshold={0.92} luminanceSmoothing={0.15} mipmapBlur />;
  return rays ? (
    <EffectComposer multisampling={0} autoClear={false}>
      <GodRays sun={sun} density={0.92} decay={0.94} weight={0.32 * target.rays} exposure={0.4} samples={48} blur />
      {bloom}
      <primitive object={ink} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      {bloom}
      <primitive object={ink} />
    </EffectComposer>
  );
}

/**
 * Paints the cards of a scene's opening beat ahead of time (the paintings are shared), so the next scene
 * can appear the moment it is reached instead of waiting on a blank stage.
 */
export function prepaint(scene, beat = 0) {
  const cards = expandLayers(scene.layers).filter((l) => !OVERLAY.has(l.type) && !GL_TYPES.includes(l.type) && visibleAt(l, beat));
  return Promise.all(cards.map((l) => captureLayer(resolveLayer(l, beat), areaOf(l), l.ppu ?? 0.7)));
}

export default function GLStage({ scene, beat, start = beat, still = false, moment = 1, reduced = false, durations }) {
  const layers = useMemo(() => expandLayers(scene.layers), [scene]);
  const cards = useMemo(() => layers.filter((l) => !OVERLAY.has(l.type) && !GL_TYPES.includes(l.type)), [layers]);
  const native = useMemo(() => layers.filter((l) => GL_TYPES.includes(l.type)), [layers]);
  const overlay = useMemo(() => ({ ...scene, base: 'transparent', layers: layers.filter((l) => OVERLAY.has(l.type)) }), [scene, layers]);
  // one light source streams god-rays at a time: the sun of the shot on screen
  const [shown, setShown] = useState(beat);
  const sunLayer = native.find((l) => l.type === 'sun' && visibleAt(l, shown)) ?? native.find((l) => l.type === 'sun');
  const [painted, setPainted] = useState(false);
  const [ready, setReady] = useState(false);
  const [sunMesh, setSunMesh] = useState(null);
  const [shot, setShot] = useState(null);
  const [veil, setVeil] = useState(null);
  const pending = useRef(null);
  const target = useMemo(() => worldAt(scene, shown), [scene, shown]);
  const env = useRef(null);
  if (env.current === null) env.current = { fogColor: new Color(target.fog), fogNear: target.fogNear, fogFar: target.fogFar, focus: R, dof: target.dof, light: target.light, sunDir: new Vector3(0, 0, -1), still, moment };
  // phones and small GPUs: fewer particles, no god-rays, a lower resolution
  const lite = useMemo(() => window.matchMedia('(max-width: 820px)').matches || (navigator.hardwareConcurrency ?? 8) <= 4, []);
  const overlayCam = useCamera();
  const dissolve = scene.dissolve ?? 1800;
  // Moving to another set: keep drawing the last shot for one more frame, take its picture, then show the
  // new shot complete beneath that picture as it fades. Nothing between the two shots is ever on screen.
  useEffect(() => {
    if (beat === shown) return;
    if (still || !ready || !changesSet(scene, shown, beat)) setShown(beat);
    else pending.current = beat;
  }, [beat, shown, still, ready, scene]);
  const onShot = useCallback((canvas, next) => {
    env.current.snapBeat = next;
    setVeil({ canvas });
    setShown(next);
  }, []);

  // Preload: the first frame appears once every card of the opening beat is painted; the cards of the
  // later beats go on painting behind it, in beat order, so each is ready before its beat comes.
  useEffect(() => {
    let live = true;
    const paint = (b) => cards.filter((l) => visibleAt(l, b)).map((l) => captureLayer(resolveLayer(l, b), areaOf(l), l.ppu ?? 0.7));
    Promise.all(paint(start)).then(async () => {
      if (!live) return;
      setPainted(true);
      for (let b = start + 1; b < scene.beats.length && live; b++) await Promise.all(paint(b));
    });
    return () => {
      live = false;
    };
    // the opening beat is fixed for the life of the stage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, cards]);

  return (
    <div className="absolute inset-0" style={{ background: scene.world?.fog || scene.base || '#07060a' }}>
      <Canvas frameloop={still ? 'never' : 'always'} flat linear dpr={lite ? 1 : [1, 1.75]} gl={{ antialias: !lite, powerPreference: 'high-performance', preserveDrawingBuffer: still }} onCreated={(state) => import.meta.env.DEV && (window.__gl = state)} camera={{ fov: FOV, near: 1, far: 40000, position: [0, 0, R] }} style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.2s ease' }}>
        <color attach="background" args={[scene.base || '#07060a']} />
        <Env target={target} env={env} sun={sunLayer && resolveLayer(sunLayer, shown)} beat={shown} />
        <CameraRig scene={scene} beat={shown} start={start} still={still} reduced={reduced} durations={durations} env={env} shake={target.shake} />
        {painted && cards.map((l) => <Card key={l.key} layer={l} beat={shown} env={env} dissolve={dissolve} />)}
        {native.map((l) => (l.type === 'sun' ? <Sun key={l.key} ref={l === sunLayer ? setSunMesh : undefined} layer={l} beat={shown} env={env} dissolve={dissolve} /> : createElement(NATIVE[l.type], { key: l.key, layer: l, beat: shown, env, dissolve, lite: lite || reduced })))}
        <Effects target={target} sun={sunMesh} lite={lite} env={env} />
        {still && <StillDriver ready={ready} painted={painted} onShot={setShot} />}
        {!still && <Snapshot pending={pending} onShot={onShot} />}
        <ReadyGate painted={painted} onReady={() => setReady(true)} />
      </Canvas>
      {shot && <img src={shot} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />}
      <Veil shot={veil} dur={dissolve} />
      {overlay.layers.length > 0 && <Stage scene={overlay} beat={beat} cam={overlayCam} reduced={reduced} bare />}
    </div>
  );
}
