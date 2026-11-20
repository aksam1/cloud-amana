import { DOORS, fresh } from '../lib/discover.js';
import { go } from '../lib/router.js';
import { markFound, useStore } from '../lib/store.js';
import { Icon } from './Ornaments.jsx';

const name = (d, i) => (i > 0 ? d.title.replace(/^The /, 'the ') : d.title);
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/**
 * A quiet note when the story has opened a door in Explore that the reader has not been through yet. It never
 * opens anything by itself: Explore is one tap away, and × puts the note away (the doors stay open).
 */
export default function Unveiled({ className = '' }) {
  const news = useStore(fresh);
  const doors = DOORS.filter((d) => news[d.id]);
  if (!doors.length) return null;
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-gold/40 bg-[#3c2a12]/45 py-2 pl-4 pr-2 ${className}`}>
      <span className="nav-dot h-2 w-2 shrink-0 rounded-full bg-gold-hi" aria-hidden="true" />
      <p className="min-w-0 flex-1 font-body text-[1.05rem] leading-snug text-ivory/85">
        Newly open in Explore: <span className="text-gold-hi">{list(doors.map(name))}</span>.
      </p>
      <button type="button" className="hud-btn shrink-0" onClick={() => go('/explore')}>
        Explore
      </button>
      <button
        type="button"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ivory/55 hover:text-ivory"
        aria-label="Put this note away"
        onClick={() => markFound(...doors.map((d) => d.id))}
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
  );
}
