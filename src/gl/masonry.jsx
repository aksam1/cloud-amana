// Walls raised course by course: a building of the valley's dark stone (the House that Ibrahim and Ismail
// raised), painted on one plane like a card: its front face, and its side receding toward the horizon.
// Every block has its own tone and an inked joint that wavers like a hand-drawn line. `built` (0–1) is how
// far it has risen; `build` [from, to, ms, delay] raises it during a beat, block by block along each
// course (round the front, then the side), the newest stones pale with fresh cuts. `robe` (0–1) dresses it
// in black cloth with a band of gold (the House as it stands today); the band's pattern is shapes, never
// letters.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, ShaderMaterial } from 'three';
import { place, scaleAt, shift, zOf } from './space.js';
import { progressOf, usePresence } from './elements.jsx';
import { resolveLayer } from '../lib/story.js';

const vertex = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const fragment = /* glsl */ `
uniform float W;
uniform float H;
uniform float side;
uniform float vh;
uniform float L;
uniform float courses;
uniform float blocks;
uniform float sideBlocks;
uniform float built;
uniform float robe;
uniform float fresh;
uniform float opacity;
uniform float light;
uniform float seed;
uniform vec3 stone;
uniform vec3 stone2;
uniform vec3 ink;
uniform vec3 cloth;
uniform vec3 gold;
uniform vec4 door;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform float haze;
varying vec2 vUv;
varying float vDepth;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  float u = vUv.x * (W + side);
  float v = vUv.y * H;
  bool front = u <= W;
  float s;
  float t;
  float faceW;
  float faceH;
  if (front) {
    s = u / W;
    t = v / H;
    faceW = W;
    faceH = H;
  } else {
    // the side face narrows toward the horizon: its foot rises and its top falls the further back it goes
    float x = u - W;
    float vb = x * vh / L;
    float vt = H - x * (H - vh) / L;
    s = x / max(side, 1.0);
    t = (v - vb) / max(1.0, vt - vb);
    faceW = side;
    faceH = vt - vb;
  }
  if (t < 0.0 || t > 1.0) discard;
  // the joints waver a little, as a hand draws them
  vec2 wob = vec2(vn(vec2(u, v) / 23.0 + seed), vn(vec2(v, u) / 19.0 + seed * 2.0)) - 0.5;
  float N = courses;
  float tc = t * N + wob.y * 0.12;
  float c = floor(tc);
  float ft = fract(tc);
  float nb = front ? blocks : sideBlocks;
  // each course laid half a block over from the one below, and not quite evenly
  float off = mod(c, 2.0) * 0.5 + (h21(vec2(c, seed)) - 0.5) * 0.3;
  float sb = s * nb + off + wob.x * 0.08;
  float b = floor(sb);
  float fs = fract(sb);
  // where along its course this block was set: round the front, then the side
  float share = blocks / (blocks + sideBlocks);
  float centre = clamp((b - off + 0.5) / nb, 0.0, 1.0);
  float along = front ? centre * share : share + centre * (1.0 - share);
  float placed = built * N - (c + along);
  if (placed < 0.0) discard;
  float r = h21(vec2(b + (front ? 0.0 : 50.0), c) + seed);
  vec3 col = mix(stone, stone2, r);
  col *= 0.86 + 0.22 * vn(vec2(u, v) / 9.0 + r * 10.0);
  // light from the left: the front lit, the side in shade, both darker toward the foot
  col *= front ? 1.0 : 0.62;
  col *= 0.8 + 0.2 * smoothstep(0.0, 0.4, t);
  // the newest stones are pale with fresh cuts, settling to the rest
  col = mix(col, col * 1.35 + 0.06, clamp(1.0 - placed / 0.6, 0.0, 1.0) * fresh);
  // inked joints, broken in places like a dry brush
  float jt = min(ft, 1.0 - ft) * (faceH / N);
  float js = min(fs, 1.0 - fs) * (faceW / nb);
  float line = (1.0 - smoothstep(0.6, 2.2, min(jt, js))) * (0.55 + 0.45 * smoothstep(0.3, 0.7, vn(vec2(u, v) / 4.0)));
  col = mix(col, ink, line * 0.72 * (1.0 - robe));
  if (robe > 0.0) {
    // black cloth hanging in long folds, with a band of gold two thirds of the way up
    vec3 cl = cloth * (0.82 + 0.3 * vn(vec2(u / 6.0, v / 70.0)));
    cl *= front ? 1.0 : 0.72;
    float band = smoothstep(0.69, 0.7, t) * (1.0 - smoothstep(0.77, 0.78, t));
    float pat = smoothstep(0.35, 0.7, abs(sin(s * faceW / 7.0)) * (0.6 + 0.4 * vn(vec2(s * faceW / 4.0, t * 60.0))));
    cl = mix(cl, gold * (0.7 + 0.4 * pat), band);
    col = mix(col, cl, robe);
  }
  // the corner where the faces meet, inked
  col = mix(col, ink, (1.0 - smoothstep(0.0, 2.5, abs(u - W))) * 0.6);
  // a doorway on the front: x (0–1 along it), width, height, lift (0–1 up the wall); gold once robed
  if (front && door.y > 0.0) {
    float dd = step(abs(s - door.x), door.y * 0.5) * step(door.w, t) * step(t, door.w + door.z);
    col = mix(col, mix(ink * 0.5, gold * 0.95, robe), dd * 0.94);
  }
  col *= light;
  col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDepth) * haze);
  // where the wall meets the air the paint gives out in flecks
  float edge = min(min(s, 1.0 - s) * faceW, (1.0 - t) * faceH);
  float a = opacity * (0.7 + 0.3 * smoothstep(0.0, 3.0, edge + (vn(vec2(u, v) / 3.0) - 0.5) * 3.0));
  gl_FragColor = vec4(col, a);
}`;

/**
 * A building raised of stone: front face `w` × `h` (design units at its depth) standing on `pos` [x, y] (the
 * middle of its foot), its side face `side` wide receding toward `horizon` (design y, 450 by default; the
 * vanishing point lies `vanish` units off, four widths by default). `courses` rows of `blocks` stones across
 * the front (`sideBlocks` on the side). `built`, `build` [from, to, ms, delay], `robe`, `fresh` as above;
 * `door` {x, w, h, lift} as fractions of the front; `stone`, `stone2`, `ink`, `cloth`, `gold` colours.
 */
export function Masonry({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { pos = [800, 760], w = 300, h = 260, side = 110, horizon = 450, vanish, courses = 12, blocks = 9, sideBlocks, built = 1, build, robe = 0, fresh = 1, door, stone = '#5e5850', stone2 = '#7c7266', ink = '#221e1c', cloth = '#141212', gold = '#c8a250' } = cfg;
  const z0 = zOf(layer);
  const k = scaleAt(z0);
  const pres = usePresence(layer, beat, dissolve, env);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          W: { value: 1 },
          H: { value: 1 },
          side: { value: 1 },
          vh: { value: 0 },
          L: { value: 1000 },
          courses: { value: 12 },
          blocks: { value: 9 },
          sideBlocks: { value: 3 },
          built: { value: 1 },
          robe: { value: 0 },
          fresh: { value: 1 },
          opacity: { value: 0 },
          light: { value: 1 },
          seed: { value: (layer.key?.length ?? 3) * 1.37 },
          stone: { value: new Color() },
          stone2: { value: new Color() },
          ink: { value: new Color() },
          cloth: { value: new Color() },
          gold: { value: new Color() },
          door: { value: [0, 0, 0, 0] },
          fogColor: { value: new Color() },
          fogNear: { value: 1e5 },
          fogFar: { value: 2e5 },
          haze: { value: 1 },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
      }),
    // one material per building; its values follow the beat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const st = useRef({ start: null, key: null, robe });
  const [X, Y, Z] = shift(place([pos[0] - w / 2, pos[1], z0]), layer);
  const Wd = (w + side) * k;
  const Hd = h * k;
  useFrame(({ clock }, dt) => {
    const e = env.current;
    const u = material.uniforms;
    const s = st.current;
    let b = built;
    if (build) {
      const key = `${beat}:${JSON.stringify(build)}`;
      if (s.key !== key) {
        s.key = key;
        s.start = clock.elapsedTime;
      }
      b = build[0] + (build[1] - build[0]) * progressOf(env, clock.elapsedTime, s.start, build[3] ?? 0, build[2] ?? 8000);
    }
    s.robe += (robe - s.robe) * (e.still || e.snapBeat === beat ? 1 : Math.min(1, dt / 2.4));
    u.W.value = w;
    u.H.value = h;
    u.side.value = side;
    u.vh.value = pos[1] - horizon;
    u.L.value = vanish ?? w * 4;
    u.courses.value = courses;
    u.blocks.value = blocks;
    u.sideBlocks.value = sideBlocks ?? Math.max(2, Math.round((blocks * side) / w));
    u.built.value = b;
    u.robe.value = s.robe;
    u.fresh.value = fresh;
    u.opacity.value = pres.current.o;
    u.light.value = e.light * (cfg.light ?? 1);
    u.stone.value.set(stone);
    u.stone2.value.set(stone2);
    u.ink.value.set(ink);
    u.cloth.value.set(cloth);
    u.gold.value.set(gold);
    u.door.value = door ? [door.x ?? 0.5, door.w ?? 0.14, door.h ?? 0.3, door.lift ?? 0] : [0, 0, 0, 0];
    u.fogColor.value.copy(e.fogColor);
    u.fogNear.value = e.fogNear;
    u.fogFar.value = e.fogFar;
    u.haze.value = cfg.fog ?? 1;
  });
  return (
    <mesh position={[X + Wd / 2, Y + Hd / 2, Z]} material={material} renderOrder={Math.round(Z)} frustumCulled={false}>
      <planeGeometry args={[Wd, Hd]} />
    </mesh>
  );
}
