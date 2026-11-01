import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoute } from './lib/router.js';
import { getState } from './lib/store.js';
import { ambience } from './lib/audio.js';
import { GeoField, starPath } from './components/Ornaments.jsx';
import Title from './components/Title.jsx';

const ScenePlayer = lazy(() => import('./components/ScenePlayer.jsx'));
const CampaignMap = lazy(() => import('./components/CampaignMap.jsx'));
const Sheet = lazy(() => import('./components/Sheet.jsx'));

/** Shown until the calligraphy fonts arrive (capped, so a slow network never blocks the story). */
function Loader() {
  return (
    <div className="parchment-night grid h-full place-items-center" role="status" aria-label="Loading">
      <GeoField opacity={0.06} />
      <svg viewBox="-60 -60 120 120" className="h-24 w-24" aria-hidden="true">
        <motion.path d={starPath(52, 0.72)} fill="none" stroke="#e2bb68" strokeWidth="2" initial={{ pathLength: 0, rotate: 0 }} animate={{ pathLength: [0, 1, 1], rotate: 45 }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
        <circle r="6" fill="#e2bb68" />
      </svg>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cap = setTimeout(() => setReady(true), 3500);
    document.fonts?.ready.then(() => setReady(true));
    return () => clearTimeout(cap);
  }, []);

  // Browsers only allow audio after a gesture: if sound was left on last visit, resume on first touch.
  useEffect(() => {
    const unlock = () => getState().prefs.sound && ambience.setEnabled(true);
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  if (!ready) return <Loader />;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={route.key} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.75, ease: 'easeInOut' }}>
        <Suspense fallback={<Loader />}>
          {route.name === 'scene' ? (
            <ScenePlayer id={route.id} beat={route.query.beat} still={'still' in route.query} moment={route.query.t} />
          ) : route.name === 'sheet' ? (
            <Sheet id={route.id} device={route.query.device} />
          ) : route.name === 'map' ? (
            <CampaignMap query={route.query} />
          ) : (
            <Title />
          )}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
