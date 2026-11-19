import { useEffect, useRef, useState } from 'react';
import { go } from '../lib/router.js';
import { ambience } from '../lib/audio.js';
import { countsOf, deleteAllData, exportState, mergeStates, replaceState, resetProgress, setPref, useStore, validateBackup } from '../lib/store.js';
import { IS_WEB, cacheEverything, canInstall, isCachedFully, promptInstall, standalone, storageSize, watchForInstall } from '../lib/pwa.js';
import { forgetUsage, track, trackingOff, usageAvailable } from '../lib/usage.js';
import { quranLink } from '../lib/site.js';
import { ModePicker } from './ModePicker.jsx';
import ReportForm from './ReportForm.jsx';
import { Disclaimer, Shell } from './Pyramid.jsx';
import { Icon } from './Ornaments.jsx';

/**
 * Settings (#/settings): the view, the watching, the device, and the reader's own progress.
 * Everything here is on the page itself; the only things that ever leave the device are the
 * anonymous usage counts (if the reader allows them) and a message the reader chooses to send.
 */

const Section = ({ title, children, note }) => (
  <section className="mt-6 rounded-2xl border border-gold/20 bg-black/25 p-5" aria-labelledby={`s-${title.replace(/\W+/g, '-').toLowerCase()}`}>
    <h2 id={`s-${title.replace(/\W+/g, '-').toLowerCase()}`} className="font-display text-[1.15rem] font-semibold text-gold-hi">
      {title}
    </h2>
    {note && <p className="mt-1 font-body text-[1rem] italic leading-snug text-ivory/55">{note}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

// A switch that reads as one, and is one button to a keyboard.
function Switch({ label, on, onChange, hint, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gold/10 py-2 last:border-0">
      <span className="min-w-0">
        <span className="block font-body text-[1.1rem] leading-tight text-ivory/90">{label}</span>
        {hint && <span className="block font-body text-[0.98rem] italic leading-snug text-ivory/55">{hint}</span>}
      </span>
      <button
        type="button"
        className={`hud-btn shrink-0 ${on ? 'text-gold-hi' : ''}`}
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        data-tap={on ? 'off' : 'on'}
        onClick={() => !disabled && onChange(!on)}
      >
        {on ? 'On' : 'Off'}
      </button>
    </div>
  );
}

export default function Settings() {
  const state = useStore();
  const prefs = state.prefs || {};
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(null); // the backup being restored
  const [report, setReport] = useState(false);

  // the device: install, and the whole story kept for offline
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(standalone());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [size, setSize] = useState(0);

  useEffect(() => {
    if (!IS_WEB) return undefined;
    const off = watchForInstall();
    setInstallable(canInstall());
    const done = () => {
      setSaved(true);
      setSaving(false);
      setProgress(null);
      storageSize().then(setSize);
    };
    isCachedFully().then((v) => setSaved(v));
    storageSize().then(setSize);
    window.addEventListener('amanah:cached', done);
    return () => {
      off();
      window.removeEventListener('amanah:cached', done);
    };
  }, []);

  const toggleSound = (on) => {
    setPref('sound', on);
    ambience.setEnabled(on);
  };

  // ── Backup and restore ──────────────────────────────────────────────────────

  const saveBackup = () => {
    const backup = exportState();
    const day = new Date().toISOString().slice(0, 10);
    const text = JSON.stringify(backup, null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `amanah-backup-${day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track('backup.export');
    setNote('The backup file has been saved.');
  };

  const pickBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let parsed = null;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setNote('That file could not be read. It is not a backup file.');
      return;
    }
    const check = validateBackup(parsed);
    if (!check.ok) {
      setNote(check.error);
      return;
    }
    setConfirmReplace(parsed);
  };

  const combine = () => {
    const incoming = confirmReplace?.state || {};
    replaceState(mergeStates(state, incoming));
    setConfirmReplace(null);
    track('backup.restore');
    setNote('The backup has been combined with this device.');
  };

  const replace = () => {
    replaceState(confirmReplace?.state || {});
    setConfirmReplace(null);
    track('backup.restore');
    setNote('This device now holds the progress from that backup.');
  };

  const keepEverything = async () => {
    setSaving(true);
    setProgress({ done: 0, total: 0 });
    const res = await cacheEverything((done, total) => setProgress({ done, total }));
    if (res.ok) {
      setSaved(true);
      setProgress(null);
      storageSize().then(setSize);
      setNote('The whole story is now on this device.');
    } else {
      setSaving(false);
      setProgress(null);
      setNote('The app could not be saved yet. Connect to the internet and try again.');
    }
  };

  const counts = countsOf(state);

  // The anonymous counts (web build only, and only when there is a project to send them to).
  // The reader's own switch is off only when their browser asks sites not to track: in that case
  // the switch shows off and cannot be turned on (and the line says why).
  const counting = usageAvailable();
  const blocked = trackingOff();
  const usageOn = counting && prefs.usage !== false && !blocked;

  return (
    <Shell here="about" back="/" title="Settings">
      <h1 className="mt-4 font-display text-[1.9rem] font-semibold leading-tight text-gold-hi">Settings</h1>
      <p className="mt-2 font-body text-[1.12rem] leading-snug text-ivory/80">Your progress and notes stay on this device.</p>

      {/* Your view */}
      <Section title="Your view" note="The stories and verses are the same in both. Only the words around them change.">
        <ModePicker full />
      </Section>

      {/* Watching */}
      <Section title="Watching">
        <Switch label="Ambient sound" hint="Wind, water, fire and crowds. No music." on={!!prefs.sound} onChange={toggleSound} />
        <Switch label="Tap sounds" hint="A soft click when you press a button." on={prefs.taps !== false} onChange={(v) => setPref('taps', v)} />
        <Switch label="Play scenes automatically" hint="Otherwise each moment waits for you." on={prefs.auto !== false} onChange={(v) => setPref('auto', v)} />
        <Switch label="Show the chronicle captions" hint="The words of each scene, as they are spoken." on={prefs.chronicle !== false} onChange={(v) => setPref('chronicle', v)} />
      </Section>

      {/* Finding your way: the guide, and the first-visit tips */}
      <Section title="Finding your way">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="hud-btn" onClick={() => go('/guide')}>
            <Icon name="help" className="h-4 w-4" />
            The short guide: what is where
          </button>
          <button
            type="button"
            className="hud-btn"
            disabled={!Object.keys(prefs.hints || {}).length}
            onClick={() => setPref('hints', {})}
          >
            {Object.keys(prefs.hints || {}).length ? 'Show the first-visit tips again' : 'The first-visit tips are on'}
          </button>
        </div>
      </Section>

      {/* On this device (web build only) */}
      {IS_WEB && (
        <Section title="On this device" note="The web build only. The hosted artifact has no install and no offline storage.">
          {installed ? (
            <p className="font-body text-[1.08rem] leading-snug text-ivory/85">Amanah is installed on this device.</p>
          ) : installable ? (
            <button type="button" className="btn-gold" onClick={async () => {
              const how = await promptInstall();
              if (how === 'accepted') setInstalled(true);
              else if (how === 'unavailable') setNote('This browser will not install the app. You can add it to your home screen from the browser menu.');
            }}>
              <Icon name="play" className="h-4 w-4" />
              Install Amanah
            </button>
          ) : (
            <div>
              <p className="font-body text-[1.08rem] leading-snug text-ivory/85">To add Amanah to your home screen:</p>
              <p className="mt-1 font-body text-[1.08rem] leading-snug text-ivory/85">
                <span className="text-gold-hi">Share</span>, then <span className="text-gold-hi">Add to Home Screen</span>.
              </p>
            </div>
          )}

          <div className="mt-4 border-t border-gold/10 pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-body text-[1.1rem] font-semibold text-ivory/90">Keep the whole story on this device</h3>
              {saved && <span className="font-body text-[1rem] italic text-gold-hi">Saved</span>}
            </div>
            <p className="mt-1 font-body text-[1rem] leading-snug text-ivory/65">
              Every scene, so the whole chronicle works with no connection.
            </p>
            {progress && (
              <div className="mt-2" role="status" aria-live="polite">
                <div className="h-2 overflow-hidden rounded-full bg-ivory/12">
                  <div className="h-full bg-gradient-to-r from-[#c99a45] to-[#f7e0a3]" style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }} />
                </div>
                <p className="mt-1 font-body text-[0.98rem] text-ivory/70">
                  {progress.total ? `${progress.done} of ${progress.total} files` : 'Starting…'}
                </p>
              </div>
            )}
            {size > 0 && <p className="mt-1 font-body text-[0.98rem] italic text-ivory/50">Using about {Math.max(1, Math.round(size / 1024 / 1024))} MB on this device.</p>}
            <button type="button" className="hud-btn mt-3" onClick={keepEverything} disabled={saving}>
              {saved ? 'Save again' : 'Keep the whole story'}
            </button>
          </div>
        </Section>
      )}

      {/* Your progress */}
      <Section title="Your progress" note={`${counts.scenes} scenes watched, ${counts.lessons} lessons finished, ${counts.notes} private notes.`}>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="hud-btn" onClick={saveBackup}>
            Save a backup
          </button>
          <label className="hud-btn inline-flex cursor-pointer items-center">
            Restore from a backup
            <input type="file" accept="application/json,.json" className="sr-only" onChange={pickBackup} />
          </label>
          <button
            type="button"
            className="hud-btn"
            onClick={() => {
              resetProgress();
              setNote('The chronicle starts again. Your notes and settings are kept.');
            }}
          >
            Start the chronicle again
          </button>
        </div>
        <p className="mt-2 font-body text-[0.98rem] italic leading-snug text-ivory/50">
          A backup is a file you keep. It holds your progress and your private notes, and nothing else.
        </p>

        {confirmReplace && (
          <div className="mt-4 rounded-xl border border-gold/30 bg-black/40 p-4">
            <h3 className="font-display text-[1.1rem] font-semibold text-gold-hi">This backup holds</h3>
            <p className="mt-1 font-body text-[1.05rem] leading-snug text-ivory/85">
              {countsOf(confirmReplace.state).scenes} scenes watched, {countsOf(confirmReplace.state).lessons} lessons finished,{' '}
              {countsOf(confirmReplace.state).notes} private notes.
            </p>
            <p className="mt-1 font-body text-[1rem] italic text-ivory/60">Saved on {new Date(confirmReplace.exportedAt || Date.now()).toLocaleDateString()}.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-gold" onClick={combine}>
                Combine with this device
              </button>
              <button type="button" className="hud-btn" onClick={() => setConfirmReplace(null)}>
                Cancel
              </button>
            </div>
            <button type="button" className="mt-3 block font-body text-[1rem] text-gold-hi/85 underline decoration-gold/40 underline-offset-4" onClick={replace}>
              Replace this device&rsquo;s progress instead
            </button>
          </div>
        )}

        <div className="mt-5 border-t border-gold/15 pt-4">
          {confirmDelete ? (
            <div>
              <p className="font-body text-[1.05rem] leading-snug text-ivory/90">
                This removes your answers, every unit&rsquo;s progress, the chronicle&rsquo;s progress, your private notes and your
                settings. It cannot be undone.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="hud-btn border-blood/70 text-[#f0b3a6]"
                  onClick={() => {
                    deleteAllData();
                    forgetUsage();
                    setConfirmDelete(false);
                    setNote('Your data has been deleted from this browser.');
                  }}
                >
                  Delete everything
                </button>
                <button type="button" className="hud-btn" onClick={() => setConfirmDelete(false)} autoFocus>
                  Keep my data
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="hud-btn" onClick={() => setConfirmDelete(true)}>
              Delete my data
            </button>
          )}
        </div>

        {/* Sync across devices is added in a later batch: it will need an account, and this page
            will hold the sign-in and the choice of what to sync. The data layer it will use is
            already here (exportState, validateBackup, mergeStates in src/lib/store.js). */}
      </Section>

      {/* Privacy and mistakes */}
      <Section title="Privacy and mistakes">
        {counting && (
          <>
            <Switch
              label="Share anonymous usage counts"
              on={usageOn}
              disabled={blocked}
              onChange={(v) => {
                setPref('usage', v);
                if (!v) forgetUsage();
              }}
            />
            <p className="mt-2 font-body text-[1rem] italic leading-snug text-ivory/55">
              {blocked ? 'Your browser asks sites not to track, so nothing is sent.' : 'Counts of what is used, never what you answer or write.'}
            </p>
          </>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="hud-btn" onClick={() => go('/privacy')}>
            Read the privacy page
          </button>
          {IS_WEB && (
            <>
              <button type="button" className="hud-btn" onClick={() => go('/contact')}>
                Contact
              </button>
              <button type="button" className="hud-btn" onClick={() => setReport((r) => !r)} aria-expanded={report}>
                Report a mistake
              </button>
            </>
          )}
        </div>
        {report && (
          <div className="mt-4">
            <ReportForm where="Settings" kind="mistake" onClose={() => setReport(false)} />
          </div>
        )}
      </Section>

      {note && (
        <p role="status" className="mt-4 font-body text-[1.05rem] italic text-gold-hi/90">
          {note}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="btn-gold" onClick={() => go('/')}>
          Back home
        </button>
        <button type="button" className="hud-btn" onClick={() => go('/pyramid/progress')}>
          See your progress
        </button>
      </div>

      <Disclaimer />
    </Shell>
  );
}
