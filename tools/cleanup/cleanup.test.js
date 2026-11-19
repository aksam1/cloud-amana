// The daily deletion of expired usage records (tools/cleanup/Code.gs), run in Node against a pretend
// Firestore. Code.gs is an Apps Script file, so it is loaded into a sandbox rather than imported.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const gs = vm.createContext({ console });
vm.runInContext(source, gs);

const NOW = new Date('2027-03-01T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const base = 'projects/amanah-stories/databases/(default)/documents/ev/';

/** A pretend Firestore holding `ev` records; `refuse` names records whose delete fails. */
function fakeFirestore(records, refuse = new Set()) {
  const docs = new Map(records.map((r, i) => [`${base}doc${i}`, r]));
  const calls = [];
  const call = (path, body) => {
    calls.push({ path, body });
    if (path === ':runQuery') {
      const q = body.structuredQuery;
      const before = Date.parse(q.where.fieldFilter.value.timestampValue);
      const names = [...docs]
        .filter(([, r]) => r.exp < before)
        .sort(([, a], [, b]) => a.exp - b.exp)
        .slice(0, q.limit)
        .map(([name]) => name);
      return names.length ? names.map((name) => ({ document: { name }, readTime: 'x' })) : [{ readTime: 'x' }];
    }
    if (path === ':batchWrite') {
      return {
        writeResults: body.writes.map(() => ({})),
        status: body.writes.map(({ delete: name }) => {
          if (refuse.has(name)) return { code: 7, message: 'PERMISSION_DENIED' };
          docs.delete(name);
          return {};
        }),
      };
    }
    throw new Error(`unexpected call ${path}`);
  };
  return { docs, calls, call };
}

const records = (n, exp) => Array.from({ length: n }, () => ({ exp }));

describe('the daily clean-up of usage records', () => {
  it('deletes the records past their date and keeps the rest, reading only their names', () => {
    const fs = fakeFirestore([...records(3, NOW - DAY), ...records(2, NOW + DAY), { exp: NOW - 1 }]);
    const result = gs.cleanExpired(fs.call, NOW, 18000);
    expect(result).toEqual({ deleted: 4, failed: 0, more: false });
    expect(fs.docs.size).toBe(2);
    const query = fs.calls[0].body.structuredQuery;
    expect(query.from).toEqual([{ collectionId: 'ev' }]);
    expect(query.select).toEqual({ fields: [{ fieldPath: '__name__' }] });
    expect(query.where.fieldFilter).toMatchObject({ field: { fieldPath: 'exp' }, op: 'LESS_THAN' });
    expect(query.where.fieldFilter.value.timestampValue).toBe(NOW.toISOString());
  });

  it('works through more records than one batch holds, 500 at a time', () => {
    const fs = fakeFirestore(records(1203, NOW - DAY));
    expect(gs.cleanExpired(fs.call, NOW, 18000)).toEqual({ deleted: 1203, failed: 0, more: false });
    const batches = fs.calls.filter((c) => c.path === ':batchWrite').map((c) => c.body.writes.length);
    expect(batches).toEqual([500, 500, 203]);
    expect(fs.docs.size).toBe(0);
  });

  it('stops at the day’s cap and says more are waiting', () => {
    const fs = fakeFirestore(records(1203, NOW - DAY));
    expect(gs.cleanExpired(fs.call, NOW, 1000)).toEqual({ deleted: 1000, failed: 0, more: true });
    expect(fs.docs.size).toBe(203);
  });

  it('with nothing expired, asks once and deletes nothing', () => {
    const fs = fakeFirestore(records(5, NOW + DAY));
    expect(gs.cleanExpired(fs.call, NOW, 18000)).toEqual({ deleted: 0, failed: 0, more: false });
    expect(fs.calls.map((c) => c.path)).toEqual([':runQuery']);
  });

  it('reports a delete that fails, and does not loop on it', () => {
    const fs = fakeFirestore(records(3, NOW - DAY), new Set([`${base}doc1`]));
    expect(gs.cleanExpired(fs.call, NOW, 18000)).toEqual({ deleted: 2, failed: 1, more: true });
    expect(fs.calls.filter((c) => c.path === ':batchWrite')).toHaveLength(1);
  });

  it('loads without Apps Script, which it only touches when a run starts', () => {
    expect(typeof gs.dailyCleanup).toBe('function');
    expect(typeof gs.setup).toBe('function');
    expect(() => gs.dailyCleanup()).toThrow(/ScriptApp|UrlFetchApp/);
  });
});
