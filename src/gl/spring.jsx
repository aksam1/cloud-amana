// A spring welling up through dry ground (Zamzam): a pool that spreads from a single point, rings running
// out from where the water rises, the centre heaving, light glancing off the surface, the sand around it
// darkened with wet. `well` (0–1) is how far it has spread; `rise` [from, to, ms, delay] spreads it during a
// beat. `rim` (0–1) banks a low ring of sand round it (Hajar's hands gathering it in). Lies on the ground,
// seen from the reference camera: an ellipse `squash` as deep as it is wide.
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
uniform float well;
uniform float rim;
uniform float time;
uniform float opacity;
uniform float light;
uniform vec3 water;
uniform vec3 deep;
uniform vec3 wet;
uniform vec3 sand;
uniform vec3 glint;
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
  // the quad is squashed to the ellipse, so q is a circle of radius 1 where the pool is full
  vec2 q = (vUv - 0.5) * 2.8;
  float d = length(q);
  float n = vn(q * 5.0 + 3.1) - 0.5;
  float R = well * (1.0 + n * 0.08);
  vec3 col = wet;
  // wet sand spreading a little ahead of the water
  float a = (1.0 - smoothstep(R, R + 0.18 + 0.16 * well, d + n * 0.12)) * smoothstep(0.0, 0.04, well) * 0.75;
  if (rim > 0.0) {
    // a low bank of sand gathered round it, lit on its far side
    float bank = 1.0 - smoothstep(0.0, 0.09, abs(d - (R + 0.13)) + n * 0.03);
    vec3 bc = sand * (0.8 + 0.35 * smoothstep(0.0, -1.0, q.y / max(d, 0.001)));
    col = mix(col, bc, bank * rim);
    a = max(a, bank * rim);
  }
  if (d < R) {
    float k = d / max(R, 0.001);
    vec3 wc = mix(deep, water, 0.25 + 0.75 * smoothstep(0.0, 1.0, k));
    // rings spreading from where the water comes up
    float rings = smoothstep(0.72, 0.98, sin(d * 24.0 - time * 3.0 + n * 2.0)) * (1.0 - k * 0.55);
    // the centre heaves
    float boil = smoothstep(0.38, 0.0, d) * (0.45 + 0.55 * vn(q * 13.0 + time * 1.8));
    // sky light glancing off the surface in long streaks
    float gl = smoothstep(0.7, 0.95, vn(vec2(q.x * 8.0 + time * 0.35, q.y * 26.0 - time * 0.2))) * 0.8;
    wc += glint * (rings * 0.32 + boil * 0.5 + gl * 0.3);
    // the waterline, inked
    wc = mix(wc, deep * 0.45, (1.0 - smoothstep(0.0, 0.04, R - d)) * 0.65);
    col = wc;
    a = 1.0;
  }
  col *= light;
  col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDepth) * haze);
  gl_FragColor = vec4(col, a * opacity);
  if (gl_FragColor.a < 0.01) discard;
}`;

/**
 * A spring at `pos` [x, y] (design units, its middle on the ground), `r` wide to each side and `squash`
 * as deep (0.28). `well`, `rise` [from, to, ms, delay], `rim` as above; `water`, `deep`, `wet`, `sand`,
 * `glint` colours.
 */
export function Spring({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { pos = [800, 760], r = 120, squash = 0.28, well = 1, rise, rim = 0, water = '#9ccfe0', deep = '#2e6280', wet = '#6e5644', sand = '#d8bc90', glint = '#ffffff' } = cfg;
  const z0 = zOf(layer);
  const k = scaleAt(z0);
  const pres = usePresence(layer, beat, dissolve, env);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          well: { value: 0 },
          rim: { value: 0 },
          time: { value: 0 },
          opacity: { value: 0 },
          light: { value: 1 },
          water: { value: new Color() },
          deep: { value: new Color() },
          wet: { value: new Color() },
          sand: { value: new Color() },
          glint: { value: new Color() },
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
    [],
  );
  const st = useRef({ start: null, key: null, rim });
  const [X, Y, Z] = shift(place([pos[0], pos[1], z0]), layer);
  useFrame(({ clock }, dt) => {
    const e = env.current;
    const u = material.uniforms;
    const s = st.current;
    let w = well;
    if (rise) {
      const key = `${beat}:${JSON.stringify(rise)}`;
      if (s.key !== key) {
        s.key = key;
        s.start = clock.elapsedTime;
      }
      w = rise[0] + (rise[1] - rise[0]) * progressOf(env, clock.elapsedTime, s.start, rise[3] ?? 0, rise[2] ?? 6000);
    }
    s.rim += (rim - s.rim) * (e.still || e.snapBeat === beat ? 1 : Math.min(1, dt / 2.4));
    u.well.value = w;
    u.rim.value = s.rim;
    u.time.value = clock.elapsedTime;
    u.opacity.value = pres.current.o;
    u.light.value = e.light * (cfg.light ?? 1);
    u.water.value.set(water);
    u.deep.value.set(deep);
    u.wet.value.set(wet);
    u.sand.value.set(sand);
    u.glint.value.set(glint);
    u.fogColor.value.copy(e.fogColor);
    u.fogNear.value = e.fogNear;
    u.fogFar.value = e.fogFar;
    u.haze.value = cfg.fog ?? 1;
  });
  const size = r * 2.8 * k;
  return (
    <mesh position={[X, Y, Z]} material={material} renderOrder={Math.round(Z)} frustumCulled={false}>
      <planeGeometry args={[size, size * squash]} />
    </mesh>
  );
}
