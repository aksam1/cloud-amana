import { go } from '../lib/router.js';
import { IS_WEB } from '../lib/pwa.js';
import { USAGE_ON } from '../lib/usage.js';
import { MAKER, PRIVACY_EFFECTIVE, WEB_SITE } from '../lib/site.js';
import { Shell } from './Pyramid.jsx';

const P = ({ children }) => <p className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">{children}</p>;
const L = ({ children }) => <li className="font-body text-[1.08rem] leading-snug text-ivory/85">{children}</li>;
const H = ({ id, children }) => (
  <h2 id={id} className="font-display text-[1.2rem] font-semibold text-gold-hi">
    {children}
  </h2>
);

/**
 * What this site collects and where (#/privacy). Plain English, one subject at a time: the reader
 * should be able to check every sentence, and see how to undo what is kept.
 *
 * This page changes in the same commit as anything that sends data away. If a sentence here is no
 * longer true, the sentence is wrong, not the page.
 *
 * Two builds read it. The web site (IS_WEB, USAGE_ON) can send the counts and the contact form; the
 * hosted artifact sends nothing at all, and its page says only that.
 */
export default function Privacy() {
  return (
    <Shell here="about" back="/" title="Privacy">
      <h1 className="mt-4 font-display text-[1.9rem] font-semibold leading-tight text-gold-hi">Your privacy</h1>
      <p className="mt-2 font-body text-[1.12rem] leading-snug text-ivory/80">
        This page says everything Amanah collects, in plain words. It takes effect on {PRIVACY_EFFECTIVE}, and when it
        changes, that date changes.
      </p>

      <section className="mt-6" aria-labelledby="p1">
        <H id="p1">On this device</H>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <L>Which scenes you have watched, and which map events the story has reached.</L>
          <L>Which lessons you have finished, and the answers you gave.</L>
          <L>Your private reflections, in your own words.</L>
          <L>
            Your settings: the view you chose, sound, whether the captions show
            {USAGE_ON ? ', and whether you share usage counts' : ''}.
          </L>
        </ul>
        <P>
          All of it is kept in this browser&rsquo;s storage, on this device, and none of it is sent to us or to anyone
          else. In Settings you can save a backup file, bring one back, or delete everything.
        </P>
      </section>

      {USAGE_ON ? (
        <section className="mt-6" aria-labelledby="p2">
          <H id="p2">Usage counts</H>
          <P>
            Amanah can count what people use, so the app can be improved. The counts are anonymous, and you can turn
            them off at any time in Settings.
          </P>
          <P>What is counted:</P>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <L>Which pages were opened, and which stories, lessons and units were started and finished.</L>
            <L>Where a story was left: which moment of it.</L>
            <L>Whether a lesson question was right on the first try. The questions are about the story, never about you.</L>
            <L>The kind of device (phone, tablet or desktop), the browser language, and whether the app is running installed.</L>
            <L>The name of the site you came from, and nothing more about it.</L>
            <L>How long the page was open, and any error, with anything personal removed from it.</L>
          </ul>
          <P>What is never sent:</P>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <L>Your reflections, the placement answers, or your notes.</L>
            <L>Anything you type.</L>
            <L>The view you chose, Muslim or curious: that says something about a person&rsquo;s faith.</L>
            <L>Any identifier or cookie. There is none, so there is nothing that follows you.</L>
          </ul>
          <P>Each visit&rsquo;s counts are a separate record. Nothing links one visit to another, or to a person.</P>
          <P>
            The counts are stored in Google Cloud Firestore, in the United States, and each record is deleted about 90
            days after it was sent.
          </P>
          <P>
            To turn the counts off: Settings, then &ldquo;Share anonymous usage counts&rdquo;. Nothing more is sent, and
            the first day this browser was here is forgotten.
          </P>
          <P>
            If your browser sends Global Privacy Control or Do Not Track, Amanah sends nothing at all, whatever the
            switch says.
          </P>
        </section>
      ) : (
        <section className="mt-6" aria-labelledby="p2">
          <H id="p2">Nothing is sent</H>
          <P>
            This copy of Amanah sends nothing anywhere: no counts, no messages, no requests to any other company. The web
            site at {new URL(WEB_SITE).host} can send anonymous usage counts, and its own privacy page describes them.
          </P>
        </section>
      )}

      {IS_WEB && (
        <section className="mt-6" aria-labelledby="p3">
          <H id="p3">The contact form</H>
          <P>
            If you write to us, we get what you wrote, the kind you chose (a mistake, a privacy request, a question, or
            something else), the page it is about, and an email address if you gave one. The site&rsquo;s host, Netlify,
            receives it, filters out spam, and notes the sender&rsquo;s internet address and browser to do so. The
            message is used for nothing but answering it, and is deleted once it has been dealt with.
          </P>
          <P>Please don&rsquo;t include private details. If you&rsquo;re under 13, ask a parent to write for you.</P>
        </section>
      )}

      {IS_WEB && (
        <section className="mt-6" aria-labelledby="p4">
          <H id="p4">Who else is involved</H>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <L>Netlify, which hosts the site and receives the contact form.</L>
            {USAGE_ON && <L>Google Cloud Firestore, which holds the usage counts.</L>}
          </ul>
          <P>
            Their servers see the internet address each request comes from, as any server does. It is not part of the
            counts, and Amanah does not keep it.
          </P>
          <P>
            There are no adverts, no cookies, no third-party trackers, and nothing is sold or shared for advertising. No
            profiles are made, and nothing is decided automatically about you. The fonts are bundled with the app, so
            nothing is fetched from a font service. A link to quran.com opens that site, which has its own privacy terms.
          </P>
        </section>
      )}

      <section className="mt-6" aria-labelledby="p5">
        <H id="p5">Children</H>
        <P>
          Amanah is for a general audience and is not directed at children under 13.
          {USAGE_ON ? ' The counts are anonymous, so nothing personal is collected through them.' : ''}
          {IS_WEB ? ' If you are under 13, please ask a parent to write to us for you.' : ''}
        </P>
      </section>

      <section className="mt-6" aria-labelledby="p6">
        <H id="p6">Your rights</H>
        <P>
          Wherever you live, you can see, correct or delete your data. The data on this device is yours to manage: the
          &ldquo;Delete my data&rdquo; button in Settings erases it.
          {IS_WEB ? ' For anything else, write to us and we answer within 45 days.' : ''}
        </P>
        {USAGE_ON && (
          <P>The anonymous counts hold nothing that points to a person, so they cannot be looked up for one person.</P>
        )}
      </section>

      {IS_WEB && (
        <section className="mt-6" aria-labelledby="p7">
          <H id="p7">Security</H>
          <P>
            What is sent is sent over an encrypted connection, and the counts and messages can be read only by the person
            who makes Amanah.
          </P>
        </section>
      )}

      <section className="mt-6" aria-labelledby="p8">
        <H id="p8">Who made it</H>
        <P>{MAKER}</P>
        <div className="mt-3 flex flex-wrap gap-2">
          {IS_WEB && (
            <button type="button" className="btn-gold" onClick={() => go('/contact?kind=privacy')}>
              Make a privacy request
            </button>
          )}
          <button type="button" className="hud-btn" onClick={() => go('/settings')}>
            Open Settings
          </button>
          <button type="button" className="hud-btn" onClick={() => go('/')}>
            Back home
          </button>
        </div>
      </section>

      {/* The sync batch adds its own section here: signing in and keeping progress on more than one
          device. Until then, there are no accounts and everything stays on this device. */}
    </Shell>
  );
}
