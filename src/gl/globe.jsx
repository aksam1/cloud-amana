// The curved earth against the stars, every human life a point of light (5:32), drawn in one shader: a lit
// sphere with drifting continents and a pale rim of air; on the land thousands of lights that come on in
// waves (`phase` "appear"), then one goes out and a shadow ripples across all of them ("dark"), then one
// flares and a warm gold wave spreads from it and stays ("gold"). The lights stand for lives, not places.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial } from 'three';
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
uniform float opacity;
uniform float tAppear;
uniform float tDark;
uniform float tGold;
uniform float spin;
uniform float seed;
varying vec2 vUv;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
vec2 h22(vec2 p) { return vec2(h21(p), h21(p + 17.1)); }
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
    p = p * 2.07 + vec2(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 p = (vUv - 0.5) * 2.3;
  float d = length(p);
  if (d > 1.16) discard;
  vec3 col = vec3(0.0);
  float a = 0.0;
  if (d < 1.0) {
    vec3 n = vec3(p, sqrt(1.0 - d * d));
    float face = atan(p.x, n.z);
    float lon = face + spin;
    float lat = asin(clamp(p.y, -1.0, 1.0));
    vec2 q = vec2(lon * 1.6, lat * 1.9) + seed;
    float land = smoothstep(0.5, 0.56, fbm(q * 1.3));
    float lit = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
    vec3 sea = mix(vec3(0.04, 0.09, 0.16), vec3(0.14, 0.31, 0.43), lit);
    vec3 ground = mix(vec3(0.06, 0.1, 0.07), vec3(0.25, 0.4, 0.3), lit);
    col = mix(sea, ground, land * 0.85);
    // every life a light on the land: one in each cell, appearing in waves from the west
    vec2 g = q * 9.0;
    vec2 cell = floor(g);
    vec2 pt = cell + 0.2 + 0.6 * h22(cell);
    float dist = length(g - pt);
    float r = h21(cell + 3.7);
    float onLand = smoothstep(0.5, 0.56, fbm((pt / 9.0) * 1.3));
    // when it comes on: in a wave across the face of the globe (not its turning, so a light once on stays on)
    float born = (face + 2.2) * 1.1 + r * 1.6;
    float on = smoothstep(born, born + 0.6, tAppear);
    float lamp = (exp(-dist * dist * 70.0) + exp(-dist * dist * 9.0) * 0.22) * on * onLand * (0.75 + 0.25 * sin(time * 2.0 + r * 40.0));
    // the one that goes out (near the middle), and the shadow that passes over all of them
    vec2 mid = vec2(-0.06, 0.74);
    float fromMid = length(p - mid);
    float isOne = 1.0 - step(0.035, fromMid);
    float wave = tDark > 0.0 ? exp(-pow((fromMid - tDark * 0.35) * 6.0, 2.0)) : 0.0;
    float dimmed = tDark > 0.0 ? (1.0 - 0.6 * wave) * (1.0 - isOne * step(0.3, tDark)) : 1.0;
    // the one that flares, and the gold that spreads from it and stays
    vec2 gp = vec2(0.24, 0.7);
    float fromGold = length(p - gp);
    float reach = tGold * 0.3;
    float goldOn = tGold > 0.0 ? smoothstep(reach, reach - 0.12, fromGold) : 0.0;
    float flare = tGold > 0.0 ? exp(-fromGold * fromGold * 600.0) * 2.5 : 0.0;
    vec3 lampCol = mix(vec3(1.0, 0.92, 0.7), vec3(1.0, 0.78, 0.35), goldOn);
    col += lampCol * lamp * dimmed * (1.0 + goldOn * 0.6) * (0.35 + 0.65 * (1.0 - lit * 0.5));
    col += vec3(1.0, 0.85, 0.5) * flare;
    col = mix(col, col * 0.55, wave * 0.5);
    a = 1.0;
  }
  // the thin bright air at the rim
  float rim = exp(-pow((d - 1.01) * 18.0, 2.0));
  col += vec3(0.55, 0.78, 1.0) * rim * 0.65;
  a = max(a, rim * 0.8);
  gl_FragColor = vec4(col, a * opacity);
}`;

/**
 * The globe at `pos` [x, y] (design units, its centre), radius `r`, standing at the layer's depth (the design
 * plane by default). `r0` and `zoomDur` (ms) settle it from a larger radius as it first appears (the view
 * rising). `phase` "appear", "dark" or "gold" per beat; `spin` turns it slowly.
 */
export function Globe({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { pos = [800, 1180], r = 760, r0, zoomDur = 7000, phase = 'appear', spin = 0.012, seed = 17 } = cfg;
  const z0 = zOf(layer);
  const k = scaleAt(z0);
  const pres = usePresence(layer, beat, dissolve, env);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          opacity: { value: 0 },
          tAppear: { value: 0 },
          tDark: { value: 0 },
          tGold: { value: 0 },
          spin: { value: 0 },
          seed: { value: seed * 0.37 },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
      }),
    // one material; the phases follow the beats
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const mesh = useRef(null);
  const clocks = useRef({});
  const [X, Y, Z] = shift(place([pos[0], pos[1], z0]), layer);
  useFrame(({ clock }) => {
    const e = env.current;
    const u = material.uniforms;
    const t = clock.elapsedTime;
    const c = clocks.current;
    if (pres.current.o > 0 && c.appear === undefined) c.appear = t;
    if (phase === 'dark' || phase === 'gold') c.dark ??= t;
    if (phase === 'gold') c.gold ??= t;
    // a still holds every phase reached by this beat as already played out
    const since = (k0) => (c[k0] === undefined ? 0 : e.still ? 30 : t - c[k0]);
    const still = e.still;
    u.tAppear.value = still ? 30 : since('appear');
    u.tDark.value = phase === 'dark' || phase === 'gold' ? (still ? 6 : since('dark')) : 0;
    u.tGold.value = phase === 'gold' ? (still ? 6 : since('gold')) : 0;
    u.time.value = t;
    u.spin.value = t * spin;
    u.opacity.value = pres.current.o;
    const grow = r0 ? (still ? 1 : 1 - Math.pow(1 - Math.min(1, since('appear') / (zoomDur / 1000)), 3)) : 1;
    const rr = (r0 ? r0 + (r - r0) * grow : r) * k;
    if (mesh.current) mesh.current.scale.set(rr * 2.3, rr * 2.3, 1);
  });
  return (
    <mesh ref={mesh} position={[X, Y, Z]} material={material} renderOrder={Math.round(Z)} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
