// The backup, restore and merge rules. These are pure functions over the saved state, so they can be
// tested without a browser: the sync batch will use the same merge on data from another device.
import { describe, expect, it } from 'vitest';
import { countsOf, exportState, mergeStates, replaceState, validateBackup } from './store.js';

const state = (over = {}) => ({
  seen: {},
  lit: { earth: true },
  last: null,
  learned: {},
  answers: {},
  journal: {},
  journalAt: {},
  placement: null,
  units: {},
  drafts: {},
  recent: null,
  prefs: { sound: false, auto: true, chronicle: true, mode: null },
  ...over,
});

describe('validateBackup', () => {
  it('accepts a backup this app wrote, and counts what is in it', () => {
    const backup = { app: 'amanah', version: 1, exportedAt: '2026-11-18T00:00:00.000Z', state: state({ seen: { a: true, b: true }, learned: { '1:0': true }, journal: { x: 'hello' } }) };
    const r = validateBackup(backup);
    expect(r.ok).toBe(true);
    expect(r.counts).toEqual({ scenes: 2, lessons: 1, notes: 1, units: 0, answers: 0 });
  });

  it('rejects rubbish without throwing', () => {
    for (const junk of [null, undefined, 0, 'text', [], { app: 'other', version: 1, state: {} }, { app: 'amanah' }, { app: 'amanah', version: 2, state: {} }, { app: 'amanah', version: 1 }, { app: 'amanah', version: 1, state: [] }]) {
      const r = validateBackup(junk);
      expect(r.ok).toBe(false);
      expect(typeof r.error).toBe('string');
    }
  });

  it('rejects a backup whose maps are the wrong shape', () => {
    const r = validateBackup({ app: 'amanah', version: 1, state: { seen: ['a'] } });
    expect(r.ok).toBe(false);
  });

  it('counts only notes that have text in them', () => {
    expect(countsOf({ journal: { a: 'x', b: '   ', c: '' } }).notes).toBe(1);
  });
});

describe('mergeStates', () => {
  it('unions the flags, and true wins', () => {
    const out = mergeStates(state({ seen: { a: true, b: false }, learned: { '1:0': true } }), state({ seen: { b: true, c: true }, learned: { '1:0': true, '2:0': true }, answers: { '1:0:1': true } }));
    expect(out.seen).toEqual({ a: true, b: true, c: true });
    expect(out.learned).toEqual({ '1:0': true, '2:0': true });
    expect(out.answers).toEqual({ '1:0:1': true });
  });

  it('keeps the higher unit meter, and the larger attempts count', () => {
    const local = state({ units: { sabr: { meter: 40, attempts: 2, at: '2026-11-01T00:00:00Z' } } });
    const incoming = state({ units: { sabr: { meter: 70, attempts: 1, at: '2026-10-01T00:00:00Z' }, salah: { meter: 10, attempts: 3, at: '2026-10-02T00:00:00Z' } } });
    const out = mergeStates(local, incoming);
    expect(out.units.sabr.meter).toBe(70);
    expect(out.units.sabr.attempts).toBe(2);
    expect(out.units.salah.meter).toBe(10);
  });

  it('on an equal meter, the newer unit wins', () => {
    const older = state({ units: { sabr: { meter: 50, attempts: 1, at: '2026-11-01T00:00:00Z' } } });
    const newer = state({ units: { sabr: { meter: 50, attempts: 1, at: '2026-12-01T00:00:00Z', reflection: 'done' } } });
    expect(mergeStates(older, newer).units.sabr.reflection).toBe('done');
    expect(mergeStates(newer, older).units.sabr.reflection).toBe('done');
  });

  it('keeps the newer note on a key, by its timestamp', () => {
    const local = state({ journal: { x: 'old note' }, journalAt: { x: '2026-11-01T00:00:00Z' } });
    const incoming = state({ journal: { x: 'new note' }, journalAt: { x: '2026-12-01T00:00:00Z' } });
    const out = mergeStates(local, incoming);
    expect(out.journal.x).toBe('new note');
    expect(out.journalAt.x).toBe('2026-12-01T00:00:00Z');
    // the other way round, the same rule applies to whichever side is the local one
    expect(mergeStates(incoming, local).journal.x).toBe('new note');
  });

  it('joins two different notes when neither says when it was written', () => {
    const local = state({ journal: { x: 'mine' } });
    const incoming = state({ journal: { x: 'yours' } });
    const out = mergeStates(local, incoming);
    expect(out.journal.x).toContain('mine');
    expect(out.journal.x).toContain('yours');
    expect(out.journal.x).toContain('(from another device)');
  });

  it('keeps a note that only one side has', () => {
    const out = mergeStates(state({ journal: { x: 'mine' } }), state({ journal: { y: 'yours' } }));
    expect(out.journal).toEqual({ x: 'mine', y: 'yours' });
  });

  it('takes the newer placement and recent', () => {
    const local = state({ placement: { path: 'muslim', at: '2026-11-01T00:00:00Z' }, recent: { kind: 'scene', id: 'a', at: '2026-11-01T00:00:00Z' } });
    const incoming = state({ placement: { path: 'nonmuslim', at: '2026-12-01T00:00:00Z' }, recent: { kind: 'unit', id: 'sabr', at: '2026-12-01T00:00:00Z' } });
    const out = mergeStates(local, incoming);
    expect(out.placement.path).toBe('nonmuslim');
    expect(out.recent.id).toBe('sabr');
  });

  it('last follows the winning recent when that is a scene', () => {
    const withScene = state({ last: 'old', recent: { kind: 'scene', id: 'new', at: '2026-12-01T00:00:00Z' } });
    const withUnit = state({ recent: { kind: 'unit', id: 'sabr', at: '2026-10-01T00:00:00Z' } });
    expect(mergeStates(withScene, withUnit).last).toBe('new');
    // when the winning recent is a unit, the local last is kept
    const unitWins = state({ last: 'kept', recent: { kind: 'unit', id: 'sabr', at: '2026-12-01T00:00:00Z' } });
    expect(mergeStates(unitWins, withScene).last).toBe('kept');
  });

  it('takes the newer draft per unit', () => {
    const local = state({ drafts: { sabr: { step: 'choice', at: '2026-11-01T00:00:00Z' } } });
    const incoming = state({ drafts: { sabr: { step: 'teaching', at: '2026-12-01T00:00:00Z' }, salah: { step: 'story', at: '2026-12-02T00:00:00Z' } } });
    const out = mergeStates(local, incoming);
    expect(out.drafts.sabr.step).toBe('teaching');
    expect(out.drafts.salah.step).toBe('story');
  });

  it('drops a draft whose unit was finished later in the merged units', () => {
    const local = state({ drafts: { sabr: { step: 'choice', at: '2026-11-01T00:00:00Z' } } });
    const incoming = state({ units: { sabr: { meter: 100, at: '2026-12-01T00:00:00Z' } } });
    expect(mergeStates(local, incoming).drafts.sabr).toBeUndefined();
  });

  it('keeps a draft whose unit was finished before it was written', () => {
    const local = state({ drafts: { sabr: { step: 'choice', at: '2026-12-01T00:00:00Z' } } });
    const incoming = state({ units: { sabr: { meter: 100, at: '2026-11-01T00:00:00Z' } } });
    expect(mergeStates(local, incoming).drafts.sabr).toBeDefined();
  });

  it('the device keeps its own preferences, but takes the view if it has none', () => {
    const local = state({ prefs: { sound: true, auto: false, chronicle: true, mode: null } });
    const incoming = state({ prefs: { sound: false, auto: true, chronicle: false, mode: 'muslim' } });
    const out = mergeStates(local, incoming);
    expect(out.prefs.sound).toBe(true);
    expect(out.prefs.auto).toBe(false);
    expect(out.prefs.chronicle).toBe(true);
    expect(out.prefs.mode).toBe('muslim');
  });

  it('the device keeps its own view when it has one', () => {
    const local = state({ prefs: { mode: 'curious' } });
    const incoming = state({ prefs: { mode: 'muslim' } });
    expect(mergeStates(local, incoming).prefs.mode).toBe('curious');
  });

  it('keeps keys from a newer version of the app', () => {
    const local = state({ somethingNew: { a: 1 } });
    const incoming = state({ otherNewThing: 'x' });
    const out = mergeStates(local, incoming);
    expect(out.somethingNew).toEqual({ a: 1 });
    expect(out.otherNewThing).toBe('x');
  });

  it('does not change either state it was given', () => {
    const local = state({ seen: { a: true }, units: { sabr: { meter: 40, attempts: 1 } } });
    const incoming = state({ seen: { b: true }, units: { sabr: { meter: 70, attempts: 2 } } });
    const before = JSON.stringify([local, incoming]);
    mergeStates(local, incoming);
    expect(JSON.stringify([local, incoming])).toBe(before);
  });

  it('merging the same thing twice changes nothing more (a joined note does not grow again)', () => {
    const local = state({ seen: { a: true }, journal: { k: 'mine' } });
    const incoming = state({ seen: { b: true }, journal: { k: 'theirs' } });
    const once = mergeStates(local, incoming);
    expect(once.journal.k).toContain('(from another device)');
    const twice = mergeStates(once, incoming);
    expect(twice).toEqual(once);
    expect(mergeStates(incoming, once).journal.k).toBe(once.journal.k);
  });

  it('merges junk without throwing', () => {
    const out = mergeStates(null, null);
    expect(out.seen).toEqual({});
    expect(mergeStates(state(), 'rubbish').seen).toEqual({});
  });
});

describe('exportState and replaceState', () => {
  it('exports a backup the validator accepts', () => {
    const backup = exportState();
    expect(backup.app).toBe('amanah');
    expect(backup.version).toBe(1);
    expect(typeof backup.exportedAt).toBe('string');
    expect(validateBackup(backup).ok).toBe(true);
  });

  it('replaces the state with a validated one, and keeps the old shape', () => {
    replaceState({ ...state({ seen: { z: true } }), somethingNew: 1 });
    const again = exportState();
    expect(again.state.seen).toEqual({ z: true });
    expect(again.state.somethingNew).toBe(1);
    expect(again.state.prefs.mode).toBe(null);
    // put the store back as it was, so other tests start clean
    replaceState(state());
  });
});
