import { Shell } from './Pyramid.jsx';
import ReportForm from './ReportForm.jsx';

/**
 * Report a mistake (#/report): its own page, so it can be reached from anywhere, and so the place
 * the mistake was found can be carried with it (`?where=…`).
 */
export default function Report({ where = '' }) {
  return (
    <Shell here="about" back="/" title="Report a mistake">
      <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-tight text-gold-hi">Report a mistake</h1>
      <p className="mt-2 font-body text-[1.12rem] leading-snug text-ivory/80">
        Especially about a verse, a saying or a detail of a story.
      </p>
      <div className="mt-5">
        <ReportForm kind="mistake" where={where} />
      </div>
    </Shell>
  );
}
