// Ambient sound only: wind, fire, water, rain, the sea, birds, crickets, sheep and other animals,
// voices that never form words, a town at work, timber being built into a ship, the desert, a great city
// and the wind that buried it. No music and no instruments. Everything is synthesized with the Web Audio
// API (no audio files). Close detail sounds (a footstep, a hammer, a block settling) are panned left or
// right at random, so the near layer of sound has space around it.

const LEVELS = { wind: 0.5, storm: 0.6, fire: 0.42, water: 0.38, rain: 0.42, birds: 0.5, air: 0.2, sheep: 0.5, voices: 0.16, voice: 0.2, crowd: 0.3, hum: 0.22, crickets: 0.4, sea: 0.5, work: 0.45, herd: 0.4, bubbles: 0.4, jeer: 0.14, sand: 0.35, desert: 0.55, city: 0.24, stone: 0.4, chant: 0.18, army: 0.45, banners: 0.3, fountain: 0.3, cheer: 0.3, roar: 0.7, echo: 0.4, dry: 0.4, drips: 0.45, spring: 0.36, rustle: 0.3, boom: 0.5 };

const side = () => (Math.random() - 0.5) * 1.2;

class Ambience {
  ctx = null;
  master = null;
  beds = {};
  targets = {};
  enabled = false;
  wanted = [];

  init() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.white = this.buffer((d) => {
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    });
    this.brown = this.buffer((d) => {
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.5;
      }
    });
    this.buildBeds();
    this.timer = setInterval(() => this.tick(), 110);
    return true;
  }

  buffer(fill, seconds = 4) {
    const b = this.ctx.createBuffer(1, seconds * this.ctx.sampleRate, this.ctx.sampleRate);
    fill(b.getChannelData(0));
    return b;
  }

  loop(buf) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start(0, Math.random() * 3);
    return s;
  }

  filter(type, freq, q = 0.7) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  gain(v) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    return g;
  }

  lfo(freq, depth, param) {
    const o = this.ctx.createOscillator();
    o.frequency.value = freq;
    const g = this.gain(depth);
    o.connect(g).connect(param);
    o.start();
  }

  bed(name, build) {
    const out = this.gain(0);
    out.connect(this.master);
    build(out);
    this.beds[name] = out;
  }

  buildBeds() {
    this.bed('wind', (out) => {
      const bp = this.filter('bandpass', 420, 0.9);
      const g = this.gain(0.7);
      this.loop(this.white).connect(bp).connect(g).connect(out);
      this.lfo(0.07, 230, bp.frequency);
      this.lfo(0.11, 0.35, g.gain);
    });
    this.bed('storm', (out) => {
      const lp = this.filter('lowpass', 260);
      this.loop(this.brown).connect(lp).connect(out);
      const bp = this.filter('bandpass', 650, 0.6);
      const g = this.gain(0.5);
      this.loop(this.white).connect(bp).connect(g).connect(out);
      this.lfo(0.19, 420, bp.frequency);
      this.lfo(0.27, 0.4, g.gain);
    });
    this.bed('fire', (out) => {
      const lp = this.filter('lowpass', 380);
      this.loop(this.brown).connect(lp).connect(out);
      this.crackleOut = this.gain(1);
      this.crackleOut.connect(out);
    });
    this.bed('water', (out) => {
      const bp = this.filter('bandpass', 900, 0.5);
      const g = this.gain(0.6);
      this.loop(this.white).connect(bp).connect(g).connect(out);
      this.lfo(0.23, 0.22, g.gain);
      this.lfo(0.05, 260, bp.frequency);
    });
    this.bed('rain', (out) => {
      const hp = this.filter('highpass', 1400);
      const lp = this.filter('lowpass', 7500);
      this.loop(this.white).connect(hp).connect(lp).connect(this.gain(0.55)).connect(out);
    });
    this.bed('air', (out) => {
      const bp = this.filter('bandpass', 2600, 0.6);
      const g = this.gain(0.25);
      this.loop(this.white).connect(bp).connect(g).connect(out);
      this.lfo(0.04, 0.12, g.gain);
    });
    this.bed('birds', (out) => {
      this.birdOut = out;
    });
    this.bed('sheep', (out) => {
      this.sheepOut = out;
    });
    // Children far off: noise shaped into two vowel-like bands, rising and falling in syllables.
    this.bed('voices', (out) => {
      const src = this.loop(this.white);
      const g = this.gain(0.26);
      src.connect(this.filter('bandpass', 950, 4)).connect(g);
      src.connect(this.filter('bandpass', 2500, 5)).connect(g);
      g.connect(out);
      this.lfo(4.7, 0.2, g.gain);
      this.lfo(0.45, 0.1, g.gain);
    });
    // One calm, low voice speaking somewhere near: deep vowel bands in slow syllables, never words.
    this.bed('voice', (out) => {
      const src = this.loop(this.brown);
      const g = this.gain(0.4);
      src.connect(this.filter('bandpass', 420, 5)).connect(g);
      src.connect(this.filter('bandpass', 1050, 6)).connect(g);
      g.connect(out);
      this.lfo(3.1, 0.3, g.gain);
      this.lfo(0.31, 0.14, g.gain);
    });
    // A town at work: a murmur of many people, with footsteps and hammering in tick().
    this.bed('crowd', (out) => {
      const src = this.loop(this.white);
      const g = this.gain(0.32);
      src.connect(this.filter('bandpass', 700, 1.6)).connect(g);
      src.connect(this.filter('bandpass', 1900, 2.5)).connect(g);
      g.connect(out);
      this.lfo(0.6, 0.1, g.gain);
      this.townOut = out;
    });
    // Something wrong underneath: a low, slow, wavering hum.
    this.bed('hum', (out) => {
      [49, 49.6].forEach((f) => {
        const o = this.ctx.createOscillator();
        o.frequency.value = f;
        o.connect(this.gain(0.35)).connect(out);
        o.start();
      });
      this.loop(this.brown).connect(this.filter('lowpass', 120)).connect(this.gain(0.5)).connect(out);
    });
    // Night: crickets far off, in quick trilled pulses (tick).
    this.bed('crickets', (out) => {
      this.cricketOut = out;
    });
    // The open sea: slow swells of deep noise with a hiss of spray riding on them.
    this.bed('sea', (out) => {
      const g = this.gain(0.7);
      this.loop(this.brown).connect(this.filter('lowpass', 520)).connect(g).connect(out);
      this.lfo(0.09, 0.45, g.gain);
      const hiss = this.gain(0.16);
      this.loop(this.white).connect(this.filter('bandpass', 1200, 0.5)).connect(hiss).connect(out);
      this.lfo(0.13, 0.1, hiss.gain);
    });
    // Building a ship: hammer blows and saw strokes on timber (tick).
    this.bed('work', (out) => {
      this.workOut = out;
    });
    // Animals on the move: hooves and now and then a call (tick).
    this.bed('herd', (out) => {
      this.herdOut = out;
    });
    // Water welling up: a low churn with bubbles breaking on it (tick).
    this.bed('bubbles', (out) => {
      this.bubbleOut = out;
      this.loop(this.brown).connect(this.filter('bandpass', 600, 0.8)).connect(this.gain(0.4)).connect(out);
    });
    // Scornful laughter far off: voice bands in quick bursts, never words.
    this.bed('jeer', (out) => {
      const src = this.loop(this.white);
      const g = this.gain(0.22);
      src.connect(this.filter('bandpass', 700, 5)).connect(g);
      src.connect(this.filter('bandpass', 1600, 6)).connect(g);
      g.connect(out);
      this.lfo(7.5, 0.2, g.gain);
      this.lfo(0.7, 0.12, g.gain);
    });
    // Sand hissing over the dunes: a fine, high hiss that swells with the gusts.
    this.bed('sand', (out) => {
      const g = this.gain(0.5);
      this.loop(this.white).connect(this.filter('highpass', 3200)).connect(this.filter('lowpass', 9000)).connect(g).connect(out);
      this.lfo(0.09, 0.3, g.gain);
    });
    // The deep desert wind: a low moan, and a rumble beneath it for the size of the land.
    this.bed('desert', (out) => {
      const bp = this.filter('bandpass', 190, 1.2);
      const g = this.gain(0.8);
      this.loop(this.brown).connect(bp).connect(g).connect(out);
      this.lfo(0.05, 70, bp.frequency);
      this.lfo(0.08, 0.3, g.gain);
      this.loop(this.brown).connect(this.filter('lowpass', 70)).connect(this.gain(0.6)).connect(out);
    });
    // A great city far off: the soft, low murmur of thousands, never words.
    this.bed('city', (out) => {
      const src = this.loop(this.brown);
      const g = this.gain(0.5);
      src.connect(this.filter('bandpass', 320, 1.1)).connect(g);
      src.connect(this.filter('bandpass', 850, 1.6)).connect(g);
      g.connect(out);
      this.lfo(0.13, 0.12, g.gain);
    });
    // Stone hauled over stone: a slow grinding scrape, and heavy blocks settling (tick).
    this.bed('stone', (out) => {
      const bp = this.filter('bandpass', 240, 2.2);
      const g = this.gain(0.5);
      this.loop(this.brown).connect(bp).connect(g).connect(out);
      this.lfo(0.35, 0.35, g.gain);
      this.lfo(0.21, 60, bp.frequency);
      this.stoneOut = out;
    });
    // Work teams chanting as they haul: deep vowel bands pulsing together, never words.
    this.bed('chant', (out) => {
      const src = this.loop(this.brown);
      const g = this.gain(0.35);
      src.connect(this.filter('bandpass', 300, 6)).connect(g);
      src.connect(this.filter('bandpass', 720, 7)).connect(g);
      g.connect(out);
      this.lfo(0.9, 0.3, g.gain);
    });
    // An army on parade: feet falling in step and bronze ringing on bronze (tick).
    this.bed('army', (out) => {
      this.armyOut = out;
    });
    // Banners and hangings snapping in the wind (tick).
    this.bed('banners', (out) => {
      this.bannerOut = out;
    });
    // Fountains: bright running water with a quick flutter on it.
    this.bed('fountain', (out) => {
      const g = this.gain(0.45);
      this.loop(this.white).connect(this.filter('bandpass', 2400, 0.9)).connect(g).connect(out);
      this.lfo(9, 0.08, g.gain);
      this.loop(this.white).connect(this.filter('bandpass', 700, 0.7)).connect(this.gain(0.2)).connect(out);
    });
    // A crowd cheering: many open voices rising and falling together, never words.
    this.bed('cheer', (out) => {
      const src = this.loop(this.white);
      const g = this.gain(0.4);
      src.connect(this.filter('bandpass', 800, 2)).connect(g);
      src.connect(this.filter('bandpass', 1500, 2.5)).connect(g);
      src.connect(this.filter('bandpass', 2600, 3)).connect(g);
      g.connect(out);
      this.lfo(0.5, 0.15, g.gain);
      this.lfo(2.3, 0.08, g.gain);
    });
    // The wind that does not stop: a deep, relentless roar, with stone groaning beneath it (tick).
    this.bed('roar', (out) => {
      this.loop(this.brown).connect(this.filter('lowpass', 150)).connect(this.gain(1)).connect(out);
      const bp = this.filter('bandpass', 520, 0.5);
      const g = this.gain(0.6);
      this.loop(this.white).connect(bp).connect(g).connect(out);
      this.lfo(0.13, 300, bp.frequency);
      this.lfo(0.31, 0.25, g.gain);
      this.roarOut = out;
    });
    // Wind among mountains: a hollow wind whose sound comes back off the rock.
    this.bed('echo', (out) => {
      const bp = this.filter('bandpass', 520, 1.4);
      const g = this.gain(0.55);
      this.loop(this.white).connect(bp).connect(g);
      this.lfo(0.06, 200, bp.frequency);
      this.lfo(0.1, 0.3, g.gain);
      const delay = this.ctx.createDelay(2);
      delay.delayTime.value = 0.42;
      const back = this.gain(0.45);
      g.connect(out);
      g.connect(delay);
      delay.connect(back).connect(delay);
      delay.connect(this.filter('lowpass', 1400)).connect(out);
    });
    // Drought: a thin, hot wind, and the earth cracking now and then (tick).
    this.bed('dry', (out) => {
      const g = this.gain(0.5);
      this.loop(this.white).connect(this.filter('bandpass', 1500, 0.8)).connect(g).connect(out);
      this.lfo(0.07, 0.25, g.gain);
      this.dryOut = out;
    });
    // The last drops of a fountain falling into a shallow pool (tick).
    this.bed('drips', (out) => {
      this.dripOut = out;
    });
    // A small spring: water running gently over stones, bubbling now and then (tick).
    this.bed('spring', (out) => {
      const g = this.gain(0.4);
      this.loop(this.white).connect(this.filter('bandpass', 1600, 1.2)).connect(g).connect(out);
      this.lfo(3.3, 0.1, g.gain);
      this.lfo(0.17, 0.12, g.gain);
      this.springOut = out;
    });
    // Proud voices booming from a height: deep vowel bands, loud and slow, never words.
    this.bed('boom', (out) => {
      const src = this.loop(this.brown);
      const g = this.gain(0.6);
      src.connect(this.filter('bandpass', 170, 5)).connect(g);
      src.connect(this.filter('bandpass', 380, 6)).connect(g);
      g.connect(out);
      this.lfo(1.4, 0.4, g.gain);
      this.lfo(0.23, 0.2, g.gain);
    });
    // Palm fronds rustling in a soft wind.
    this.bed('rustle', (out) => {
      const g = this.gain(0.35);
      this.loop(this.white).connect(this.filter('highpass', 2600)).connect(g).connect(out);
      this.lfo(0.4, 0.2, g.gain);
      this.lfo(1.7, 0.08, g.gain);
    });
  }

  tick() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    if ((this.targets.fire || 0) > 0 && Math.random() < 0.45) this.crackle(t);
    if ((this.targets.birds || 0) > 0 && Math.random() < 0.045) this.chirp(t);
    if ((this.targets.sheep || 0) > 0 && Math.random() < 0.012) this.bleat(t);
    if ((this.targets.crickets || 0) > 0 && Math.random() < 0.25) this.cricket(t);
    if ((this.targets.bubbles || 0) > 0 && Math.random() < 0.3) this.blip(t);
    if ((this.targets.work || 0) > 0) {
      if (Math.random() < 0.12) this.hammer(t);
      if (Math.random() < 0.025) this.saw(t);
    }
    if ((this.targets.herd || 0) > 0) {
      if (Math.random() < 0.35) this.burst(t, { from: this.brown, type: 'lowpass', freq: 300 + Math.random() * 200, peak: 0.14, attack: 0.004, release: 0.06, out: this.herdOut });
      if (Math.random() < 0.012) this.bleat(t, this.herdOut);
    }
    if ((this.targets.stone || 0) > 0 && Math.random() < 0.02) this.settle(t);
    if ((this.targets.army || 0) > 0) {
      this.step = (this.step || 0) + 1;
      if (this.step % 5 === 0) this.burst(t, { from: this.brown, type: 'lowpass', freq: 220, peak: 0.35, attack: 0.004, release: 0.09, out: this.armyOut, pan: side() * 0.5 });
      if (Math.random() < 0.06) this.clang(t);
    }
    if ((this.targets.banners || 0) > 0 && Math.random() < 0.18) this.burst(t, { type: 'bandpass', freq: 380 + Math.random() * 300, q: 1.2, peak: 0.18, attack: 0.01, release: 0.07, out: this.bannerOut, pan: side() });
    if ((this.targets.roar || 0) > 0 && Math.random() < 0.012) this.groan(t, this.roarOut);
    if ((this.targets.dry || 0) > 0 && Math.random() < 0.03) this.burst(t, { type: 'highpass', freq: 2500, peak: 0.2, attack: 0.002, release: 0.04, out: this.dryOut, pan: side() });
    if ((this.targets.drips || 0) > 0 && Math.random() < 0.05) this.drip(t, this.dripOut);
    if ((this.targets.spring || 0) > 0 && Math.random() < 0.2) this.blip(t, this.springOut);
    if ((this.targets.crowd || 0) > 0) {
      if (Math.random() < 0.3) this.burst(t, { type: 'bandpass', freq: 380 + Math.random() * 200, q: 1.4, peak: 0.08, attack: 0.004, release: 0.05, out: this.townOut, pan: side() });
      if (Math.random() < 0.05) [0, 0.32].forEach((d) => this.burst(t + d, { type: 'bandpass', freq: 2400, q: 6, peak: 0.12, attack: 0.002, release: 0.08, out: this.townOut }));
    }
  }

  env(param, t, peak, attack, release) {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(peak, t + attack);
    param.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  /** A stereo position (-1 left to 1 right) for a detail sound; a plain gain where panning is missing. */
  pan(v = 0) {
    if (!this.ctx.createStereoPanner) return this.gain(1);
    const p = this.ctx.createStereoPanner();
    p.pan.value = v;
    return p;
  }

  burst(t, { from = this.white, type = 'bandpass', freq = 1000, q = 0.7, peak = 0.5, attack = 0.01, release = 0.3, out = this.master, sweep, pan }) {
    const s = this.ctx.createBufferSource();
    s.buffer = from;
    const f = this.filter(type, freq, q);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + attack + release);
    const g = this.gain(0);
    this.env(g.gain, t, peak, attack, release);
    s.connect(f).connect(g);
    (pan === undefined ? g : g.connect(this.pan(pan))).connect(out);
    s.start(t, Math.random() * 3, attack + release + 0.1);
  }

  thump(t, freq = 58, peak = 0.9) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(freq * 1.4, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.75, t + 0.16);
    const g = this.gain(0);
    this.env(g.gain, t, peak, 0.012, 0.2);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.3);
  }

  crackle(t) {
    this.burst(t, { type: 'highpass', freq: 1800 + Math.random() * 2400, peak: 0.12 + Math.random() * 0.35, attack: 0.003, release: 0.03 + Math.random() * 0.05, out: this.crackleOut });
  }

  chirp(t) {
    const n = 2 + Math.floor(Math.random() * 3);
    const f0 = 2500 + Math.random() * 1700;
    for (let i = 0; i < n; i++) {
      const at = t + i * 0.11;
      const o = this.ctx.createOscillator();
      o.frequency.setValueAtTime(f0, at);
      o.frequency.exponentialRampToValueAtTime(f0 * 1.45, at + 0.06);
      const g = this.gain(0);
      this.env(g.gain, at, 0.05, 0.01, 0.07);
      o.connect(g).connect(this.birdOut);
      o.start(at);
      o.stop(at + 0.1);
    }
  }

  cricket(t) {
    const f = 4200 + Math.random() * 600;
    for (let i = 0; i < 3; i++) {
      const at = t + i * 0.045;
      const o = this.ctx.createOscillator();
      o.frequency.value = f;
      const g = this.gain(0);
      this.env(g.gain, at, 0.025, 0.004, 0.03);
      o.connect(g).connect(this.cricketOut);
      o.start(at);
      o.stop(at + 0.05);
    }
  }

  hammer(t) {
    const pan = side();
    this.burst(t, { type: 'bandpass', freq: 1800, q: 2, peak: 0.25, attack: 0.002, release: 0.05, out: this.workOut, pan });
    this.burst(t, { from: this.brown, type: 'lowpass', freq: 400, peak: 0.3, attack: 0.003, release: 0.12, out: this.workOut, pan });
  }

  /** A heavy block settling into place: a low thud with grit trickling after it. */
  settle(t) {
    const pan = side();
    this.burst(t, { from: this.brown, type: 'lowpass', freq: 140, peak: 0.6, attack: 0.01, release: 0.4, out: this.stoneOut, pan });
    this.burst(t + 0.05, { type: 'bandpass', freq: 1800, q: 0.9, peak: 0.08, attack: 0.02, release: 0.5, out: this.stoneOut, pan });
  }

  /** Bronze struck on bronze: a short metallic ring. */
  clang(t) {
    const pan = side();
    [2400, 3570, 5120].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.frequency.value = f * (0.97 + Math.random() * 0.06);
      const g = this.gain(0);
      this.env(g.gain, t, 0.035 / (i + 1), 0.002, 0.5);
      o.connect(g).connect(this.pan(pan)).connect(this.armyOut);
      o.start(t);
      o.stop(t + 0.6);
    });
  }

  /** Stone groaning under strain: a low tone bending slowly downward. */
  groan(t, out = this.master) {
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(48 + Math.random() * 20, t);
    o.frequency.linearRampToValueAtTime(34 + Math.random() * 10, t + 2.2);
    const g = this.gain(0);
    this.env(g.gain, t, 0.12, 0.6, 1.8);
    o.connect(this.filter('lowpass', 220)).connect(g).connect(out);
    o.start(t);
    o.stop(t + 2.6);
  }

  /** One drop falling into shallow water. */
  drip(t, out = this.master) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(820 + Math.random() * 300, t);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.14);
    const g = this.gain(0);
    this.env(g.gain, t, 0.22, 0.005, 0.18);
    o.connect(g).connect(this.pan(side() * 0.6)).connect(out);
    o.start(t);
    o.stop(t + 0.25);
  }

  saw(t) {
    [0, 0.42, 0.84, 1.26].forEach((d, i) => this.burst(t + d, { type: 'bandpass', freq: i % 2 ? 2600 : 2200, q: 3, peak: 0.12, attack: 0.15, release: 0.22, out: this.workOut }));
  }

  blip(t, out = this.bubbleOut) {
    const f = 300 + Math.random() * 500;
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.06);
    const g = this.gain(0);
    this.env(g.gain, t, 0.08, 0.005, 0.06);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.09);
  }

  /** A distant sheep: a buzzy tone with a quaver, shaped by the formants of "baa". */
  bleat(t, out = this.sheepOut) {
    const f0 = 290 + Math.random() * 130;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * 0.9, t + 0.6);
    const vib = this.ctx.createOscillator();
    vib.frequency.value = 6.5 + Math.random() * 2;
    vib.connect(this.gain(f0 * 0.06)).connect(o.frequency);
    const g = this.gain(0);
    this.env(g.gain, t, 0.06, 0.07, 0.55);
    o.connect(this.filter('bandpass', 760, 2.5)).connect(g);
    o.connect(this.filter('bandpass', 2150, 3)).connect(g);
    g.connect(out);
    [o, vib].forEach((n) => {
      n.start(t);
      n.stop(t + 0.75);
    });
  }

  setEnabled(on) {
    this.enabled = on;
    if (on && !this.init()) return;
    if (!this.ctx) return;
    if (on) this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? 0.75 : 0, t, 0.35);
    if (on) this.setBeds(this.wanted);
  }

  /** Fade in the named beds, fade out the rest. Safe to call before audio is enabled. */
  setBeds(names = []) {
    this.wanted = names;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [name, g] of Object.entries(this.beds)) {
      const target = names.includes(name) ? LEVELS[name] ?? 0.4 : 0;
      this.targets[name] = target;
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(target, t, 0.9);
    }
  }

  sfx(name) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    const fx = {
      thunder: () => {
        this.burst(t, { from: this.brown, type: 'lowpass', freq: 900, sweep: 90, peak: 1.4, attack: 0.02, release: 3.6 });
        this.burst(t + 0.5, { from: this.brown, type: 'lowpass', freq: 300, sweep: 60, peak: 0.9, attack: 0.3, release: 3 });
      },
      rumble: () => this.burst(t, { from: this.brown, type: 'lowpass', freq: 160, peak: 1.2, attack: 1.3, release: 2.8 }),
      whoosh: () => this.burst(t, { type: 'bandpass', freq: 280, sweep: 2600, q: 1.2, peak: 0.5, attack: 0.5, release: 0.9 }),
      fall: () => this.burst(t, { type: 'bandpass', freq: 1800, sweep: 160, q: 1, peak: 0.55, attack: 0.2, release: 2.4 }),
      wings: () => [0, 0.12, 0.24, 0.36].forEach((d) => this.burst(t + d, { type: 'bandpass', freq: 700, q: 1.1, peak: 0.35, attack: 0.02, release: 0.07 })),
      dig: () => [0, 0.3, 0.55, 0.95, 1.2].forEach((d) => this.burst(t + d, { type: 'bandpass', freq: 2200, q: 0.8, peak: 0.16, attack: 0.005, release: 0.06 })),
      scratch: () => [0, 0.4, 0.75, 1.3, 1.6, 2.1].forEach((d) => this.burst(t + d, { type: 'highpass', freq: 3200, peak: 0.07, attack: 0.02, release: 0.25 })),
      hoe: () => {
        this.thump(t, 96, 0.28);
        this.burst(t, { from: this.brown, type: 'lowpass', freq: 900, peak: 0.3, attack: 0.004, release: 0.14 });
      },
      page: () => this.burst(t, { type: 'bandpass', freq: 3200, q: 0.6, peak: 0.22, attack: 0.04, release: 0.25 }),
      drop: () => this.drip(t),
      gust: () => {
        this.burst(t, { type: 'bandpass', freq: 220, sweep: 900, q: 0.8, peak: 0.9, attack: 0.6, release: 2.2 });
        this.burst(t, { from: this.brown, type: 'lowpass', freq: 200, peak: 0.8, attack: 0.5, release: 2 });
      },
      // a great gate swinging shut: a long, low creak, then wood booming on stone
      gate: () => {
        this.burst(t, { type: 'bandpass', freq: 320, sweep: 520, q: 9, peak: 0.12, attack: 0.6, release: 1.4 });
        this.burst(t + 0.4, { type: 'bandpass', freq: 460, sweep: 300, q: 10, peak: 0.08, attack: 0.5, release: 1.2 });
        this.thump(t + 2.1, 46, 0.8);
        this.burst(t + 2.1, { from: this.brown, type: 'lowpass', freq: 380, peak: 0.5, attack: 0.005, release: 0.6 });
      },
      groan: () => this.groan(t),
      heartbeat: () => {
        let at = t;
        for (let i = 0; i < 6; i++) {
          this.thump(at, 56, 0.9 - i * 0.12);
          this.thump(at + 0.24, 50, 0.55 - i * 0.07);
          at += 0.95 + i * 0.22;
        }
      },
      swell: () => {
        const o = this.ctx.createOscillator();
        o.frequency.value = 55;
        const g = this.gain(0);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 11);
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + 11.5);
        this.burst(t, { from: this.brown, type: 'lowpass', freq: 220, peak: 0.6, attack: 4, release: 7 });
      },
      door: () => {
        this.burst(t, { type: 'bandpass', freq: 500, sweep: 900, q: 6, peak: 0.08, attack: 0.3, release: 0.4 });
        this.thump(t + 0.7, 70, 0.55);
        this.burst(t + 0.7, { from: this.brown, type: 'lowpass', freq: 600, peak: 0.35, attack: 0.005, release: 0.2 });
      },
      wave: () => {
        this.burst(t, { type: 'bandpass', freq: 300, sweep: 1400, q: 0.7, peak: 0.6, attack: 1.4, release: 1.6 });
        this.burst(t + 1.2, { from: this.brown, type: 'lowpass', freq: 500, sweep: 80, peak: 1.2, attack: 0.08, release: 3.2 });
      },
      call: () =>
        [
          [0, 1800, 2500],
          [0.22, 2300, 1600],
        ].forEach(([d, a, b]) => {
          const o = this.ctx.createOscillator();
          o.frequency.setValueAtTime(a, t + d);
          o.frequency.exponentialRampToValueAtTime(b, t + d + 0.16);
          const g = this.gain(0);
          this.env(g.gain, t + d, 0.09, 0.02, 0.16);
          o.connect(g).connect(this.master);
          o.start(t + d);
          o.stop(t + d + 0.22);
        }),
      ignite: () => {
        this.burst(t, { type: 'bandpass', freq: 400, sweep: 3000, q: 0.9, peak: 0.35, attack: 0.25, release: 0.6 });
        for (let i = 0; i < 6; i++) this.crackle(t + 0.2 + i * 0.07);
      },
    };
    fx[name]?.();
  }
}

export const ambience = new Ambience();
