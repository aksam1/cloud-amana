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

export default defineConfig({
  // Relative asset paths, so the built app works from any folder or host (including a hosted link).
  base: './',
  // When node_modules is a link to another folder (a shared install), Vite's dev server needs to be
  // told it may serve the fonts from there.
  server: { fs: { allow: [process.cwd(), realpathSync(join(process.cwd(), 'node_modules'))] } },
  plugins: [
    react(),
    tailwindcss(),
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
