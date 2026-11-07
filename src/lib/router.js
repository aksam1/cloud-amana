// Hash routes: #/ (the pyramid: #/pyramid/placement|result|progress, #/unit/:id?step=) · #/chronicle (the
// chronicle's title page) · #/map?arrive=&from= · #/scene/:id (?beat=n opens at a moment, &still holds it,
// &t=0.5 holds it halfway through its timed motions)
// · #/lesson/:chapter/:part?then=<route> (the lesson after a part; ?then is where it continues)
// · #/sheet/:chapter or #/sheet/:sceneId (contact sheet of every beat, for reviewing compositions)
import { useEffect, useState } from 'react';

function parse(hash) {
  const [path, q] = hash.replace(/^#/, '').split('?');
  const parts = (path || '/').split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(q || ''));
  if (parts[0] === 'map') return { name: 'map', query, key: 'map' };
  if (parts[0] === 'scene' && parts[1]) return { name: 'scene', id: parts[1], query, key: `scene:${parts[1]}:${query.beat ?? ''}:${'still' in query}:${query.t ?? ''}` };
  if (parts[0] === 'chronicle') return { name: 'title', query, key: 'title' };
  if (parts[0] === 'pyramid') return { name: 'pyramid', view: parts[1] || 'landing', query, key: `pyramid:${parts[1] || ''}:${query.again ?? ''}` };
  if (parts[0] === 'unit' && parts[1]) return { name: 'unit', id: parts[1], query, key: `unit:${parts[1]}:${query.step ?? ''}:${query.again ?? ''}` };
  if (parts[0] === 'lesson' && parts[1]) return { name: 'lesson', id: parts[1], part: parts[2] ?? '0', query, key: `lesson:${parts[1]}:${parts[2] ?? 0}` };
  if (parts[0] === 'sheet' && parts[1]) return { name: 'sheet', id: parts[1], query, key: `sheet:${parts[1]}:${query.device ?? ''}` };
  return { name: 'pyramid', view: 'landing', query, key: 'pyramid:' };
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

export function go(path) {
  window.location.hash = path;
}
