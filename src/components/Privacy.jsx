import { go } from '../lib/router.js';
import { Shell } from './Pyramid.jsx';

/**
 * What this site stores and where (#/privacy). Plain English, one section at a time: the reader
 * should be able to check that nothing about them leaves the device, and how to undo what is kept.
 */
export default function Privacy() {
  return (
    <Shell here="about" back="/" title="Privacy">
      <h1 className="mt-4 font-display text-[1.9rem] font-semibold leading-tight text-gold-hi">Your privacy</h1>
      <p className="mt-2 font-body text-[1.12rem] leading-snug text-ivory/80">Everything this app knows about you stays on this device.</p>

      <section className="mt-6" aria-labelledby="p1">
        <h2 id="p1" className="font-display text-[1.2rem] font-semibold text-gold-hi">
          What is stored
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-[1.08rem] leading-snug text-ivory/85">
          <li>Which scenes you have watched, and which map events the story has reached.</li>
          <li>Which lessons you have finished, and the answers you gave.</li>
          <li>Your private reflections, in your own words.</li>
          <li>Your settings: the view you chose, sound, and whether the captions show.</li>
        </ul>
        <p className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">
          It is all kept in this browser&rsquo;s storage, on this device. None of it is sent to us or to anyone else.
        </p>
      </section>

      <section className="mt-6" aria-labelledby="p2">
        <h2 id="p2" className="font-display text-[1.2rem] font-semibold text-gold-hi">
          No accounts, no tracking
        </h2>
        <p className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">
          There are no accounts yet, no analytics, no adverts, no cookies and no requests to any other company. The fonts are
          bundled with the app, so nothing is fetched from a font service either.
        </p>
        <p className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">
          The site&rsquo;s host, Netlify, sees each visitor&rsquo;s internet address, as every web host does, to deliver the
          pages. A link to quran.com opens that site, which has its own privacy terms.
        </p>
      </section>

      <section className="mt-6" aria-labelledby="p3">
        <h2 id="p3" className="font-display text-[1.2rem] font-semibold text-gold-hi">
          The mistake report
        </h2>
        <p className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">
          If you choose to report a mistake, the words you type, the page it is about, and an email address if you give one
          are sent to this site&rsquo;s host and read by the people who make Amanah. The host also notes the sender&rsquo;s
          internet address and browser, to keep out spam. The report is used for nothing else.
        </p>
      </section>

      <section className="mt-6" aria-labelledby="p4">
        <h2 id="p4" className="font-display text-[1.2rem] font-semibold text-gold-hi">
          Back up, restore, delete
        </h2>
        <p className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">
          Clearing your browser&rsquo;s data erases your progress. In Settings you can save a backup file, bring one back, or
          delete everything the app has stored.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-gold" onClick={() => go('/settings')}>
            Open Settings
          </button>
          <button type="button" className="hud-btn" onClick={() => go('/')}>
            Back home
          </button>
        </div>
      </section>

      {/* The sync batch adds its own section here: signing in and keeping progress on more than one
          device. Until then, everything stays on this device. */}
    </Shell>
  );
}
