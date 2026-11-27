import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { full, HOME, titleFor } from './title.js';

// every route name the router can produce, read from the router itself so a new page cannot be missed
const router = readFileSync(new URL('./router.js', import.meta.url), 'utf8');
const names = [...new Set([...router.matchAll(/name: '([a-z]+)'/g)].map((m) => m[1]))];

describe('page titles', () => {
  it('reads the route names from the router', () => {
    expect(names).toContain('scene');
    expect(names).toContain('missing');
    expect(names.length).toBeGreaterThan(15);
  });

  it('gives every route its own name, ending with the site', () => {
    for (const name of names.filter((n) => n !== 'pyramid')) {
      const t = titleFor({ name });
      expect(t, name).toMatch(/ – Amanah$/);
      expect(t, name).not.toMatch(/undefined|null/);
    }
  });

  it('keeps the site title for the start screen and names each pyramid page', () => {
    expect(titleFor({ name: 'pyramid', view: 'home' })).toBe(HOME);
    expect(titleFor({ name: 'pyramid', view: 'progress' })).toBe('Progress – Amanah');
    expect(titleFor({ name: 'pyramid', view: 'placement' })).toBe('Find where to begin – Amanah');
    expect(titleFor({ name: 'pyramid', view: 'something-new' })).toBe('The Pyramid – Amanah');
  });

  it('says plainly when a page does not exist', () => {
    expect(titleFor({ name: 'missing' })).toBe('Page not found – Amanah');
  });

  it('uses no dot-separated strings', () => {
    expect(full('The Trust')).toBe('The Trust – Amanah');
    for (const name of names) expect(titleFor({ name, view: 'home' })).not.toContain(' · ');
  });
});
