import { go } from '../lib/router.js';
import { inMode, useMode } from '../lib/words.js';
import { DISCLAIMER } from '../lib/pyramid.js';
import { CONTACT, MAKER, share, shareMessage } from '../lib/site.js';
import { useState } from 'react';
import { Shell } from './Pyramid.jsx';

const H = ({ children }) => <h2 className="mt-6 font-display text-[1.15rem] font-semibold text-gold-hi">{children}</h2>;
const P = ({ children }) => <p className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">{children}</p>;

/**
 * What this site is, where its words come from, what is still unchecked, and what it stores: the page a
 * careful visitor looks for before trusting anything else here. Also the "no such page" screen (`missing`).
 */
export default function About({ missing = false }) {
  const { mode } = useMode();
  const say = (t) => inMode(t, mode);
  const [note, setNote] = useState('');

  if (missing) {
    return (
      <Shell here="about">
        <div className="my-auto py-10 text-center">
          <h1 className="font-display text-[1.7rem] font-semibold text-gold-hi">That page does not exist</h1>
          <p className="mx-auto mt-3 max-w-[36ch] font-body text-[1.12rem] leading-snug text-ivory/80">The address may be mistyped, or the page may have moved. Your progress is safe.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-gold" onClick={() => go('/')} autoFocus>
              Go to the start
            </button>
            <button type="button" className="hud-btn" onClick={() => go('/stories')}>
              Watch the stories
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell here="about" back="/" title="About">
      <h1 className="font-display text-[1.9rem] font-semibold leading-tight text-gold-hi">About Amanah</h1>
      <P>{say('Amanah tells the stories of the prophets as Islam teaches them, from the creation onward, and uses each story to teach one part of the faith. It is free, it has no adverts, and it needs no account.')}</P>
      <P>The name is an Arabic word for a trust: something precious placed in your care. The Quran uses it in 33:72.</P>
      <P>{MAKER || 'Who made this: details will be added here.'}</P>

      <H>Who it is for</H>
      <P>{say('Muslims who want to know the stories and what they teach, and anyone curious about what Muslims believe. You choose a view when you begin and can switch at any time. The stories and verses are the same in both; the Muslim view says Allah where the other says God, and adds a short prayer to learn.')}</P>

      <H>Where the words come from</H>
      <ul className="mt-2 list-disc space-y-2 pl-5 font-body text-[1.08rem] leading-snug text-ivory/85">
        <li>
          The Quran is shown in Arabic and in English. The Arabic is the Uthmani text of the{' '}
          <a href="https://tanzil.net" target="_blank" rel="noopener noreferrer" className="text-gold-hi underline decoration-gold/50 underline-offset-4">
            Tanzil Project
          </a>
          . The English is the Sahih International translation.
        </li>
        <li>Verses are placed from a checked file by their reference, word for word. They are never typed in by hand, and where only part of a verse is shown, an ellipsis (…) marks what was left out.</li>
        <li>Sayings of the Prophet ﷺ carry the label “Awaiting scholar review” until a qualified reviewer has checked the wording. Today every saying still carries that label.</li>
        <li>Scenes marked “Tradition” draw on hadith and classical narrations, not the Quran. Each scene lists its sources, and says which details of the picture are imagined.</li>
      </ul>

      <H>What you will never see here</H>
      <P>{say('God is never depicted, in any form. The prophets appear only as distant figures of light, never with a face. There is no music, and no violence or suffering is shown on screen.')}</P>

      <H>What is still being written</H>
      <P>The chapters on the Final Messenger ﷺ, the signs of the Hour and the Day of Judgment are not written yet. The map marks them “Soon”.</P>

      <H>Your privacy</H>
      <P>Your answers, progress and notes are stored only in this browser, on your device. Nothing is sent to us or to anyone else. There are no cookies, no tracking and no adverts. You can erase everything under Progress, “Delete my data”.</P>
      <P>A link to quran.com opens that site, which has its own privacy terms.</P>

      <H>What it is not</H>
      <P>{DISCLAIMER} The meters show what you have understood in these lessons, nothing more. For rulings and personal questions, ask a scholar you trust.</P>

      <H>Found a mistake?</H>
      {CONTACT ? (
        <P>
          Please tell us, especially about a verse, a saying or a detail of a story.{' '}
          <a href={CONTACT} className="text-gold-hi underline decoration-gold/50 underline-offset-4">
            Report a mistake
          </a>
        </P>
      ) : (
        <P>A contact address for reporting mistakes will be added here.</P>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-gold" onClick={() => go('/stories')}>
          Watch the stories
        </button>
        <button type="button" className="hud-btn" onClick={async () => setNote(shareMessage(await share()))}>
          Share Amanah
        </button>
      </div>
      {note && (
        <p role="status" className="mt-2 font-body text-[1rem] italic text-ivory/70">
          {note}
        </p>
      )}
    </Shell>
  );
}
