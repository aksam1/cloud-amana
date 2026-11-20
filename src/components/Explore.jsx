import { go } from '../lib/router.js';
import { Icon } from './Ornaments.jsx';
import { Shell } from './Pyramid.jsx';

// The other doors into the same stories. None of them is a step on the path: the path is Story.
const DOORS = [
  { title: 'The map of time', line: 'Every prophet on one thread of light. Tap a seal to watch its stories.', icon: 'map', to: '/map' },
  { title: 'Paths', line: 'The same stories by a theme: the women in them, the creatures, the dreams, the prayers.', icon: 'list', to: '/paths' },
  { title: 'The pyramid', line: 'Three levels of faith, made of short lessons. A few private questions can suggest where to begin.', icon: 'pyramid', to: '/pyramid' },
  { title: 'The two abodes', line: 'Paradise and the Fire as the Quran describes them. Verses only.', icon: 'diamond', to: '/abodes' },
  { title: 'The short guide', line: 'What is where, one step at a time.', icon: 'help', to: '/guide' },
];

/** #/explore: the other ways in, side by side. Nothing here is required, and nothing here opens by itself. */
export default function Explore() {
  return (
    <Shell here="explore" back="/" stars>
      <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-tight text-gold-hi">Explore</h1>
      <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/80">Other ways into the same stories. Nothing here is required.</p>
      <ul className="mt-5 grid gap-3">
        {DOORS.map((d) => (
          <li key={d.to}>
            <button type="button" onClick={() => go(d.to)} className="flex w-full items-start gap-3 rounded-xl border border-gold/35 bg-black/30 px-4 py-3 text-left transition-colors hover:border-gold-hi">
              <Mark icon={d.icon} />
              <span className="min-w-0">
                <span className="block font-body text-[1.22rem] font-semibold leading-tight text-gold-hi">{d.title}</span>
                <span className="mt-1 block font-body text-[1.05rem] leading-snug text-ivory/80">{d.line}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="hud-btn mt-6 self-start" onClick={() => go('/story')}>
        <Icon name="book" className="h-4 w-4" />
        Or follow the whole story in order
      </button>
    </Shell>
  );
}

/** A door's round seal (the two abodes keep their diamond: one shape above, one below, as in the guide). */
function Mark({ icon }) {
  return (
    <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/45 bg-[radial-gradient(circle,#3c2a12_0%,#120d0a_80%)] text-gold-hi" aria-hidden="true">
      {icon === 'diamond' ? (
        <svg viewBox="-12 -12 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M0 -10 L8 0 L0 10 L-8 0 Z" />
          <path d="M-8 0 H8" />
        </svg>
      ) : (
        <Icon name={icon} className="h-5 w-5" />
      )}
    </span>
  );
}
