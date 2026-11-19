import { useEffect, useState } from 'react';
import { IS_WEB, canInstall, promptInstall, standalone, watchForInstall } from '../lib/pwa.js';
import { setPref, useStore } from '../lib/store.js';

/**
 * The invitation to install the app (web build only).
 *
 * It is offered in Settings at any time, and here on the home page once, after the reader has
 * watched at least one scene — never on the very first visit, and never twice: the answer is
 * remembered in the reader's preferences.
 */
export default function InstallInvite({ where = '' }) {
  const prefs = useStore((s) => s.prefs);
  const [offer, setOffer] = useState(false);
  const [done, setDone] = useState(false);

  const seen = useStore((s) => Object.keys(s.seen || {}).length);
  const asked = prefs.installAsked;

  useEffect(() => {
    if (!IS_WEB) return undefined;
    const off = watchForInstall();
    const check = () => setOffer(canInstall());
    check();
    window.addEventListener('amanah:installable', check);
    return () => {
      off();
      window.removeEventListener('amanah:installable', check);
    };
  }, []);

  // the invitation is offered on the home page only once the reader has watched something
  useEffect(() => {
    if (!IS_WEB || asked || done) return;
    if (!where) return;
    if (seen < 1) return;
    if (standalone()) return;
    setOffer(true);
  }, [IS_WEB, asked, done, seen, where]);

  if (!IS_WEB || asked || !offer) return null;

  const decline = () => {
    setDone(true);
    setPref('installAsked', true);
  };

  return (
    <div className="mt-4 w-full max-w-[420px] rounded-2xl border border-gold/25 bg-black/35 p-4 text-left" role="note">
      <p className="font-body text-[1.08rem] leading-snug text-ivory/85">
        {canInstall() ? 'You can keep Amanah on this device, like an app.' : 'To keep Amanah on this device: Share, then Add to Home Screen.'}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {canInstall() && (
          <button
            type="button"
            className="hud-btn"
            onClick={async () => {
              const how = await promptInstall();
              setDone(true);
              setPref('installAsked', true);
              if (how === 'unavailable') setOffer(false);
            }}
          >
            Install Amanah
          </button>
        )}
        <button type="button" className="hud-btn" onClick={decline}>
          Not now
        </button>
        <button type="button" className="hud-btn" onClick={() => window.location.hash = '/settings'}>
          Settings
        </button>
      </div>
    </div>
  );
}
