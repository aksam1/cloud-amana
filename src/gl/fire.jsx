// Fire painted in ink: sheets of flame whose tongues are turbulence rising through banded colour, from a
// white-gold core through orange and crimson to a dark ink edge, with a broad glow behind. `cool` turns it,
// over a few seconds, into calm silver-blue light (the fire that was made coolness and safety): the bands
// cool, the tongues slow and settle. Its light is the scene's own; nothing in it is ever shown suffering.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, ShaderMaterial } from 'three';
import { glowTexture } from './textures.js';
import { place, scaleAt, shift, zOf } from './space.js';
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
uniform float cool;
uniform float height;
uniform float speed;
uniform float seed;
uniform float opacity;
uniform float light;
uniform vec3 h0;
uniform vec3 h1;
uniform vec3 h2;
uniform vec3 h3;
uniform vec3 k0;
uniform vec3 k1;
uniform vec3 k2;
uniform vec3 k3;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vn(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 uv = vUv;
  float t = time * speed;
  // the flames stand over the middle of the sheet and thin out toward its sides
  float side = smoothstep(0.0, 0.16, uv.x) * smoothstep(1.0, 0.84, uv.x);
  // tongues: pointed licks along the crest, each rising to its own height and swaying; a cooled fire
  // softens them into a calm, even glow
  float sway = fbm(vec2(uv.x * 2.5 + seed, t * 0.35));
  float x = uv.x * 6.0 + sway * 2.6 + seed;
  float tri = 1.0 - abs(2.0 * fract(x) - 1.0);
  float tip = 0.35 + 0.65 * fbm(vec2(floor(x) * 1.3 + seed, t * 0.5));
  float shape = mix(pow(tri, 0.95), 0.72, cool * 0.7);
  float crest = height * side * mix(0.42, 1.0, shape) * mix(tip, 0.8, cool * 0.6);
  // turbulence stretched upward, licking at the edges
  vec2 q = vec2(uv.x * 4.0 + seed * 1.7, uv.y * 1.3 - t * 1.2);
  float n = fbm(q + vec2(fbm(q * 1.7 + t * 0.4), 0.0) * 0.9);
  // (the turbulence dies away toward the sheet's sides too, so no flame is ever cut off by its edge)
  float f = (crest - uv.y) * 2.2 + (n - 0.5) * 1.55 * (0.6 + uv.y) * side - (1.0 - side) * 0.5;
  // a cooled fire has soft edges, light rather than flame
  float a = smoothstep(0.0, mix(0.06, 0.32, cool), f) * mix(1.0, 0.85, cool);
  if (a < 0.01) discard;
  // banded like layered washes: a thin ink edge, then crimson, orange, and a gold heart
  float b1 = smoothstep(0.06, 0.14, f);
  float b2 = smoothstep(0.18, 0.32, f);
  float b3 = smoothstep(0.42, 0.66, f);
  vec3 hot = mix(mix(mix(h3, h2, b1), h1, b2), h0, b3);
  vec3 cold = mix(mix(mix(k3, k2, b1), k1, b2), k0, b3);
  vec3 c = mix(hot, cold, cool) * light;
  gl_FragColor = vec4(c, a * opacity);
}`;

const HOT = ['#ffe9a8', '#ff9a2a', '#cc3412', '#3a0c06'];
const COOL = ['#ffffff', '#e6eeff', '#b4c8ec', '#7a8cb4'];

/**
 * A fire standing on the line `pos` [x, y] (design units, at the layer's depth), `w` wide and `h` tall:
 * `sheets` of flame (3: back, middle, front) a little apart in depth; `cool` (0–1) is how far it has turned
 * to calm silver-blue light, reached over `coolDur` ms whenever a beat changes it; `heat` (0–1.4) how high
 * and hard it burns.
 */
export function Fire({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { pos = [800, 760], w = 700, h = 520, sheets = 3, cool = 0, coolDur = 3500, heat = 1 } = cfg;
  const z0 = zOf(layer);
  const k = scaleAt(z0);
  const pres = usePresence(layer, beat, dissolve, env);
  const state = useRef({ cool, heat });
  const mats = useMemo(
    () =>
      Array.from({ length: sheets }, (_, i) => {
        const cols = (list) => list.map((c) => new Color(c));
        const [a, b, c, d] = cols(HOT);
        const [e, f, g, hh] = cols(COOL);
        return new ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            cool: { value: 0 },
            height: { value: 0.85 - i * 0.08 },
            speed: { value: 1.2 + i * 0.25 },
            seed: { value: 3.1 + i * 7.3 },
            opacity: { value: 0 },
            light: { value: 1 },
            h0: { value: a.multiplyScalar(1.28) },
            h1: { value: b.multiplyScalar(1.08) },
            h2: { value: c },
            h3: { value: d },
            k0: { value: e.multiplyScalar(1.3) },
            k1: { value: f },
            k2: { value: g },
            k3: { value: hh },
          },
          vertexShader: vertex,
          fragmentShader: fragment,
          transparent: true,
          depthWrite: false,
        });
      }),
    [sheets],
  );
  const glow = useRef(null);
  const tint = useMemo(() => ({ hot: new Color('#ff9a40'), cold: new Color('#c8d8ff'), now: new Color() }), []);
  // the sheets from back to front, wider at the back
  const sheetsAt = useMemo(
    () =>
      Array.from({ length: sheets }, (_, i) => {
        const dz = (i - (sheets - 1) / 2) * 60;
        const z = z0 + dz;
        const kk = scaleAt(z);
        const ww = w * (1.12 - i * 0.12) * kk;
        const hh = h * (1.0 - i * 0.08) * kk;
        const [X, Y, Z] = shift(place([pos[0], pos[1], z]), layer);
        return { X, Y: Y + hh / 2 - 6 * kk, Z, ww, hh };
      }),
    // geometry follows the layout only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheets, z0, w, h, pos[0], pos[1], layer.dx, layer.dz],
  );
  useFrame(({ clock }, dt) => {
    const e = env.current;
    const s = state.current;
    const rate = e.still || e.snapBeat === beat ? 1 : Math.min(1, (dt / Math.max(0.1, coolDur / 1000)) * 2.5);
    s.cool += (cool - s.cool) * rate;
    s.heat += (heat - s.heat) * rate;
    const o = pres.current.o;
    mats.forEach((m, i) => {
      const u = m.uniforms;
      u.time.value = clock.elapsedTime;
      u.cool.value = s.cool;
      // a cooled fire burns lower and slower, settling into steady light
      u.height.value = (0.88 - i * 0.07) * s.heat * (1 - s.cool * 0.15);
      u.speed.value = (1.2 + i * 0.25) * (1 - s.cool * 0.7);
      u.opacity.value = o;
      u.light.value = 0.6 + 0.4 * Math.min(1.2, e.light + 0.3);
    });
    if (glow.current) {
      tint.now.copy(tint.hot).lerp(tint.cold, s.cool);
      glow.current.material.color.copy(tint.now);
      glow.current.material.opacity = o * (0.55 + 0.1 * Math.sin(clock.elapsedTime * 7.3) * (1 - s.cool));
    }
  });
  const order = Math.round(z0);
  const mid = sheetsAt[Math.floor(sheets / 2)];
  return (
    <group>
      <sprite ref={glow} position={[mid.X, mid.Y, mid.Z - 80]} scale={[w * 2.4 * k, h * 1.8 * k, 1]} renderOrder={order - 2}>
        <spriteMaterial map={glowTexture()} color="#ff9a40" blending={AdditiveBlending} transparent depthWrite={false} opacity={0} />
      </sprite>
      {sheetsAt.map((sh, i) => (
        <mesh key={i} position={[sh.X, sh.Y, sh.Z]} material={mats[i]} renderOrder={Math.round(sh.Z) + 0.3} frustumCulled={false}>
          <planeGeometry args={[sh.ww, sh.hh]} />
        </mesh>
      ))}
    </group>
  );
}
