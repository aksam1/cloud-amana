import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * The site's own address, used for the link preview and the canonical link. The build sets
 * VITE_SITE_URL; without it the page keeps the artifact's address.
 */
const SITE_URL = process.env.VITE_SITE_URL || 'https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq';

/**
 * Writes the service worker at the end of a web build (VITE_TARGET=web).
 *
 * The worker itself is a template (src/sw/sw.template.js): the file list and a cache version (a
 * hash of that list) are written into it, so every new build starts with an empty cache and the
 * app is never left holding files that no longer exist.
 *
 * The artifact build (no VITE_TARGET) writes no worker at all: that build stays a single page.
 */
function serviceWorker() {
  const TEMPLATE = join(process.cwd(), 'src', 'sw', 'sw.template.js');
  let dist = join(process.cwd(), 'dist');
  return {
    name: 'amanah-service-worker',
    apply: 'build',
    enforce: 'post',
    // the folder this build writes to (--outDir), so a test build never touches dist/
    configResolved(config) {
      dist = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (process.env.VITE_TARGET !== 'web') return;
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push('/' + full.slice(dist.length + 1).split(/[\\/]/).join('/'));
        }
      };
      walk(dist);
      files.sort();
      const version = createHash('sha1').update(files.join('|')).digest('hex').slice(0, 12);
      // The shell: the page, its script and style, the fonts the first screen needs, the manifest
      // and the icons. Everything else is kept the first time it is used.
      const shell = files.filter((f) => /^\/(index\.html|manifest\.webmanifest|seal\.svg|icons\/)/.test(f) || /\/assets\/.*\.(js|css|woff2?)$/.test(f));
      const template = readFileSync(TEMPLATE, 'utf8')
        .replace('__CACHE_VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(shell))
        .replace('__FILES__', JSON.stringify(files));
      writeFileSync(join(dist, 'sw.js'), template);
      console.log(`\n  service worker written: ${files.length} files, cache version ${version}`);
    },
  };
}

/**
 * `virtual:scene-index`: every scene's id, chapter, order and title, in story order, and nothing else.
 *
 * Home and the Journey page need to name "where you left off" (a title, "scene 3 of 19") on the first screen.
 * The scenes themselves are about a megabyte, and the build gives each its own file, so even importing
 * one field from each would make the first screen fetch all of them. This reads the files when the app is
 * built (or served) and hands the page a few kilobytes instead. Adding or renumbering a scene needs no step:
 * the index is read again from the files.
 */
function sceneIndex() {
  const ID = 'virtual:scene-index';
  const RESOLVED = `\0${ID}`;
  const root = join(process.cwd(), 'src', 'story', 'chapters');
  return {
    name: 'amanah-scene-index',
    resolveId(id) {
      return id === ID ? RESOLVED : null;
    },
    // A new or deleted scene file is not an edit to any file the index already watches, so the dev server's own
    // watcher tells the index to read the folders again. (Folders cannot go through addWatchFile: in dev Vite
    // resolves each watched path as an import of this module, and a folder does not resolve.)
    configureServer(server) {
      const refresh = (file) => {
        if (!file.startsWith(root) || !/[\\/]s\d+-.+\.json$/.test(file)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
    load(id) {
      if (id !== RESOLVED) return null;
      const list = [];
      for (const dir of readdirSync(root)) {
        const folder = join(root, dir);
        if (!statSync(folder).isDirectory()) continue;
        for (const name of readdirSync(folder)) {
          if (!/^s\d+-.+\.json$/.test(name)) continue;
          const file = join(folder, name);
          this.addWatchFile(file);
          const s = JSON.parse(readFileSync(file, 'utf8'));
          list.push({ id: s.id, chapter: s.chapter, order: s.order, title: s.title });
        }
      }
      // the same order as the story itself (src/lib/story.js): by chapter, then by order
      list.sort((a, b) => a.chapter - b.chapter || a.order - b.order);
      return `export default ${JSON.stringify(list)};`;
    },
  };
}

/**
 * `virtual:unit-index`: for every written pyramid unit, the part of the story it replays:
 * `[{ id, chapter, part, from }]` (`from`: the id of the scene it starts at).
 *
 * The guide (src/lib/journey.js) puts each unit straight after the part of the story it belongs to, and the
 * guide is on the home page, which must not fetch the units themselves. So the link is read here, when the app
 * is built, from each unit file's `story` (src/pyramid/units/<id>.json), and a new unit needs no other step.
 */
function unitIndex() {
  const ID = 'virtual:unit-index';
  const RESOLVED = `\0${ID}`;
  const root = join(process.cwd(), 'src', 'pyramid', 'units');
  return {
    name: 'amanah-unit-index',
    resolveId(id) {
      return id === ID ? RESOLVED : null;
    },
    configureServer(server) {
      const refresh = (file) => {
        if (!file.startsWith(root) || !file.endsWith('.json')) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
    load(id) {
      if (id !== RESOLVED) return null;
      const list = [];
      for (const name of readdirSync(root)) {
        if (!name.endsWith('.json')) continue;
        const file = join(root, name);
        this.addWatchFile(file);
        const u = JSON.parse(readFileSync(file, 'utf8'));
        const s = u.story;
        if (!s || typeof s.chapter !== 'number' || typeof s.part !== 'number') continue;
        list.push({ id: name.replace(/\.json$/, ''), chapter: s.chapter, part: s.part, from: s.from || null });
      }
      list.sort((a, b) => a.id.localeCompare(b.id));
      return `export default ${JSON.stringify(list)};`;
    },
  };
}

/**
 * `virtual:ayah/<ref>`: one ayah from src/data/ayahs.json, as `{ ref, surah, surahAr, ar, en }`, for a page that
 * quotes a single verse and must not download the whole file (about 280 KB): the home page's opening (33:72).
 * The words still come from the one checked source and are never typed by hand; a ref missing from it stops
 * the build.
 */
function ayahPick() {
  const PREFIX = 'virtual:ayah/';
  const file = join(process.cwd(), 'src', 'data', 'ayahs.json');
  return {
    name: 'amanah-ayah',
    resolveId(id) {
      return id.startsWith(PREFIX) ? `\0${id}` : null;
    },
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return null;
      const ref = id.slice(PREFIX.length + 1);
      this.addWatchFile(file);
      const a = JSON.parse(readFileSync(file, 'utf8'))[ref];
      if (!a) this.error(`virtual:ayah: ${ref} is not in src/data/ayahs.json`);
      return `export default ${JSON.stringify({ ref, surah: a.surah, surahAr: a.surahAr, ar: a.ar, en: a.en })};`;
    },
  };
}

export default defineConfig({
  // Relative asset paths, so the built app works from any folder or host (including a hosted link).
  base: './',
  // When node_modules is a link to another folder (a shared install), Vite's dev server needs to be
  // told it may serve the fonts from there.
  server: { fs: { allow: [process.cwd(), realpathSync(join(process.cwd(), 'node_modules'))] } },
  plugins: [
    react(),
    tailwindcss(),
    sceneIndex(),
    unitIndex(),
    ayahPick(),
    serviceWorker(),
    {
      // The link preview's address and the canonical link: Vite replaces the placeholder in index.html.
      name: 'amanah-site-url',
      transformIndexHtml(html) {
        return html.replaceAll('%SITE_URL%', SITE_URL);
      },
    },
  ],
});
