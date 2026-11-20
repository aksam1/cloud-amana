import { useEffect, useRef } from 'react';
import { DOORS, fresh, opened } from '../lib/discover.js';
import { go } from '../lib/router.js';
import { useStore } from '../lib/store.js';
import { Icon } from './Ornaments.jsx';

// One spine and one side door: Story is the chronicle in order (and where you left it); Explore holds the other
// ways into the same stories (the map, paths, the pyramid, the two abodes, the guide).
const ITEMS = [
  { id: 'home', label: 'Home', icon: 'home', to: '/' },
  { id: 'story', label: 'Story', icon: 'book', to: '/story' },
  { id: 'explore', label: 'Explore', icon: 'map', to: '/explore' },
  { id: 'progress', label: 'Progress', icon: 'bars', to: '/pyramid/progress' },
];
// Home and Story are there from the first visit; Explore and Progress join them as the story opens them
// (src/lib/discover.js). A tab is always shown on its own pages, and wherever the guide points at it.
const ALWAYS = new Set(['home', 'story']);
// The tabs this page load has shown already: one that joins the menu later (the first scene opens Explore and
// Progress) glows in once, rather than every time a page draws the menu.
let shown = null;
// the pages that live under a tab without being it
const UNDER = { stories: 'story', pyramid: 'explore', map: 'explore', paths: 'explore', abodes: 'explore', guide: 'explore' };

/**
 * The one menu every page shares. On a phone it is a tab bar along the bottom edge, where a thumb reaches
 * it (pages leave `pb-28` free for it); from the `sm` breakpoint up it sits inline where it is placed.
 * `here` marks the current section. `spot` rings one item in light: the guide uses it to show where a place is,
 * and with `onSpot` a tap on that item is the guide's to answer (it is practice, not a way out of the guide).
 * A small gold dot marks a tab with something newly opened behind it, until the reader goes there.
 */
export default function Nav({ here, tone = 'night', spot = null, onSpot = null }) {
  const ink = tone === 'parchment';
  const open = useStore(opened);
  // the guide lives under Explore once Explore is in the menu; before that it belongs to no tab, so a newcomer's
  // menu stays Home and Story
  here = here === 'guide' && !open.explore ? null : UNDER[here] || here;
  spot = UNDER[spot] || spot;
  const news = useStore(fresh);
  const isNew = { explore: DOORS.some((d) => news[d.id]), progress: !!news.progress };
  const items = ITEMS.filter((it) => ALWAYS.has(it.id) || open[it.id] || it.id === here || it.id === spot);
  // kept for the life of this menu, so a re-render partway through the glow does not cut it short
  const arriving = useRef(new Set()).current;
  if (shown) for (const it of items) if (!shown.has(it.id)) arriving.add(it.id);
  useEffect(() => {
    shown ||= new Set();
    for (const it of items) shown.add(it.id);
  });
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#07080f] via-[#07080f]/95 to-transparent px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-5 sm:static sm:z-20 sm:bg-none sm:p-0"
    >
      <ul
        className={`mx-auto flex max-w-[600px] items-stretch justify-between gap-0.5 rounded-[26px] border px-1 py-1 sm:gap-1 sm:rounded-full sm:px-1.5 ${
          ink ? 'border-gold/30 bg-[#120d0a]/90 sm:border-[#8a6a4e]/40 sm:bg-[#5a3d22]/8' : 'border-gold/25 bg-[#0c0b12]/90 backdrop-blur-md sm:bg-black/35'
        }`}
      >
        {items.map((it) => {
          const on = it.id === here;
          const lit = it.id === spot;
          const dot = isNew[it.id] && !on;
          return (
            <li key={it.id} className={`flex-1 rounded-full ${lit ? 'guide-spot' : ''} ${arriving.has(it.id) ? 'nav-arrive' : ''}`}>
              <a
                href={`#${it.to}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (lit && onSpot) onSpot();
                  else go(it.to);
                }}
                aria-current={on ? 'page' : undefined}
                // one name read as one phrase (a visually hidden span would be read with a pause of its own)
                aria-label={dot ? `${it.label}, something new` : undefined}
                className={`flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-full px-1 font-body text-[0.92rem] transition-colors sm:min-h-[42px] sm:flex-row sm:gap-1.5 sm:px-3 sm:text-[1rem] ${
                  on
                    ? ink
                      ? 'bg-[#3c2a12] text-gold-hi sm:bg-[#a5772f]/20 sm:text-ink'
                      : 'bg-[#3c2a12] text-gold-hi'
                    : ink
                      ? 'text-ivory/70 hover:text-ivory sm:text-ink-soft sm:hover:text-ink'
                      : 'text-ivory/70 hover:text-ivory'
                }`}
              >
                <span className="relative">
                  <Icon name={it.icon} className="h-[18px] w-[18px] shrink-0" />
                  {dot && <span className="nav-dot absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-gold-hi" aria-hidden="true" />}
                </span>
                <span>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
