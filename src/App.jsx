import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoute } from './lib/router.js';
import { getState } from './lib/store.js';
import { ambience } from './lib/audio.js';
import { GeoField, starPath } from './components/Ornaments.jsx';

// Every page loads on demand, so the home page never waits for the whole story (about 1 MB) to download.
const Title = lazy(() => import('./components/Title.jsx'));
const Stories = lazy(() => import('./components/Stories.jsx'));
const ScenePlayer = lazy(() => import('./components/ScenePlayer.jsx'));
const CampaignMap = lazy(() => import('./components/CampaignMap.jsx'));
const Sheet = lazy(() => import('./components/Sheet.jsx'));
const Lesson = lazy(() => import('./components/Lesson.jsx'));
const Pyramid = lazy(() => import('./components/Pyramid.jsx'));
const Unit = lazy(() => import('./components/Unit.jsx'));

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

/**
 * If any page crashes (a device without WebGL, a bad scene file), show a calm way out instead of a blank
 * screen. Nothing is lost: progress lives in the browser's storage, not in the page.
 */
class Recover extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[amanah] page crashed', error, info?.componentStack);
  }
  componentDidUpdate(prev) {
    if (prev.routeKey !== this.props.routeKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="parchment-night grid h-full place-items-center px-6" role="alert">
        <GeoField opacity={0.06} />
        <div className="parchment cartouche relative z-10 max-w-[440px] px-6 py-6 text-center">
          <h1 className="font-display text-[1.3rem] font-semibold text-ink">Something went wrong on this page</h1>
          <p className="mt-2 font-body text-[1.08rem] leading-snug text-ink-soft">Your progress is safe. You can go back to the pyramid, or reload and try again.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-gold" onClick={() => (window.location.hash = '/')}>
              Back to the pyramid
            </button>
            <button type="button" className="btn-ink" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
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
        <Recover routeKey={route.key}>
        <Suspense fallback={<Loader />}>
          {route.name === 'scene' ? (
            <ScenePlayer id={route.id} beat={route.query.beat} still={'still' in route.query} moment={route.query.t} back={route.query.back} until={route.query.until} />
          ) : route.name === 'lesson' ? (
            <Lesson chapter={+route.id} part={+route.part} then={route.query.then} />
          ) : route.name === 'sheet' ? (
            <Sheet id={route.id} device={route.query.device} />
          ) : route.name === 'stories' ? (
            <Stories />
          ) : route.name === 'pyramid' ? (
            <Pyramid view={route.view} />
          ) : route.name === 'unit' ? (
            <Unit id={route.id} step={route.query.step} />
          ) : route.name === 'map' ? (
            <CampaignMap query={route.query} />
          ) : (
            <Title />
          )}
        </Suspense>
        </Recover>
      </motion.div>
    </AnimatePresence>
  );
}
