// The web-only parts of the app: the service worker, the install invitation, and the
// online/offline signal. All of it is switched off unless the build sets VITE_TARGET=web, so the
// hosted artifact stays a single page with no worker and no install prompt.
//
// Nothing here ever sends anything away: the worker only keeps the app's own files, and the
// install prompt is the browser's own.

const WEB = import.meta.env?.PROD && import.meta.env?.VITE_TARGET === 'web';

export const IS_WEB = WEB;

/** Is the app running as an installed app (its own window, no browser bar)? */
export const standalone = () => {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
};

/** Is the device offline right now? */
export const offline = () => (typeof navigator === 'undefined' ? false : navigator.onLine === false);

/**
 * Register the service worker. Never throws: a browser that refuses it (private windows, a file
 * address, the artifact build) simply leaves the app as it was.
 */
export async function registerWorker() {
  if (!WEB || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    return reg;
  } catch (e) {
    console.warn('[amanah] the service worker could not be registered', e);
    return null;
  }
}

/**
 * A new version is waiting. The app never reloads by itself: a playing scene would be interrupted,
 * so the reader is asked, calmly, and the answer is remembered for the visit.
 */
export function watchForUpdate(onUpdate) {
  if (!WEB || !('serviceWorker' in navigator)) return () => {};
  let waiting = null;
  const check = (reg) => {
    if (reg?.waiting && reg.waiting !== waiting) {
      waiting = reg.waiting;
      onUpdate(() => {
        waiting?.postMessage({ type: 'skip-waiting' });
      });
    }
  };
  const onChange = () => {
    navigator.serviceWorker.getRegistration().then(check).catch(() => {});
  };
  navigator.serviceWorker.addEventListener('controllerchange', onChange);
  navigator.serviceWorker.ready.then(check).catch(() => {});
  return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange);
}

/** The worker that is waiting to take over, told to do so now (the reader asked for the reload). */
export async function activateUpdate(reg) {
  try {
    await reg?.waiting?.postMessage({ type: 'skip-waiting' });
  } catch {
    /* the page will reload on its own when the worker takes over */
  }
}

// ── The install invitation ────────────────────────────────────────────────────

let deferred = null;
const listeners = new Set();

/** Catch the browser's own invitation, so the app can offer it in its own words. */
export function watchForInstall() {
  if (typeof window === 'undefined') return () => {};
  const onPrompt = (e) => {
    e.preventDefault();
    deferred = e;
    listeners.forEach((f) => f(true));
    window.dispatchEvent(new Event('amanah:installable'));
  };
  const onInstalled = () => {
    deferred = null;
    listeners.forEach((f) => f(false));
  };
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener('appinstalled', onInstalled);
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener('appinstalled', onInstalled);
  };
}

/** Is the browser offering to install the app right now? */
export const canInstall = () => !!deferred;

/**
 * Show the browser's own install invitation. Returns 'accepted' | 'dismissed' | 'unavailable'.
 */
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  const e = deferred;
  deferred = null;
  listeners.forEach((f) => f(false));
  try {
    e.prompt();
    const choice = await e.userChoice;
    return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'unavailable';
  }
}

/** Subscribe to the install invitation appearing (or being taken up). */
export const onInstallChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// ── Keeping the whole story on the device ────────────────────────────────────

/** Ask the worker to save every built file, and report the progress as it goes. */
export function cacheEverything(onProgress) {
  return new Promise((resolve) => {
    if (!WEB || !navigator.serviceWorker?.controller) {
      resolve({ ok: false, reason: 'no-worker' });
      return;
    }
    const onMessage = (event) => {
      const d = event.data || {};
      if (d.type === 'cache-progress') onProgress?.(d.done, d.total);
      if (d.type === 'cache-done') {
        navigator.serviceWorker.removeEventListener('message', onMessage);
        resolve({ ok: true, total: d.total });
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.controller.postMessage({ type: 'cache-all' });
  });
}

/** How much space the app is using on the device, in bytes (0 when the browser will not say). */
export async function storageSize() {
  try {
    if (!navigator.storage?.estimate) return 0;
    const { usage } = await navigator.storage.estimate();
    return usage || 0;
  } catch {
    return 0;
  }
}

/** Is everything already saved? The worker says so by answering the files it holds. */
export async function isCachedFully() {
  try {
    if (!WEB || !('caches' in window)) return false;
    const names = await caches.keys();
    const mine = names.filter((n) => n.startsWith('amanah-'));
    if (!mine.length) return false;
    const cache = await caches.open(mine[0]);
    const keys = await cache.keys();
    return keys.length > 30; // the shell alone is a handful; a full save is the whole build
  } catch {
    return false;
  }
}
