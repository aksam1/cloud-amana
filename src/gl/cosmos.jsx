// The beginning of the heavens and the earth, painted in light and ink: darkness; a point of gold light that
// draws out into a thread; the heavens and the earth as one joined mass of churning light (21:30); its
// splitting apart in a ring of light, the upper half rising as smoke (41:11) and the lower glowing molten;
// seven heavens in layers as translucent shells of light (67:3), and the nearest kindled with stars. A
// backdrop far behind everything, like a sky. Every value follows the beat and eases to it, so one layer
// can carry a whole time-lapse. Tinted gold and given only `smoke`, it is the angels' court.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, ShaderMaterial } from 'three';
import { scaleAt, shift } from './space.js';
import { usePresence } from './elements.jsx';
import { resolveLayer } from '../lib/story.js';

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragment = /* glsl */ `
uniform float time;
uniform float point;
uniform float thread;
uniform float mass;
uniform float smoke;
uniform float split;
uniform float tBurst;
uniform float skies;
uniform float stars;
uniform float lava;
uniform float opacity;
uniform float aspect;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 gold;
uniform vec3 base;
varying vec2 vUv;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
vec2 h22(vec2 p) { return vec2(h21(p), h21(p + 19.7)); }
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vn(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
void main() {
  // frame-centred coordinates, x widened to the frame's shape (the visible frame is about ±0.94 × ±0.53)
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.0;
  vec3 col = base;
  float r0 = length(p);
  // the halves draw apart, up and down, as the joined thing is split
  float side = p.y >= 0.0 ? 1.0 : -1.0;
  vec2 q = p - vec2(0.0, side * split * 0.22);
  float r = length(q);

  // the heaven as smoke: filaments swirling about the centre, slowly
  vec2 s = rot(time * 0.03 + r * 1.6) * q;
  float w = fbm(s * 1.4 + vec2(time * 0.02, -time * 0.015));
  float f = fbm(s * 2.6 + w * 2.2 + vec2(-time * 0.03, time * 0.02));
  float fil = smoothstep(0.42, 0.78, f);
  vec3 sm = mix(c2, c0, smoothstep(0.3, 0.75, f));
  sm = mix(sm, c1, smoothstep(0.62, 0.86, f) * (0.5 + 0.5 * w));
  // once parted, the smoke belongs to the sky above; below, the young earth glows instead
  float above = mix(1.0, smoothstep(-0.02, 0.08, p.y), clamp(lava * 1.5, 0.0, 1.0));
  float body = smoothstep(1.9, 0.2, r) * smoke * above;
  col = mix(col, sm, body * (0.35 + 0.65 * fil));

  // the young earth, molten: a net of glowing cracks over a dark crust, brightest where it is thinnest
  if (lava > 0.0) {
    float below = smoothstep(0.02, -0.12, p.y);
    vec2 lp = vec2(p.x * 3.0, p.y * 7.0 - time * 0.02);
    float n = fbm(lp + fbm(lp * 0.7 + time * 0.03) * 1.6);
    float crack = 1.0 - abs(n * 2.0 - 1.0);
    crack = pow(crack, 6.0);
    vec3 crust = vec3(0.09, 0.04, 0.03);
    vec3 molten = mix(vec3(0.85, 0.22, 0.05), vec3(1.0, 0.78, 0.35), crack);
    vec3 earth = mix(crust, molten, crack * 1.2 + 0.08);
    earth += vec3(0.6, 0.15, 0.03) * smoothstep(-0.05, -0.55, p.y) * 0.25;
    col = mix(col, earth, below * lava);
  }

  // the joined entity: one sphere of churning light, the heavens and the earth not yet apart
  if (mass > 0.0) {
    float R = 0.12 + 0.07 * mass;
    float rm = length(q);
    vec2 sw = rot(time * 0.45 + rm * 9.0) * q;
    float m = fbm(sw * 10.0 + time * 0.35);
    float inside = smoothstep(R, R - 0.025, rm);
    vec3 mc = mix(c0, c1, smoothstep(0.35, 0.7, m));
    mc = mix(mc, vec3(1.0, 0.95, 0.82), smoothstep(R * 0.75, 0.0, rm) * 0.9);
    float keep = mass * (1.0 - smoothstep(0.0, 0.7, split));
    col = mix(col, mc * (0.75 + 0.5 * m), inside * keep);
    col += gold * exp(-abs(rm - R) * 70.0) * 0.8 * keep;
    col += gold * exp(-rm * 9.0) * 0.35 * keep;
  }

  // where it parts, a seam of light opens between the halves
  float gap = abs(p.y);
  float rift = split * (1.0 - smoothstep(0.0, 0.03 + split * 0.18, gap)) * (1.0 - lava * 0.8);
  col = mix(col, base, rift * 0.85);
  col += gold * split * exp(-gap * 28.0 / max(0.25, split)) * 0.9 * smoothstep(1.6, 0.0, abs(p.x));

  // the parting: a flash, and a ring of light running outward
  if (tBurst >= 0.0) {
    float rb = tBurst * 0.75;
    float ring = exp(-pow((r0 - rb) / 0.05, 2.0)) * (1.0 - smoothstep(0.6, 3.0, tBurst));
    col += gold * ring * 2.2;
    col += mix(gold, vec3(1.0), 0.5) * exp(-tBurst * 2.5) * exp(-r0 * 2.5) * 1.2;
  }

  // a point of light in the dark, drawing out into a thread up and down
  float pulse = 0.85 + 0.15 * sin(time * 2.2);
  col += gold * (exp(-r0 * r0 * 3500.0) * 2.0 + exp(-r0 * 22.0) * 0.45 + exp(-abs(p.y) * 200.0) * exp(-abs(p.x) * 9.0) * 0.25) * point * pulse;
  float tl = thread * 1.15;
  float along = smoothstep(tl, tl - 0.12, abs(p.y));
  float core = exp(-abs(p.x) * 260.0) * along;
  float halo = exp(-abs(p.x) * 18.0) * along * 0.35;
  float flick = 0.85 + 0.15 * vn(vec2(p.y * 14.0, time * 3.0));
  col += gold * (core * 1.6 + halo) * flick * (1.0 - split * 0.6);

  // seven heavens in layers: translucent shells of light arched over the frame, each fainter and wider
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float on = clamp(skies - fi, 0.0, 1.0);
    if (on <= 0.0) continue;
    float yy = 0.07 + fi * 0.064;
    float curve = yy - 0.12 * p.x * p.x / (1.0 + fi * 0.35);
    float d = abs(p.y - curve);
    float shimmer = 0.8 + 0.2 * vn(vec2(p.x * 6.0 + time * 0.2 + fi, fi * 3.0));
    float line = exp(-d * (150.0 - fi * 12.0)) * (0.55 - fi * 0.045) * shimmer;
    float fill = smoothstep(0.0, 0.03, p.y - curve) * (1.0 - smoothstep(0.0, 0.064, p.y - curve)) * 0.05;
    col += mix(gold, vec3(0.75, 0.85, 1.0), fi / 6.0) * (line + fill) * on;
  }

  // the nearest heaven adorned with lamps: stars kindling one by one
  if (stars > 0.0) {
    vec2 g = p * 46.0;
    vec2 cell = floor(g);
    vec2 pt = cell + 0.5 + (h22(cell) - 0.5) * 0.7;
    float d = length(g - pt);
    float h = h21(cell + 7.3);
    float lit = step(h, stars * 0.32) * step(0.0, p.y - 0.03 * lava);
    float tw = 0.7 + 0.3 * sin(time * (1.5 + h * 3.0) + h * 40.0);
    col += vec3(0.95, 0.97, 1.0) * exp(-d * d * 12.0) * lit * tw * (0.6 + h * 1.4);
  }
  gl_FragColor = vec4(col, opacity);
}`;

const KEYS = ['point', 'thread', 'mass', 'smoke', 'split', 'skies', 'stars', 'lava'];

/**
 * `point` (0–1, a point of light), `thread` (0–1, how far the line of light reaches), `mass` (0–1, the joined
 * sphere), `smoke` (0–1), `split` (0–1, how far the halves have parted; a ring of light runs out as it starts),
 * `skies` (0–7 heavens shown), `stars` (0–1, how many have kindled) and `lava` (0–1, the molten earth below)
 * ease to each beat's values over `ease` ms. `colors` [lapis, bronze, deep], `gold`, `base` (the darkness
 * behind). Stands at world depth `z` (−20000), filling the frame.
 */
export function Cosmos({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { z = -20000, ease = 3500, colors = ['#22408a', '#b8823e', '#141f48'], gold = '#ffd27a', base = '#020206' } = cfg;
  const pres = usePresence(layer, beat, dissolve, env);
  const k = scaleAt(z);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          ...Object.fromEntries(KEYS.map((key) => [key, { value: cfg[key] ?? 0 }])),
          tBurst: { value: -1 },
          opacity: { value: 0 },
          aspect: { value: 1600 / 900 },
          c0: { value: new Color() },
          c1: { value: new Color() },
          c2: { value: new Color() },
          gold: { value: new Color() },
          base: { value: new Color() },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
      }),
    // one material; its values follow the beat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const st = useRef(Object.fromEntries(KEYS.map((key) => [key, cfg[key] ?? 0])));
  const burst = useRef(null);
  // the beat whose own values first part the halves sets off the ring, however that beat is reached
  const splitsHere = (cfg.split ?? 0) > 0.5 && (beat > 0 ? resolveLayer(layer, beat - 1).split ?? 0 : 0) < 0.5;
  const burstBeat = useRef(null);
  useFrame(({ clock }, dt) => {
    const e = env.current;
    const u = material.uniforms;
    const s = st.current;
    const jump = e.still || e.snapBeat === beat;
    const rate = jump ? 1 : Math.min(1, (dt / Math.max(0.1, ease / 1000)) * 2.2);
    const target = cfg.split ?? 0;
    if (splitsHere && burstBeat.current !== beat) {
      burstBeat.current = beat;
      burst.current = clock.elapsedTime;
    }
    if (target < 0.5) {
      burst.current = null;
      burstBeat.current = null;
    }
    for (const key of KEYS) {
      const v = cfg[key] ?? 0;
      s[key] += (v - s[key]) * rate;
      u[key].value = s[key];
    }
    // a still holds the ring part way on the beat that parts them, long past on any later one
    if (e.still) u.tBurst.value = splitsHere ? Math.min(1, e.moment ?? 1) * 3 : target > 0.5 ? 9 : -1;
    else u.tBurst.value = burst.current === null ? (target > 0.5 ? 9 : -1) : clock.elapsedTime - burst.current;
    u.time.value = clock.elapsedTime;
    u.opacity.value = pres.current.o;
    u.c0.value.set(colors[0]);
    u.c1.value.set(colors[1]);
    u.c2.value.set(colors[2]);
    u.gold.value.set(gold);
    u.base.value.set(base);
  });
  // wide enough for any camera that stays near the reference (three frames by two)
  const [X, Y, Z] = shift([0, 0, z], layer);
  return (
    <mesh position={[X, Y, Z]} material={material} renderOrder={Math.round(Z)} frustumCulled={false}>
      <planeGeometry args={[1600 * 1.9 * k, 900 * 1.9 * k]} />
    </mesh>
  );
}
