import { useState } from 'react';
import { IS_WEB } from '../lib/pwa.js';

/**
 * Report a mistake (web build only).
 *
 * The form posts to Netlify's own form handling: the same form is declared as a hidden static form
 * in index.html, so Netlify finds it when it builds the site, and this page posts to it as
 * application/x-www-form-urlencoded. Nothing is sent anywhere else.
 *
 * On the artifact build there is no host to receive it, so the form is not shown at all.
 */
export default function ReportForm({ where = '', onClose }) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | failed
  const [detail, setDetail] = useState('');

  if (!IS_WEB) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim() || state === 'sending') return;
    setState('sending');
    try {
      const body = new URLSearchParams({
        'form-name': 'report',
        where,
        message: message.trim(),
        email: email.trim(),
      });
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('sent');
      setMessage('');
      setEmail('');
    } catch (err) {
      setState('failed');
      setDetail('The report could not be sent. Please try again in a moment.');
    }
  };

  if (state === 'sent') {
    return (
      <div className="rounded-2xl border border-gold/25 bg-black/25 p-5" role="status">
        <h3 className="font-display text-[1.15rem] font-semibold text-gold-hi">Thank you</h3>
        <p className="mt-1 font-body text-[1.08rem] leading-snug text-ivory/85">The mistake has been sent. It will be read.</p>
        {onClose && (
          <button type="button" className="hud-btn mt-3" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="rounded-2xl border border-gold/25 bg-black/25 p-5" onSubmit={submit}>
      <h3 className="font-display text-[1.15rem] font-semibold text-gold-hi">Report a mistake</h3>
      <p className="mt-1 font-body text-[1.05rem] leading-snug text-ivory/75">
        {where ? <>In <span className="text-ivory/90">{where}</span>. </> : null}What is wrong?
      </p>
      <label className="mt-3 block font-body text-[1rem] text-ivory/70" htmlFor="report-message">
        What is wrong
      </label>
      <textarea
        id="report-message"
        name="message"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        className="mt-1 w-full rounded-xl border border-gold/30 bg-black/40 px-3 py-2 font-body text-[1.05rem] text-ivory placeholder:text-ivory/40"
        placeholder="A verse, a saying, a detail of a story…"
      />
      <label className="mt-3 block font-body text-[1rem] text-ivory/70" htmlFor="report-email">
        Your email, if you would like a reply (optional)
      </label>
      <input
        id="report-email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1 w-full rounded-xl border border-gold/30 bg-black/40 px-3 py-2 font-body text-[1.05rem] text-ivory placeholder:text-ivory/40"
        placeholder="you@example.com"
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-gold" disabled={state === 'sending' || !message.trim()}>
          {state === 'sending' ? 'Sending…' : 'Send the report'}
        </button>
        {onClose && (
          <button type="button" className="hud-btn" onClick={onClose}>
            Cancel
          </button>
        )}
      </div>
      {state === 'failed' && (
        <p role="alert" className="mt-2 font-body text-[1rem] text-[#f0b3a6]">
          {detail}
        </p>
      )}
      <p className="mt-3 font-body text-[0.95rem] italic leading-snug text-ivory/50">
        What you type and the page it is about go to this site&rsquo;s host, Netlify, which also notes the sender&rsquo;s
        internet address and browser to keep out spam.
      </p>
    </form>
  );
}
