// Each page's name in the browser tab, in the history list and bookmarks, and in what a screen reader announces when
// a page opens. App.jsx sets the route's name (a layout effect, so it runs before any page's own effects); a page
// that knows something more particular (a scene's title, a lesson's part) adds it with useTitle.
import { useEffect } from 'react';

export const SITE = 'Amanah';
export const HOME = 'Amanah: the stories of the prophets';

const NAMES = {
  story: 'Your journey',
  explore: 'Explore',
  stories: 'Back to the story',
  map: 'The map of time',
  scene: 'A scene',
  lesson: 'A lesson',
  unit: 'A lesson',
  paths: 'Paths through the stories',
  settings: 'Settings',
  privacy: 'Your privacy',
  end: 'The end of the chronicle',
  report: 'Report a mistake',
  contact: 'Write to us',
  abodes: 'The two abodes',
  guide: 'How Amanah works',
  next: 'Your next step',
  about: 'About',
  missing: 'Page not found',
  sheet: 'Contact sheet',
};

// the pages under #/pyramid and #/begin share one route name and differ by view
const VIEWS = {
  landing: 'The Pyramid',
  placement: 'Find where to begin',
  result: 'Where to begin',
  progress: 'Progress',
  begin: 'Begin',
  begun: 'Begin',
};

/** "Name – Amanah", or the site's own title for the start screen. */
export const full = (name) => (name ? `${name} – ${SITE}` : HOME);

/** The title for a route from router.js. */
export function titleFor(route) {
  if (!route || route.name === 'pyramid') return !route || route.view === 'home' ? HOME : full(VIEWS[route.view] || VIEWS.landing);
  return full(NAMES[route.name] || null);
}

/**
 * A page's own, more particular name (a scene's title, a unit's name). Nothing happens while it is still unknown.
 * It runs only when the name changes, never on every render: a page fading out (AnimatePresence) still renders,
 * and must not take the tab's name back from the page that replaced it.
 */
export function useTitle(name) {
  useEffect(() => {
    if (name) document.title = full(name);
  }, [name]);
}
