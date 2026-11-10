import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ayah, expandRef } from '../lib/story.js';
import { roman } from '../lib/geo.js';
import { Icon, Rule, SourceBadge } from './Ornaments.jsx';

/**
 * The parchment chronicle: the scene's narration inks in line by line as the beats play,
 * with the full ayat one tap away. Opening the ayat pauses the cinematic (the player reads
 * `ayahOpen`), so nobody is rushed while reading scripture. `onTop` hears how far up the screen it
 * reaches, so a verse in the lower third can sit just above it.
 */
export function Chronicle({ scene, lines, open, onToggle, ayahOpen, onAyah, onTop }) {
  const refs = (scene.ayahs || []).flatMap(expandRef);
  const box = useRef(null);
  useEffect(() => {
    const el = box.current;
    if (!el || !onTop) return undefined;
    const measure = () => {
      const stage = el.offsetParent?.getBoundingClientRect();
      if (stage) onTop(Math.round(stage.bottom - el.getBoundingClientRect().top));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [onTop]);
  return (
    <div ref={box} className="pointer-events-auto absolute bottom-[84px] left-3 right-3 z-30 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[400px] short:bottom-2 short:left-2 short:w-[min(50vw,430px)]">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.section
            key="open"
            aria-label="Chronicle"
            className="parchment ruled cartouche thin-scroll max-h-[44vh] overflow-y-auto px-5 pb-4 pt-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,.8)] sm:max-h-[52vh] short:max-h-[36vh] short:px-4 short:pb-2 short:pt-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35 }}
          >
            <header className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="caps text-[0.6rem] text-ink-soft short:hidden">Scene {roman(scene.order)}</div>
                <h2 className="font-display text-[1.02rem] font-semibold leading-tight text-ink">{scene.title}</h2>
              </div>
              <SourceBadge source={scene.source} />
              <button type="button" onClick={onToggle} className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-black/5" aria-label="Fold the chronicle away">
                <Icon name="chevron" className="h-4 w-4" />
              </button>
            </header>

            <div className="mt-2 space-y-1.5 font-body text-[1.06rem] leading-snug" aria-live="polite">
              {lines.length === 0 && <p className="italic text-ink-soft/80">The page waits for its first words…</p>}
              {lines.map((line, i) => (
                <motion.p key={line} initial={{ opacity: 0, filter: 'blur(3px)' }} animate={{ opacity: i === lines.length - 1 ? 1 : 0.6, filter: 'blur(0px)' }} transition={{ duration: 1 }} className="text-ink">
                  {line}
                </motion.p>
              ))}
            </div>

            {(refs.length > 0 || scene.notes?.length > 0 || scene.art?.length > 0) && (
              <>
                <Rule className="mx-auto my-3 h-3 w-40 text-[#7a5a2e] short:hidden" />
                <button type="button" onClick={onAyah} aria-expanded={ayahOpen} className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md px-1 py-1.5 text-left hover:bg-black/5">
                  <span className="caps text-[0.66rem] text-ink">
                    {refs.length ? `The full ${refs.length === 1 ? 'ayah' : `ayat (${refs.length})`}` : 'Sources'}
                    {refs.length > 0 && (scene.notes?.length > 0 || scene.art?.length > 0) && ' & sources'}
                  </span>
                  <span className="flex items-center gap-2 text-[0.7rem] italic text-ink-soft">
                    {ayahOpen ? 'paused while you read' : ''}
                    <Icon name="chevron" className={`h-4 w-4 transition-transform ${ayahOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {ayahOpen && (
                    <motion.div key="ayat" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
                      <div className="space-y-4 pb-1 pt-2">
                        {refs.map((ref) => {
                          const a = ayah(ref);
                          if (!a) return null;
                          return (
                            <article key={ref}>
                              <div className="caps text-[0.58rem] text-ink-soft">
                                {a.surah} · {ref}
                              </div>
                              <p lang="ar" className="quran mt-1 text-[1.5rem] text-ink">
                                {a.ar}
                              </p>
                              <p className="font-body text-[1rem] leading-snug text-ink">{a.en}</p>
                            </article>
                          );
                        })}
                        {[
                          ['notes', 'From tradition (hadith and classical narrations)'],
                          ['art', 'Artistic choices'],
                        ].map(
                          ([key, label]) =>
                            scene[key]?.length > 0 && (
                              <div key={key} className="rounded-md border border-[#8a6a4e]/40 bg-[#5a3d22]/5 p-3">
                                <div className="caps mb-1 text-[0.58rem] text-ink-soft">{label}</div>
                                <ul className="list-disc space-y-1 pl-4 font-body text-[0.98rem] leading-snug text-ink">
                                  {scene[key].map((n) => (
                                    <li key={n}>{n}</li>
                                  ))}
                                </ul>
                              </div>
                            ),
                        )}
                        {refs.length > 0 && <p className="font-body text-[0.85rem] italic text-ink-soft">Translation: Sahih International.</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.section>
        ) : (
          <motion.button
            key="closed"
            type="button"
            onClick={onToggle}
            className="parchment cartouche flex max-w-full items-center gap-3 px-4 py-2.5 text-left shadow-[0_12px_30px_-12px_rgba(0,0,0,.8)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            aria-label="Open the chronicle"
          >
            <Icon name="book" className="h-4 w-4 shrink-0 text-ink-soft" />
            <span className="truncate font-body text-[0.98rem] italic text-ink">{lines.at(-1) || scene.title}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
