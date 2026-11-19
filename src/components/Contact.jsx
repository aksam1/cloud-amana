import { useState } from 'react';
import { go } from '../lib/router.js';
import { IS_WEB } from '../lib/pwa.js';
import { kindFrom } from '../lib/contact.js';
import ReportForm from './ReportForm.jsx';
import { Disclaimer, Shell } from './Pyramid.jsx';

/**
 * Write to the people who make Amanah (#/contact): a mistake, a privacy request, a question, or
 * something else. The kind may be chosen here or carried in from a link (`?kind=…`).
 */
export default function Contact({ kind = '' }) {
  const [open, setOpen] = useState(true);
  const which = kindFrom(kind);

  if (!IS_WEB) {
    return (
      <Shell here="about" back="/" title="Contact">
        <h1 className="mt-6 font-body text-[1.6rem] font-semibold text-gold-hi">Writing to us needs the web site</h1>
        <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/80">
          This copy of Amanah cannot send anything. On the web site, a message can be sent to the person who makes the app.
        </p>
        <button type="button" className="btn-gold mt-5 self-start" onClick={() => go('/')}>
          Back home
        </button>
      </Shell>
    );
  }

  return (
    <Shell here="about" back="/" title="Contact">
      <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-tight text-gold-hi">Write to us</h1>
      <p className="mt-2 font-body text-[1.12rem] leading-snug text-ivory/80">A mistake, a question, or a request about your data.</p>
      <div className="mt-5">
        {open ? (
          <ReportForm kind={which} onClose={() => setOpen(false)} title="Your message" lead="What would you like to say?" />
        ) : (
          <button type="button" className="btn-gold" onClick={() => setOpen(true)}>
            Write the message
          </button>
        )}
      </div>
      <Disclaimer />
    </Shell>
  );
}
