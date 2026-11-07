import { go } from '../lib/router.js';
import { Icon } from './Ornaments.jsx';

const ITEMS = [
  { id: 'pyramid', label: 'Pyramid', icon: 'pyramid', to: '/' },
  { id: 'stories', label: 'Stories', icon: 'book', to: '/stories' },
  { id: 'map', label: 'Map', icon: 'map', to: '/map' },
  { id: 'progress', label: 'Progress', icon: 'bars', to: '/pyramid/progress' },
];

/**
 * The one navigation bar every page shares, so there is always a way home and to every part of the app.
 * `here` marks the current section. On a phone it is a compact row of four; on wider screens the same row.
 */
export default function Nav({ here, tone = 'night' }) {
  const ink = tone === 'parchment';
  return (
    <nav aria-label="Main" className="relative z-20">
      <ul className={`mx-auto flex max-w-[600px] items-stretch justify-between gap-0.5 rounded-[28px] border px-1 py-1 sm:gap-1 sm:rounded-full sm:px-1.5 ${ink ? 'border-[#8a6a4e]/40 bg-[#5a3d22]/8' : 'border-gold/25 bg-black/40 backdrop-blur-md'}`}>
        {ITEMS.map((it) => {
          const on = it.id === here;
          return (
            <li key={it.id} className="flex-1">
              <a
                href={`#${it.to}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(it.to);
                }}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-full px-1 font-display text-[0.6rem] uppercase tracking-[0.08em] transition-colors sm:flex-row sm:gap-1.5 sm:px-2 sm:text-[0.72rem] sm:tracking-[0.12em] ${
                  on ? (ink ? 'bg-[#a5772f]/20 text-ink' : 'bg-[#3c2a12] text-gold-hi') : ink ? 'text-ink-soft hover:text-ink' : 'text-ivory/70 hover:text-ivory'
                }`}
              >
                <Icon name={it.icon} className="h-4 w-4 shrink-0" />
                <span>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
