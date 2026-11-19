/*
 * Amanah's service worker (web build only).
 *
 * It is written at build time from this template: the placeholders below are replaced by the
 * Vite plugin in vite.config.js with the real file names and a cache version, so a new build
 * always starts with an empty cache.
 *
 * What it does:
 *   · on install, it keeps the app shell (the page, its script and style, the fonts the first
 *     screen needs, the manifest and the icons), so the app opens with no connection
 *   · on activate, it deletes the caches of older versions and takes over the open pages
 *   · a page request goes to the network first and falls back to the saved page when offline
 *   · the hashed assets are kept from the first time they are used: every scene you have watched
 *     works offline afterwards
 *   · the message {type:'cache-all'} saves every built file, so the whole story can be kept on the
 *     device ("Keep the whole story on this device" in Settings)
 *
 * Nothing from another address is ever kept.
 */

const VERSION = '__CACHE_VERSION__';
const CACHE = `amanah-${VERSION}`;
const PRECACHE = __PRECACHE__;
const ALL_FILES = __FILES__;

/**
 * A response without the "Vary" header. A server that varies on Origin (some hosts do) would
 * otherwise hide the saved file from the browser's own cache lookup, and the app would look broken
 * offline even though the file is there.
 */
function withoutVary(res) {
  const headers = new Headers(res.headers);
  headers.delete('vary');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // one by one: a single missing file must not stop the whole app from being kept
      await Promise.all(
        PRECACHE.map(async (path) => {
          try {
            const res = await fetch(new Request(path, { cache: 'reload' }));
            if (res && res.ok) await cache.put(path, withoutVary(res));
          } catch (e) {
            /* this file is not there; the page will fetch it when it is needed */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('amanah-') && n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nothing from another address is kept

  // the page itself: the network first, the saved page when there is none
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put('./index.html', withoutVary(fresh.clone())).catch(() => {});
          return fresh;
        } catch (e) {
          const cache = await caches.open(CACHE);
          // ignoreVary: a server that varies on Origin would otherwise hide the saved page
          return (await cache.match('./index.html', { ignoreVary: true })) || (await cache.match('./', { ignoreVary: true })) || Response.error();
        }
      })(),
    );
    return;
  }

  // the hashed assets: kept from the first time they are used
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(req, { ignoreVary: true });
        if (hit) return hit;
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) cache.put(req, withoutVary(fresh.clone())).catch(() => {});
          return fresh;
        } catch (e) {
          // the same file under its path: a server that varies on Origin must not hide it
          const byPath = await cache.match(url.pathname, { ignoreVary: true });
          return byPath || Response.error();
        }
      })(),
    );
    return;
  }

  // anything else on this address: the network, then the cache as a fallback
  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch (e) {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(req, { ignoreVary: true });
        return hit || Response.error();
      }
    })(),
  );
});

// "Keep the whole story on this device": save every built file, one at a time, and tell the page
// how far it has got.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  // the reader asked for the new version: take over now (the page reloads itself)
  if (data.type === 'skip-waiting') {
    self.skipWaiting();
    return;
  }
  if (data.type !== 'cache-all') return;
  const reply = (msg) => {
    const client = event.source;
    if (client && client.postMessage) client.postMessage(msg);
  };
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      let done = 0;
      for (const path of ALL_FILES) {
        try {
          const hit = await cache.match(path, { ignoreVary: true });
          if (!hit) {
            const res = await fetch(new Request(path, { cache: 'reload' }));
            if (res && res.ok) await cache.put(path, withoutVary(res));
          }
        } catch (e) {
          /* one file that cannot be saved is skipped; the rest still is */
        }
        done += 1;
        reply({ type: 'cache-progress', done, total: ALL_FILES.length });
      }
      reply({ type: 'cache-done', total: ALL_FILES.length });
    })(),
  );
});
