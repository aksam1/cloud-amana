import { go } from '../lib/router.js';
import { Icon } from './Ornaments.jsx';

const ITEMS = [
  { id: 'pyramid', label: 'Pyramid', icon: 'pyramid', to: '/' },
  { id: 'stories', label: 'Stories', icon: 'book', to: '/stories' },
  { id: 'map', label: 'Map', icon: 'map', to: '/map' },
  { id: 'progress', label: 'Progress', icon: 'bars', to: '/pyramid/progress' },
];

/**
 * The one menu every page shares. On a phone it is a tab bar along the bottom edge, where a thumb reaches
 * it (pages leave `pb-28` free for it); from the `sm` breakpoint up it sits inline where it is placed.
 * `here` marks the current section.
 */
export default function Nav({ here, tone = 'night' }) {
  const ink = tone === 'parchment';
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
                <Icon name={it.icon} className="h-[18px] w-[18px] shrink-0" />
                <span>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
