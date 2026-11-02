// The beginning of the heavens and the earth, painted in light and ink: darkness; a single thread of gold
// light; the heaven as smoke (41:11), swirling lapis and bronze filaments; what was joined split apart
// (21:30), the smoke parting above and below a widening rift of light; and seven heavens as layered,
// translucent shells of light arching over the frame. A backdrop far behind everything, like a sky.
// Every value follows the beat and eases to it, so one layer can carry a whole time-lapse.
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
uniform float thread;
uniform float smoke;
uniform float split;
uniform float skies;
uniform float opacity;
uniform float aspect;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 gold;
uniform vec3 base;
varying vec2 vUv;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
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
  // frame-centred coordinates, x widened to the frame's shape
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.0;
  vec3 col = base;
  float a = 1.0;
  // the rift: the halves draw apart, up and down
  float side = p.y >= 0.0 ? 1.0 : -1.0;
  vec2 q = p - vec2(0.0, side * split * 0.22);
  // smoke: filaments swirling about the centre, slowly
  float r = length(q);
  vec2 s = rot(time * 0.03 + r * 1.6) * q;
  float w = fbm(s * 1.4 + vec2(time * 0.02, -time * 0.015));
  float f = fbm(s * 2.6 + w * 2.2 + vec2(-time * 0.03, time * 0.02));
  float fil = smoothstep(0.42, 0.78, f);
  vec3 sm = mix(c2, c0, smoothstep(0.3, 0.75, f));
  sm = mix(sm, c1, smoothstep(0.62, 0.86, f) * (0.5 + 0.5 * w));
  float body = smoothstep(1.9, 0.2, r) * smoke;
  col = mix(col, sm, body * (0.35 + 0.65 * fil));
  // where it parts, a seam of light opens between the halves
  float gap = abs(p.y);
  float rift = split * (1.0 - smoothstep(0.0, 0.03 + split * 0.18, gap));
  col = mix(col, base, rift * 0.85);
  col += gold * split * exp(-gap * 28.0 / max(0.25, split)) * 0.9 * smoothstep(1.6, 0.0, abs(p.x));
  // the thread: one line of gold light from the centre, up and down
  float tl = thread * 1.15;
  float along = smoothstep(tl, tl - 0.12, abs(p.y));
  float core = exp(-abs(p.x) * 260.0) * along;
  float halo = exp(-abs(p.x) * 18.0) * along * 0.35;
  float flick = 0.85 + 0.15 * vn(vec2(p.y * 14.0, time * 3.0));
  col += gold * (core * 1.6 + halo) * flick * (1.0 - split * 0.6);
  // seven heavens: shells of light arched over the frame, each fainter and wider
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float on = clamp(skies - fi, 0.0, 1.0);
    if (on <= 0.0) continue;
    float yy = 0.07 + fi * 0.064;
    float curve = yy - 0.12 * p.x * p.x / (1.0 + fi * 0.35);
    float d = abs(p.y - curve);
    float line = exp(-d * (150.0 - fi * 12.0)) * (0.55 - fi * 0.045);
    float fill = smoothstep(0.0, 0.03, p.y - curve) * 0.035;
    col += mix(gold, vec3(0.75, 0.85, 1.0), fi / 6.0) * (line + fill) * on;
  }
  gl_FragColor = vec4(col, a * opacity);
}`;

/**
 * `thread` (0–1, how far the line of light reaches), `smoke` (0–1), `split` (0–1, how far the halves have
 * parted) and `skies` (0–7 heavens shown) ease to each beat's values over `ease` ms. `colors` [lapis, bronze,
 * deep], `gold`, `base` (the darkness behind). Stands at world depth `z` (−20000), filling the frame.
 */
export function Cosmos({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { z = -20000, thread = 0, smoke = 0, split = 0, skies = 0, ease = 3500, colors = ['#22408a', '#b8823e', '#141f48'], gold = '#ffd27a', base = '#020206' } = cfg;
  const pres = usePresence(layer, beat, dissolve, env);
  const k = scaleAt(z);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          thread: { value: thread },
          smoke: { value: smoke },
          split: { value: split },
          skies: { value: skies },
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
  const st = useRef({ thread, smoke, split, skies });
  useFrame(({ clock }, dt) => {
    const e = env.current;
    const u = material.uniforms;
    const s = st.current;
    const rate = e.still || e.snapBeat === beat ? 1 : Math.min(1, dt / Math.max(0.1, ease / 1000) * 2.2);
    for (const [key, v] of Object.entries({ thread, smoke, split, skies })) {
      s[key] += (v - s[key]) * rate;
      u[key].value = s[key];
    }
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
