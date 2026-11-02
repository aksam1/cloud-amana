// The living sky: a time-lapse of the heavens over a scene. Its colours run through night, dawn, day and
// dusk on each beat's own clock; a bright star, the moon and the sun rise and set along their arcs (low
// enough to set behind the hills painted in front of them); stars twinkle in the dark; and while it is
// shown it leads the whole scene's light and haze with the time of day. God is never depicted: these are
// only the things He made, rising and setting.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three';
import { glowTexture } from './textures.js';
import { place, shift } from './space.js';
import { usePresence } from './elements.jsx';
import { resolveLayer } from '../lib/story.js';
import { rng } from '../lib/geo.js';

// [hour, zenith, horizon], round the clock
const KEYS = [
  [0, '#0b1230', '#26304e'],
  [4.4, '#101a3c', '#3a3e62'],
  [5.4, '#30406c', '#d8907a'],
  [6.4, '#6a88b6', '#f4bf8a'],
  [9, '#88aed8', '#f0e2cc'],
  [12, '#78a2d2', '#f2eada'],
  [16, '#88a6ca', '#f4d6a6'],
  [17.8, '#5a6a9c', '#f2925e'],
  [18.9, '#2c3264', '#ac6470'],
  [20.4, '#0e1534', '#2e3050'],
  [24, '#0b1230', '#26304e'],
].map(([h, z, n]) => [h, new Color(z), new Color(n)]);

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const wrap = (h) => ((h % 24) + 24) % 24;

/** The sky's colours at the hour `h`. */
function skyAt(h, zenith, horizon) {
  const t = wrap(h);
  let i = 1;
  while (i < KEYS.length - 1 && KEYS[i][0] < t) i++;
  const [h0, z0, n0] = KEYS[i - 1];
  const [h1, z1, n1] = KEYS[i];
  const u = smooth(0, 1, (t - h0) / Math.max(0.001, h1 - h0));
  zenith.copy(z0).lerp(z1, u);
  horizon.copy(n0).lerp(n1, u);
}

/** How far through its arc a body that rises at `rise` and sets at `set` is at hour `h` (outside 0–1: below). */
function arcAt(h, { rise, set }) {
  const span = wrap(set - rise) || 24;
  return wrap(h - rise) / span;
}

const skyVertex = /* glsl */ `
varying vec3 vPos;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPos = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const skyFragment = /* glsl */ `
uniform vec3 zenith;
uniform vec3 horizon;
uniform float hY;
uniform float topY;
uniform vec3 sunPos;
uniform vec3 sunCol;
uniform float sunVis;
uniform float glowR;
uniform float opacity;
varying vec3 vPos;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  float t = clamp((vPos.y - hY) / (topY - hY), 0.0, 1.0);
  vec3 c = mix(horizon, zenith, pow(t, 0.62));
  // the light gathered round the sun, wider along the horizon
  vec2 d = (vPos.xy - sunPos.xy) / vec2(glowR * 1.6, glowR);
  c += sunCol * sunVis * exp(-dot(d, d)) * 0.42;
  // a wash laid unevenly on the paper
  c *= 0.965 + 0.07 * (vn(vPos.xy / 14000.0) * 0.6 + vn(vPos.xy / 4000.0) * 0.4);
  gl_FragColor = vec4(c, opacity);
}`;

const starVertex = /* glsl */ `
attribute float aSeed;
uniform float time;
uniform float pr;
uniform float night;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.55 + 0.45 * sin(time * (1.3 + aSeed * 2.4) + aSeed * 40.0);
  vA = night * tw * (0.5 + 0.5 * aSeed);
  gl_PointSize = (1.6 + aSeed * 2.8) * pr;
}`;

const starFragment = /* glsl */ `
uniform float opacity;
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.9), smoothstep(0.5, 0.0, r) * vA * opacity);
}`;

const moonFragment = /* glsl */ `
uniform float opacity;
uniform vec3 tint;
varying vec2 vUv;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  if (r > 1.0) discard;
  float maria = smoothstep(0.45, 0.75, vn(vUv * 5.0 + 3.0) * 0.6 + vn(vUv * 11.0) * 0.4);
  vec3 c = tint * (1.0 - maria * 0.16) * (1.0 - 0.12 * r * r);
  gl_FragColor = vec4(c, opacity * smoothstep(1.0, 0.94, r));
}`;

const roundVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/**
 * The living sky over a scene, standing at world depth `z` (−26000) behind everything: `horizon` is the
 * design y where it meets the land. Each beat sets its time of day with `tod` [from, to, ms, days] (hours 0–24,
 * running forward past midnight; `days` whole days more first, for ages passing; a single number holds still). `star`, `moon` and `sun` {rise, set, x0, x1,
 * peak} are the hours they rise and set, the design x they rise at and set at, and how high they climb
 * above the horizon (defaults: the sun 6–18 from the left). `drive: false` leaves the scene's light alone.
 */
export function Heavens({ layer, beat, env, dissolve, lite }) {
  const cfg = resolveLayer(layer, beat);
  const { z = -26000, horizon = 600, star, moon, sun = { rise: 6, set: 18 }, drive = true, stars = 1600 } = cfg;
  const k = (1000 - z) / 1000;
  const pres = usePresence(layer, beat, dissolve, env);
  const at = (x, y) => new Vector3(...shift(place([x, y, z]), layer));
  const centre = at(800, horizon - 300);
  const hY = (450 - horizon) * k;
  const skyMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          zenith: { value: new Color() },
          horizon: { value: new Color() },
          hY: { value: hY },
          topY: { value: hY + 1150 * k },
          sunPos: { value: new Vector3() },
          sunCol: { value: new Color('#ffd8a0') },
          sunVis: { value: 0 },
          glowR: { value: 300 * k },
          opacity: { value: 0 },
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        transparent: true,
        depthWrite: false,
      }),
    // the sky's frame is fixed per element; its colours follow the hour
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const n = Math.round(stars * (lite ? 0.4 : 1));
  const [starPos, starSeed] = useMemo(() => {
    const r = rng(layer.seed ?? 17);
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos.set(shift(place([-1200 + r() * 4000, -1100 + r() * (horizon + 1050), z + 40]), layer), i * 3);
      seed[i] = r();
    }
    return [new Float32BufferAttribute(pos, 3), new Float32BufferAttribute(seed, 1)];
    // the field is fixed per element
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  const starMat = useMemo(
    () => new ShaderMaterial({ uniforms: { time: { value: 0 }, pr: { value: Math.min(window.devicePixelRatio || 1, 2) }, night: { value: 0 }, opacity: { value: 0 } }, vertexShader: starVertex, fragmentShader: starFragment, transparent: true, depthWrite: false, blending: AdditiveBlending }),
    [],
  );
  const moonMat = useMemo(() => new ShaderMaterial({ uniforms: { opacity: { value: 0 }, tint: { value: new Color('#f2f0e6') } }, vertexShader: roundVertex, fragmentShader: moonFragment, transparent: true, depthWrite: false }), []);
  const glow = glowTexture();
  const refs = { star: useRef(null), starHalo: useRef(null), moon: useRef(null), moonHalo: useRef(null), sun: useRef(null), sunHalo: useRef(null) };
  const clock = useRef({ key: null, t0: null });
  const scratch = useMemo(() => ({ zen: new Color(), hor: new Color(), fog: new Color(), warm: new Color('#ffb070'), white: new Color('#fff4e0') }), []);
  useEffect(
    () => () => {
      if (env.current.drive?.owner === layer.key) env.current.drive = null;
    },
    [env, layer.key],
  );
  useFrame(({ clock: c }) => {
    const e = env.current;
    const o = pres.current.o;
    // the hour: this beat's [from, to, ms], run on the beat's own clock (held part way in still mode)
    const tod = Array.isArray(cfg.tod) ? cfg.tod : [cfg.tod ?? 12, cfg.tod ?? 12, 1];
    const key = JSON.stringify(tod);
    if (clock.current.key !== key) clock.current = { key, t0: c.elapsedTime };
    const [h0, h1, ms = 8000, days = 0] = tod;
    const u = e.still ? Math.min(1, e.moment ?? 1) : Math.min(1, (c.elapsedTime - clock.current.t0) / Math.max(0.05, ms / 1000));
    // whole days run through first (days and nights flickering past), then the last stretch eases to rest
    const ease = days ? u : u * u * (3 - 2 * u);
    const h = h0 + (wrap(h1 - h0) + 24 * days) * ease;
    skyAt(h, scratch.zen, scratch.hor);
    const day = smooth(4.9, 7, wrap(h)) * (1 - smooth(17.3, 19.4, wrap(h)));
    const s = skyMat.uniforms;
    s.zenith.value.copy(scratch.zen);
    s.horizon.value.copy(scratch.hor);
    s.opacity.value = o;
    // each body along its arc, starting and ending below the horizon
    const place2 = (body, arc, mesh, halo, size, haloSize) => {
      if (!mesh.current) return 0;
      const p = arcAt(h, body);
      const up = p >= 0 && p <= 1;
      const x0 = body.x0 ?? 220;
      const x1 = body.x1 ?? 1380;
      const peak = body.peak ?? 420;
      const x = x0 + (x1 - x0) * Math.min(1, Math.max(0, p));
      const y = horizon + 60 - (peak + 60) * Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
      const w = at(x, y);
      mesh.current.position.copy(w);
      mesh.current.scale.setScalar(size * k);
      halo.current.position.copy(w);
      halo.current.scale.setScalar(haloSize * k);
      // faded rather than hidden, so their shaders are compiled with the rest while the stage loads
      const vis = up ? o : 0;
      return { vis, w, lift: Math.sin(Math.PI * Math.min(1, Math.max(0, p))) };
    };
    const sunNow = place2(sun, 'sun', refs.sun, refs.sunHalo, sun.size ?? 34, sun.halo ?? 210);
    if (sunNow) {
      const warm = scratch.fog.copy(scratch.warm).lerp(scratch.white, smooth(0.05, 0.5, sunNow.lift));
      refs.sun.current.material.color.copy(warm).multiplyScalar(1.6);
      refs.sun.current.material.opacity = sunNow.vis;
      refs.sunHalo.current.material.color.copy(warm);
      refs.sunHalo.current.material.opacity = sunNow.vis * 0.6;
      s.sunPos.value.copy(sunNow.w);
      s.sunCol.value.copy(warm);
      s.sunVis.value = sunNow.vis * (0.25 + 0.75 * (1 - sunNow.lift));
    } else s.sunVis.value = 0;
    const night = 1 - smooth(4.6, 6.2, wrap(h)) * (1 - smooth(18.6, 20.2, wrap(h)));
    let moonUp = 0;
    if (moon) {
      const m = place2(moon, 'moon', refs.moon, refs.moonHalo, moon.size ?? 30, moon.halo ?? 240);
      if (m) {
        moonMat.uniforms.opacity.value = m.vis;
        refs.moonHalo.current.material.opacity = m.vis * (0.25 + 0.4 * night);
        moonUp = m.vis * m.lift;
      }
    }
    if (star) {
      const st = place2(star, 'star', refs.star, refs.starHalo, star.size ?? 7, star.halo ?? 70);
      if (st) {
        const twinkle = 0.85 + 0.15 * Math.sin(c.elapsedTime * 3.1);
        refs.star.current.material.opacity = st.vis * (0.3 + 0.7 * night) * twinkle;
        refs.starHalo.current.material.opacity = st.vis * (0.3 + 0.7 * night) * 0.8 * twinkle;
      }
    }
    starMat.uniforms.time.value = c.elapsedTime;
    starMat.uniforms.night.value = night;
    starMat.uniforms.opacity.value = o;
    // the scene's light and haze follow the hour while the sky is there
    if (drive && o > 0.01) {
      scratch.fog.copy(scratch.hor).lerp(scratch.zen, 0.25);
      e.drive = { owner: layer.key, light: (0.42 + moonUp * 0.12) * (1 - day) + 1.05 * day, fog: scratch.fog.clone() };
    } else if (e.drive?.owner === layer.key) e.drive = null;
  });
  const order = Math.round(z) - 20;
  return (
    <group>
      <mesh position={centre} material={skyMat} renderOrder={order} frustumCulled={false}>
        <planeGeometry args={[7200 * k, 3800 * k]} />
      </mesh>
      <points material={starMat} renderOrder={order + 1} frustumCulled={false}>
        <bufferGeometry>
          <primitive object={starPos} attach="attributes-position" />
          <primitive object={starSeed} attach="attributes-aSeed" />
        </bufferGeometry>
      </points>
      <sprite ref={refs.starHalo} renderOrder={order + 2}>
        <spriteMaterial map={glow} color="#fff4dc" blending={AdditiveBlending} transparent depthWrite={false} opacity={0} />
      </sprite>
      <sprite ref={refs.star} renderOrder={order + 3}>
        <spriteMaterial map={glow} color="#ffffff" blending={AdditiveBlending} transparent depthWrite={false} opacity={0} />
      </sprite>
      <sprite ref={refs.moonHalo} renderOrder={order + 2}>
        <spriteMaterial map={glow} color="#dfe6f4" blending={AdditiveBlending} transparent depthWrite={false} opacity={0} />
      </sprite>
      <mesh ref={refs.moon} material={moonMat} renderOrder={order + 3}>
        <circleGeometry args={[1, 48]} />
      </mesh>
      <sprite ref={refs.sunHalo} renderOrder={order + 2}>
        <spriteMaterial map={glow} color="#ffd8a0" blending={AdditiveBlending} transparent depthWrite={false} opacity={0} />
      </sprite>
      <mesh ref={refs.sun} renderOrder={order + 3}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#fff0d0" transparent depthWrite={false} opacity={0} />
      </mesh>
    </group>
  );
}
