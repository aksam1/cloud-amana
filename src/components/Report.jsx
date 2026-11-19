import { useState } from 'react';
import { go } from '../lib/router.js';
import { IS_WEB } from '../lib/pwa.js';
import ReportForm from './ReportForm.jsx';
import { Shell, Disclaimer } from './Pyramid.jsx';

/**
 * Report a mistake (#/report): its own page, so it can be reached from anywhere, and so the place
 * the mistake was found can be carried with it (`?where=…`).
 */
export default function Report({ where = '' }) {
  const [open, setOpen] = useState(true);

  if (!IS_WEB) {
    return (
      <Shell here="about" back="/" title="Report a mistake">
        <h1 className="mt-6 font-body text-[1.6rem] font-semibold text-gold-hi">Reporting a mistake needs the web site</h1>
        <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/80">
          This copy of Amanah cannot send anything. On the web site, a mistake can be sent to the person who makes the app.
        </p>
        <button type="button" className="btn-gold mt-5 self-start" onClick={() => go('/')}>
          Back home
        </button>
      </Shell>
    );
  }

  return (
    <Shell here="about" back="/" title="Report a mistake">
      <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-tight text-gold-hi">Report a mistake</h1>
      <p className="mt-2 font-body text-[1.12rem] leading-snug text-ivory/80">
        Especially about a verse, a saying or a detail of a story.
      </p>
      <div className="mt-5">
        {open ? (
          <ReportForm where={where} onClose={() => setOpen(false)} />
        ) : (
          <button type="button" className="btn-gold" onClick={() => setOpen(true)}>
            Write the report
          </button>
        )}
      </div>
      <Disclaimer />
    </Shell>
  );
}
