import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3 } from 'three';
import { FOV, R, ease, world } from './space.js';

const DEFAULT = { pos: [800, 450, R], look: [800, 450, 0], fov: FOV, focus: R };

// A camera given with `dx`/`dz` frames a montage set: its points are as seen in that set, moved with it.
const inSet = (p, at) => (p && (at?.dx || at?.dz) ? [p[0] + (at.dx ?? 0), p[1], (p[2] ?? 0) + (at.dz ?? 0)] : p);

/** Where the camera stands when beat `n` begins: the scene's opening framing, then each earlier beat's move. */
export function glCameraAt(scene, n) {
  const c = { ...DEFAULT, ...scene.cam, pos: inSet(scene.cam?.pos ?? DEFAULT.pos, scene.cam), look: inSet(scene.cam?.look ?? DEFAULT.look, scene.cam) };
  scene.beats.slice(0, n).forEach((b) => {
    if (!b.cam) return;
    for (const k of ['pos', 'look']) if (b.cam[k] !== undefined) c[k] = inSet(b.cam[k], b.cam);
    for (const k of ['fov', 'focus']) if (b.cam[k] !== undefined) c[k] = b.cam[k];
  });
  return c;
}

/** The montage set a beat's camera frames ({dx, dz}); a beat with no camera of its own stays where it was. */
export function frameOf(scene, n) {
  let f = { dx: scene.cam?.dx ?? 0, dz: scene.cam?.dz ?? 0 };
  for (let i = 0; i <= n && i < scene.beats.length; i++) {
    const c = scene.beats[i].cam;
    if (c) f = { dx: c.dx ?? 0, dz: c.dz ?? 0 };
  }
  return f;
}

/** Going from beat `a` to beat `b` changes set: the stage dissolves to the new shot rather than flying across. */
export function changesSet(scene, a, b) {
  const [f, g] = [frameOf(scene, a), frameOf(scene, b)];
  return f.dx !== g.dx || f.dz !== g.dz;
}

/** Where a beat that opens a new set begins: its `from` framing, or its own framing drawn back a little. */
function openingOf(scene, n) {
  const c = scene.beats[n].cam;
  const end = glCameraAt(scene, n + 1);
  return { ...end, pos: c.from?.pos ? inSet(c.from.pos, c) : [end.pos[0], end.pos[1], end.pos[2] + 160], look: c.from?.look ? inSet(c.from.look, c) : end.look };
}

const vec = (p) => new Vector3(...world(p));

// The 2D stage keeps the central 900×900 square on screen at any shape; the 3D camera frames the same way.
const fitFov = (aspect) => {
  const visible = aspect >= 16 / 9 ? 1600 / aspect : aspect >= 1 ? 900 : 900 / aspect;
  return (2 * Math.atan(visible / 2 / R) * 180) / Math.PI;
};

/**
 * The camera of a WebGL scene. Each beat's `cam` {pos, look, path, fov, focus, ease, dur, cut, dx, dz} glides to
 * its framing along a smooth spline through any `path` points (design coordinates), easing in and out; a
 * faint handheld drift (the world's `shake`) keeps it alive; `focus` racks the depth of field to that
 * distance from the camera. A beat that opens a new set starts at its own opening framing (`from` {pos,
 * look}, or its framing drawn back a little) while the stage dissolves to it. In still mode it stands where
 * the beat ends.
 */
export function CameraRig({ scene, beat, start, still, reduced, durations, env, shake = 1 }) {
  const { camera } = useThree();
  const cur = useRef(null);
  const seg = useRef(null);
  const last = useRef(start);
  if (cur.current === null) {
    const opens = !still && scene.beats[start]?.cam && changesSet(scene, start - 1, start);
    const c = still ? glCameraAt(scene, start + 1) : opens ? openingOf(scene, start) : glCameraAt(scene, start);
    cur.current = { pos: vec(c.pos), look: vec(c.look), fov: c.fov, focus: c.focus };
  }
  // set before the next frame is drawn, so a cut to a new set never shows a frame from the old framing
  useLayoutEffect(() => {
    const c = scene.beats[beat]?.cam;
    const opens = !still && last.current !== beat && changesSet(scene, last.current, beat);
    last.current = beat;
    if (!c) return;
    const end = glCameraAt(scene, beat + 1);
    if (opens) {
      const o = openingOf(scene, beat);
      cur.current = { pos: vec(o.pos), look: vec(o.look), fov: o.fov, focus: o.focus };
    }
    const from = cur.current;
    const points = [from.pos.clone(), ...(c.path || []).map((p) => vec(inSet(p, c))), vec(end.pos)];
    seg.current = {
      curve: points.length > 2 ? new CatmullRomCurve3(points, false, 'centripetal') : null,
      p0: from.pos.clone(),
      p1: vec(end.pos),
      look0: from.look.clone(),
      look1: vec(end.look),
      fov0: from.fov,
      fov1: end.fov,
      f0: from.focus,
      f1: end.focus,
      t0: null,
      dur: still || reduced || c.cut ? 0 : (c.dur ?? durations?.[beat] ?? 6000) / 1000,
      ease: ease(c.ease || 'inOut'),
    };
  }, [beat, scene, still, reduced, durations]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const c = cur.current;
    const s = seg.current;
    if (s) {
      if (s.t0 === null) s.t0 = t;
      const u = s.dur ? Math.min(1, (t - s.t0) / s.dur) : 1;
      const e = s.ease(u);
      if (s.curve) c.pos.copy(s.curve.getPoint(e));
      else c.pos.lerpVectors(s.p0, s.p1, e);
      c.look.lerpVectors(s.look0, s.look1, e);
      c.fov = s.fov0 + (s.fov1 - s.fov0) * e;
      c.focus = s.f0 + (s.f1 - s.f0) * e;
      if (u >= 1) seg.current = null;
    }
    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    // a hand holding the camera: tiny, slow, never quite still
    const k = still || reduced ? 0 : shake;
    camera.rotateX((Math.sin(t * 0.31) * 0.6 + Math.sin(t * 0.73 + 1.3) * 0.4) * 0.0022 * k);
    camera.rotateY((Math.sin(t * 0.23 + 2.1) * 0.6 + Math.sin(t * 0.61) * 0.4) * 0.003 * k);
    const fov = fitFov(camera.aspect) * (c.fov / FOV);
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    env.current.focus = c.focus;
  });
  return null;
}
