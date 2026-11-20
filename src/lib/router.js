// Hash routes: #/ (the start screen) · #/pyramid (the pyramid: #/pyramid/placement|result|progress, #/unit/:id?step=) · #/chronicle (the
// chronicle's title page) · #/stories (back into the story where the reader left it) · #/story (the story in order)
// · #/explore (the other ways in) · #/map?arrive=&from= · #/scene/:id (?beat=n opens at a moment, &still holds it,
// &t=0.5 holds it halfway through its timed motions)
// · #/lesson/:chapter/:part?then=<route> (the lesson after a part; ?then is where it continues)
// · #/begin and #/begin/next (a new visitor chooses a view, then takes the guide; after the first story, where to go next)
// · #/guide?step=<id> (the short guide: try each thing once; ?step=all is every place on one page)
// · #/paths and #/path/:id (paths through the stories)
// · #/sheet/:chapter or #/sheet/:sceneId (contact sheet of every beat, for reviewing compositions)
import { useEffect, useState } from 'react';

function parse(hash) {
  const [path, q] = hash.replace(/^#/, '').split('?');
  const parts = (path || '/').split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(q || ''));
  if (parts[0] === 'map') return { name: 'map', query, key: 'map' };
  if (parts[0] === 'scene' && parts[1]) return { name: 'scene', id: parts[1], query, key: `scene:${parts[1]}:${query.beat ?? ''}:${'still' in query}:${query.t ?? ''}` };
  if (parts[0] === 'stories') return { name: 'stories', query, key: 'stories' };
  // the story in order (#/story: every chapter, part, scene and lesson) and the other ways in (#/explore)
  if (parts[0] === 'story') return { name: 'story', query, key: 'story' };
  if (parts[0] === 'explore') return { name: 'explore', query, key: 'explore' };
  if (parts[0] === 'chronicle') return { name: 'title', query, key: 'title' };
  if (parts[0] === 'pyramid') return { name: 'pyramid', view: parts[1] || 'landing', query, key: `pyramid:${parts[1] || ''}:${query.again ?? ''}` };
  if (parts[0] === 'unit' && parts[1]) return { name: 'unit', id: parts[1], query, key: `unit:${parts[1]}:${query.step ?? ''}:${query.again ?? ''}` };
  if (parts[0] === 'lesson' && parts[1]) return { name: 'lesson', id: parts[1], part: parts[2] ?? '0', query, key: `lesson:${parts[1]}:${parts[2] ?? 0}` };
  if (parts[0] === 'sheet' && parts[1]) return { name: 'sheet', id: parts[1], query, key: `sheet:${parts[1]}:${query.device ?? ''}` };
  if (parts[0] === 'about') return { name: 'about', query, key: 'about' };
  if (parts[0] === 'privacy') return { name: 'privacy', query, key: 'privacy' };
  if (parts[0] === 'settings') return { name: 'settings', query, key: 'settings' };
  if (parts[0] === 'end') return { name: 'end', query, key: 'end' };
  if (parts[0] === 'report') return { name: 'report', query, key: 'report' };
  if (parts[0] === 'contact') return { name: 'contact', query, key: `contact:${parts[1] || ''}` };
  if (parts[0] === 'abodes') return { name: 'abodes', query, key: 'abodes' };
  // the short guide, #/guide?step=<id>: one key for every step, so moving between steps never fades the page
  if (parts[0] === 'guide') return { name: 'guide', query, key: 'guide' };
  // story first: #/begin (choose a view, then where to start) and #/begin/next (where to go after the first story)
  if (parts[0] === 'begin') return { name: 'pyramid', view: parts[1] === 'next' ? 'begun' : 'begin', query, key: `begin:${parts[1] || ''}` };
  if (parts[0] === 'paths') return { name: 'paths', query, key: 'paths' };
  if (parts[0] === 'path' && parts[1]) return { name: 'paths', id: parts[1], query, key: `path:${parts[1]}` };
  // an address that leads nowhere says so, instead of quietly showing the start screen
  if (parts.length) return { name: 'missing', query, key: `missing:${path}` };
  return { name: 'pyramid', view: 'home', query, key: 'home' };
}

export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parse(hash);
}

/** Go to a route. `replace` takes the current page's place in the history, so Back skips a page that only passed the reader on. */
export function go(path, { replace = false } = {}) {
  if (replace) window.location.replace(`#${path}`);
  else window.location.hash = path;
}
