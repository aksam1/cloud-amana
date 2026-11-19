// The soft click on buttons, links and switches, for the whole app from one listener (main.jsx), so no
// page has to remember it. It listens in the capture phase: it hears the press before the control's own
// handler runs, which means a switch still shows its old state: aria-checked="true" is about to turn off.
//
// Which click: a control can name its own with data-tap="tap|primary|on|off"; otherwise a switch or a
// pressed toggle clicks 'on' or 'off', the gold main button clicks 'primary', and the rest click 'tap'.
// Put data-silent on anything that should stay quiet (the scene picture is not a button, so it already is).
// The ambient sound toggle makes its own sound (the beds fading in), and still clicks like any switch.
import { ambience } from './audio.js';
import { getState } from './store.js';

const SEL = 'button, a[href], [role="button"], [role="switch"], [role="radio"], [role="tab"], summary, [data-tap]';

/** Which click a pressed element makes, or null for none. Pure, so it can be tested without audio. */
export function tapKind(el) {
  if (!el || el.closest('[data-silent]')) return null;
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return null;
  if (el.dataset?.tap) return el.dataset.tap;
  if (el.getAttribute('role') === 'radio') return 'on'; // choosing never turns a choice off
  const state = el.getAttribute('aria-checked') ?? el.getAttribute('aria-pressed');
  if (state != null && state !== 'mixed') return state === 'true' ? 'off' : 'on';
  if (el.classList.contains('btn-gold')) return 'primary';
  return 'tap';
}

export function listenForTaps(root = document) {
  const on = (e) => {
    if (e.button) return; // a right or middle click
    if (getState().prefs.taps === false) return;
    const kind = tapKind(e.target?.closest?.(SEL));
    if (kind) ambience.tap(kind);
  };
  root.addEventListener('click', on, true);
  return () => root.removeEventListener('click', on, true);
}
