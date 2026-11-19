import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoute } from './lib/router.js';
import { getState } from './lib/store.js';
import { ambience } from './lib/audio.js';
import { GeoField, starPath } from './components/Ornaments.jsx';
import { IS_WEB, registerWorker, watchForUpdate } from './lib/pwa.js';

// Every page loads on demand, so the home page never waits for the whole story (about 1 MB) to download.
const Title = lazy(() => import('./components/Title.jsx'));
const Stories = lazy(() => import('./components/Stories.jsx'));
const ScenePlayer = lazy(() => import('./components/ScenePlayer.jsx'));
const CampaignMap = lazy(() => import('./components/CampaignMap.jsx'));
const Sheet = lazy(() => import('./components/Sheet.jsx'));
const Lesson = lazy(() => import('./components/Lesson.jsx'));
const Pyramid = lazy(() => import('./components/Pyramid.jsx'));
const Unit = lazy(() => import('./components/Unit.jsx'));
const About = lazy(() => import('./components/About.jsx'));
const Paths = lazy(() => import('./components/Paths.jsx'));
const Settings = lazy(() => import('./components/Settings.jsx'));
const Privacy = lazy(() => import('./components/Privacy.jsx'));
const End = lazy(() => import('./components/End.jsx'));
const Report = lazy(() => import('./components/Report.jsx'));
const Abodes = lazy(() => import('./components/Abodes.jsx'));

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
 *
 * When the page fails to load because the device is offline and that part was never saved, the
 * message says so plainly and points at Settings, where the whole story can be kept on the device.
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
    const offlineMiss = navigator.onLine === false;
    return (
      <div className="parchment-night grid h-full place-items-center px-6" role="alert">
        <GeoField opacity={0.06} />
        <div className="parchment cartouche relative z-10 max-w-[440px] px-6 py-6 text-center">
          <h1 className="font-display text-[1.3rem] font-semibold text-ink">
            {offlineMiss ? "This part isn't saved on this device yet" : 'Something went wrong on this page'}
          </h1>
          <p className="mt-2 font-body text-[1.08rem] leading-snug text-ink-soft">
            {offlineMiss
              ? 'Connect once to watch it, or keep the whole story for offline in Settings.'
              : 'Your progress is safe. You can go back to the pyramid, or reload and try again.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {offlineMiss ? (
              <>
                <button type="button" className="btn-gold" onClick={() => (window.location.hash = '/settings')}>
                  Open Settings
                </button>
                <button type="button" className="btn-ink" onClick={() => (window.location.hash = '/')}>
                  Back home
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-gold" onClick={() => (window.location.hash = '/')}>
                  Back to the pyramid
                </button>
                <button type="button" className="btn-ink" onClick={() => window.location.reload()}>
                  Reload
                </button>
              </>
            )}
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

  // The service worker (web build only): it keeps the app on the device, and it never reloads the
  // page by itself: a new version waits, and the reader is asked. The question is held back while a
  // scene is playing, so a story is never interrupted by it.
  const [update, setUpdate] = useState(null); // the "reload" action, when a new version is waiting
  useEffect(() => {
    if (!IS_WEB) return undefined;
    let off = () => {};
    registerWorker().then((reg) => {
      off = watchForUpdate((activate) => {
        setUpdate(() => activate);
      });
    });
    return () => off();
  }, []);

  const inScene = route.name === 'scene';
  // Scenes keep the slow, cinematic fade in and out. Every other page (home, map, menus, lessons) fades
  // quickly: with mode="wait" the old page must fade out before the new one fades in, so 0.75 s each way
  // made a tap on the tab bar take 1.5 s. An exiting page keeps the props it last had, so a scene still
  // fades out slowly even when the page after it is quick.
  const fade = inScene ? 0.75 : 0.2;

  if (!ready) return <Loader />;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={route.key} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: fade, ease: 'easeInOut' }}>
        <Recover routeKey={route.key}>
        <Suspense fallback={<Loader />}>
          {route.name === 'scene' ? (
            <ScenePlayer id={route.id} beat={route.query.beat} still={'still' in route.query} moment={route.query.t} back={route.query.back} until={route.query.until} first={'first' in route.query} />
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
          ) : route.name === 'paths' ? (
            <Paths id={route.id} />
          ) : route.name === 'settings' ? (
            <Settings />
          ) : route.name === 'privacy' ? (
            <Privacy />
          ) : route.name === 'end' ? (
            <End />
          ) : route.name === 'report' ? (
            <Report where={route.query.where || ''} />
          ) : route.name === 'abodes' ? (
            <Abodes at={route.query.at} />
          ) : route.name === 'about' || route.name === 'missing' ? (
            <About missing={route.name === 'missing'} />
          ) : route.name === 'map' ? (
            <CampaignMap query={route.query} />
          ) : (
            <Title />
          )}
        </Suspense>
        </Recover>
        {update && !inScene && (
          <div className="absolute inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-6" role="status" aria-live="polite">
            <div className="flex items-center gap-3 rounded-full border border-gold/40 bg-black/80 px-4 py-2 font-body text-[1rem] text-ivory backdrop-blur-md">
              <span>A new version of Amanah is ready</span>
              <button
                type="button"
                className="hud-btn"
                onClick={async () => {
                  try {
                    await update();
                  } catch {
                    /* the worker takes over on its own */
                  }
                  window.location.reload();
                }}
              >
                Reload
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
