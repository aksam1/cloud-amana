import { motion } from 'motion/react';
import { arabicWords, sceneById, sceneList } from '../lib/story.js';
import { resetProgress, setPref, useStore } from '../lib/store.js';
import { go } from '../lib/router.js';
import { ambience } from '../lib/audio.js';
import { roman } from '../lib/geo.js';
import { GeoField, Icon, Rule } from './Ornaments.jsx';

/*
 * The concept story in one screen: the Trust was offered to the heavens, the earth and the
 * mountains; they declined it, and humanity carried it (33:72). Everything after is that story.
 */
export default function Title() {
  const { last, seen, prefs } = useStore();
  const resume = last && sceneById[last];
  const started = Object.keys(seen).length > 0 || !!resume;
  const first = sceneList[0];

  const toggleSound = () => {
    setPref('sound', !prefs.sound);
    ambience.setEnabled(!prefs.sound);
  };

  return (
    <div className="parchment-night thin-scroll relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto px-6">
      <GeoField opacity={0.07} size={140} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 42%, rgb(226 187 104 / .16), transparent 70%)' }} />
      <motion.div className="pointer-events-none absolute -left-1/4 top-[12%] h-[38vh] w-[90vw] rounded-full opacity-25" style={{ background: 'radial-gradient(ellipse, #3a2c1e, transparent 70%)', filter: 'blur(30px)' }} animate={{ x: ['-4%', '6%'] }} transition={{ duration: 26, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />
      <motion.div className="pointer-events-none absolute -right-1/4 bottom-[8%] h-[32vh] w-[80vw] rounded-full opacity-25" style={{ background: 'radial-gradient(ellipse, #2b2018, transparent 70%)', filter: 'blur(30px)' }} animate={{ x: ['5%', '-5%'] }} transition={{ duration: 31, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />

      <main className="relative z-10 mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center justify-center py-10 text-center">
        <div lang="ar" className="quran ink-reveal gold-text text-[clamp(64px,13vw,150px)] leading-[1.25]" style={{ '--dur': '2.6s', textShadow: 'none' }}>
          {arabicWords('33:72', [2, 2])}
        </div>
        <motion.h1 className="caps -mt-2 text-[clamp(26px,4.4vw,46px)] tracking-[0.42em] text-ivory" initial={{ opacity: 0, letterSpacing: '0.7em' }} animate={{ opacity: 1, letterSpacing: '0.42em' }} transition={{ duration: 2.2, delay: 0.6 }}>
          Amanah
        </motion.h1>
        <motion.p className="mt-2 font-body text-[clamp(18px,2vw,23px)] italic text-ivory/85" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1.2 }}>
          The story of the Trust, from the first light to the Last Day
        </motion.p>

        <Rule className="my-6 h-3.5 w-56 text-gold/70" />

        <motion.figure className="max-w-[58ch]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1, duration: 1.4 }}>
          <blockquote className="font-body text-[clamp(16px,1.55vw,20px)] leading-snug text-ivory/80">
            “Indeed, we offered the Trust to the heavens and the earth and the mountains, and they declined to bear it and feared it; but man [undertook to] bear it.”
          </blockquote>
          <figcaption className="caps mt-2 text-[0.6rem] text-gold/75">Quran 33:72</figcaption>
        </motion.figure>

        <motion.div className="mt-8 flex flex-col items-center gap-3 sm:flex-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 0.9 }}>
          {resume ? (
            <button type="button" className="btn-gold" onClick={() => go(`/scene/${resume.id}`)} autoFocus>
              <Icon name="play" className="h-4 w-4" />
              <span className="max-w-[70vw] truncate">Continue · {roman(resume.order)}. {resume.title}</span>
            </button>
          ) : (
            <button type="button" className="btn-gold" onClick={() => go(`/scene/${first.id}`)} autoFocus>
              <Icon name="play" className="h-4 w-4" />
              Begin the chronicle
            </button>
          )}
          <button type="button" className="hud-btn" onClick={() => go('/map')}>
            <Icon name="map" className="h-4 w-4" />
            Campaign map
          </button>
        </motion.div>

        <motion.div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 1 }}>
          <button type="button" className="flex min-h-[44px] items-center gap-2 font-body text-[1rem] text-ivory/75 hover:text-ivory" onClick={toggleSound} aria-pressed={prefs.sound}>
            <Icon name={prefs.sound ? 'soundOn' : 'soundOff'} className="h-4 w-4" />
            {prefs.sound ? 'Ambient sound on' : 'Ambient sound off'} <span className="text-ivory/50">· wind, fire, water; no music</span>
          </button>
          {started && (
            <button type="button" className="min-h-[44px] font-body text-[1rem] text-ivory/55 underline-offset-4 hover:text-ivory hover:underline" onClick={() => resetProgress()}>
              Start again from the beginning
            </button>
          )}
        </motion.div>
      </main>

      <footer className="relative z-10 mx-auto max-w-[900px] pb-4 text-center font-body text-[0.92rem] text-ivory/45">
        Quran: Uthmani text with Sahih International translation. Scenes marked “Tradition” draw on hadith and classical narrations. Allah, the prophets and Hawwa are never depicted.
      </footer>
    </div>
  );
}
