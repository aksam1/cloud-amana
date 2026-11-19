import { describe, expect, it } from 'vitest';
import {
  buildDoc,
  deviceKind,
  eventName,
  isAllowedEvent,
  MAX_EVENTS,
  MAX_SECONDS,
  referrerHost,
  returningSince,
  routeName,
  scrubError,
  toFirestore,
} from './usageRules.js';
import { createTracker, machineAddress, offReason, trackingOff } from './usage.js';

/** A tracker that keeps what it would have sent, so a test can look at it. */
function trackerWith({ allowed = () => true, visit = {} } = {}) {
  const sent = [];
  const t = createTracker({ send: (body) => sent.push(body), allowed, visit, now: () => Date.parse('2026-11-19T12:00:00Z') });
  return { t, sent };
}

describe('the names of events', () => {
  it("keeps only the whitelisted shapes", () => {
    expect(isAllowedEvent('scene.start:heavens')).toBe(true);
    expect(isAllowedEvent('lesson.done:3/2')).toBe(true);
    expect(isAllowedEvent('q:3/2:1:0')).toBe(true);
    expect(isAllowedEvent('placement.done')).toBe(true);
  });

  it("drops anything else, including anything that would carry a person", () => {
    expect(isAllowedEvent('answer:Allah')).toBe(false);
    expect(isAllowedEvent('journal:my prayer')).toBe(false);
    expect(isAllowedEvent('email:a@b.com')).toBe(false);
    expect(isAllowedEvent('scene.start:heavens?beat=2')).toBe(false);
    expect(isAllowedEvent('scene.start:' + 'x'.repeat(50))).toBe(false);
  });

  it("builds a name from a kind and its arguments", () => {
    expect(eventName('scene.start', 'heavens')).toBe('scene.start:heavens');
    expect(eventName('lesson.done', 3, 2)).toBe('lesson.done:3/2');
    expect(eventName('question', 3, 2, 1, false)).toBe('q:3/2:1:0');
    expect(eventName('not.a.kind')).toBe('');
  });
});

describe('the small facts about a visit', () => {
  it("says how long ago the reader was last here", () => {
    const day = '2026-11-19';
    expect(returningSince('', Date.parse(`${day}T00:00:00Z`))).toBe('new');
    expect(returningSince('2026-11-19', Date.parse(`${day}T00:00:00Z`))).toBe('new');
    expect(returningSince('2026-11-18', Date.parse(`${day}T00:00:00Z`))).toBe('1d');
    expect(returningSince('2026-11-15', Date.parse(`${day}T00:00:00Z`))).toBe('2-7d');
    expect(returningSince('2026-11-01', Date.parse(`${day}T00:00:00Z`))).toBe('8-30d');
    expect(returningSince('2026-09-01', Date.parse(`${day}T00:00:00Z`))).toBe('31d+');
  });

  it("keeps the host name of another site, and nothing else", () => {
    expect(referrerHost('https://www.google.com/search?q=amanah', 'amanah-stories.netlify.app')).toBe('google.com');
    expect(referrerHost('https://amanah-stories.netlify.app/x', 'amanah-stories.netlify.app')).toBe('');
    expect(referrerHost('', 'x')).toBe('');
    expect(referrerHost('not a url', 'x')).toBe('');
  });

  it("reduces an address to the name of the page", () => {
    expect(routeName('#/scene/heavens?beat=2')).toBe('scene');
    expect(routeName('#/lesson/3/2?then=/pyramid')).toBe('lesson');
    expect(routeName('#/')).toBe('');
    expect(routeName('#/unit/salah?step=story')).toBe('unit');
  });

  it("knows a small phone from a large one", () => {
    expect(deviceKind(390, true)).toBe('phone');
    expect(deviceKind(1024, true)).toBe('tablet');
    expect(deviceKind(1400, false)).toBe('desktop');
  });
});

describe('a failure, cleaned', () => {
  it("leaves out the address, the code and the words", () => {
    const text = scrubError(new Error('failed to load https://example.com/x for a@b.com after 40312'));
    expect(text).not.toContain('example.com');
    expect(text).not.toContain('a@b.com');
    expect(text).not.toContain('40312');
    expect(text.length).toBeLessThanOrEqual(140);
  });

  it("drops what a browser quotes from the text it choked on, and keeps a property's name", () => {
    let parse = '';
    try {
      JSON.parse('I prayed for my mother');
    } catch (e) {
      parse = scrubError(e);
    }
    expect(parse).toMatch(/SyntaxError/);
    expect(parse).not.toMatch(/prayed|mother/);
    expect(scrubError(new TypeError("Cannot read properties of null (reading 'size')"))).toContain("'size'");
    expect(scrubError(new Error("bad value 'my private words here'"))).not.toContain('private');
  });
});

describe('the document', () => {
  it("holds only the fields it may hold", () => {
    const doc = buildDoc({ now: Date.parse('2026-11-19T12:00:00Z'), part: 1, device: 'phone', lang: 'en', ref: 'google.com', app: true, ret: '2-7d', seconds: 65, routes: { scene: 2 }, events: ['scene.start:heavens'], errors: ['boom'] });
    expect(Object.keys(doc).sort()).toEqual(['app', 'd', 'dev', 'err', 'ev', 'exp', 'lang', 'p', 'pv', 'ref', 'ret', 'sec', 'v']);
    expect(doc.d).toBe('2026-11-19');
    expect(doc.p).toBe(1);
    expect(doc.dev).toBe('phone');
    expect(doc.app).toBe(true);
    expect(doc.ret).toBe('2-7d');
    expect(doc.sec).toBe(70); // rounded to ten
    expect(doc.pv).toEqual({ scene: 2 });
  });

  it("never holds the reader's chosen view, and takes only known words for the small facts", () => {
    const doc = buildDoc({ mode: 'muslim', prefs: { mode: 'muslim' }, device: 'my laptop', lang: 'e1', ret: 'since 2019' });
    expect(JSON.stringify(doc)).not.toMatch(/muslim|curious/);
    expect(doc.dev).toBe('desktop');
    expect(doc.lang).toBe('');
    expect(doc.ret).toBe('new');
  });

  it("holds no more than it may hold", () => {
    const many = Array.from({ length: 400 }, (_, i) => `scene.start:s${i}`);
    const doc = buildDoc({ events: many, errors: Array.from({ length: 40 }, (_, i) => `e${i}`), seconds: 999999 });
    expect(doc.ev.length).toBeLessThanOrEqual(MAX_EVENTS);
    expect(doc.err.length).toBeLessThanOrEqual(5);
    expect(doc.sec).toBe(MAX_SECONDS);
  });

  it("names the day it may be deleted on", () => {
    const doc = buildDoc({ now: Date.parse('2026-11-19T12:00:00Z'), ttlDays: 90 });
    expect(doc.exp.slice(0, 10)).toBe('2027-02-17');
  });

  it("speaks the typed JSON Firestore wants", () => {
    const body = toFirestore(buildDoc({ events: ['scene.start:heavens'], routes: { scene: 1 } }));
    expect(body.fields.v.integerValue).toBe('1');
    expect(body.fields.d.stringValue).toBe(new Date().toISOString().slice(0, 10));
    expect(body.fields.ev.arrayValue.values[0].stringValue).toBe('scene.start:heavens');
    expect(body.fields.pv.mapValue.fields.scene.integerValue).toBe('1');
    expect(body.fields.exp.timestampValue).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('the tracker', () => {
  it("sends nothing when there is nothing to say", () => {
    const { t, sent } = trackerWith();
    expect(t.flush()).toBe(false);
    expect(sent).toHaveLength(0);
  });

  it("sends what happened, and then forgets it", () => {
    const { t, sent } = trackerWith();
    t.track('scene.start', 'heavens');
    t.trackRoute('#/scene/heavens');
    expect(t.flush()).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].fields.ev.arrayValue.values.map((v) => v.stringValue)).toEqual(['scene.start:heavens']);
    expect(sent[0].fields.pv.mapValue.fields.scene.integerValue).toBe('1');
    // the second flush has nothing left to say
    expect(t.flush()).toBe(false);
    expect(sent).toHaveLength(1);
  });

  it("counts only the seconds the page was in front of the reader", () => {
    let clock = Date.parse('2026-11-19T12:00:00Z');
    const sent = [];
    const t = createTracker({ send: (body) => sent.push(body), now: () => clock });
    t.resume(); // shown
    clock += 95_000;
    t.countVisible(); // hidden for a while: those seconds do not count
    clock += 600_000;
    t.resume(); // back
    clock += 30_000;
    expect(t.flush()).toBe(true); // a visit with no events still says how long it was seen
    expect(sent[0].fields.sec.integerValue).toBe('130'); // 125 s, rounded to ten
  });

  it("numbers the parts of a page load", () => {
    const { t, sent } = trackerWith();
    t.track('scene.start', 'a');
    t.flush();
    t.track('scene.start', 'b');
    t.flush();
    expect(sent[0].fields.p.integerValue).toBe('0');
    expect(sent[1].fields.p.integerValue).toBe('1');
  });

  it("sends nothing at all when the browser asks sites not to track", () => {
    const { t, sent } = trackerWith({ allowed: () => false });
    t.track('scene.start', 'heavens');
    t.trackRoute('#/scene/heavens');
    expect(t.flush()).toBe(false);
    expect(sent).toHaveLength(0);
  });

  it("says why it is not counting", () => {
    expect(offReason({ usage: false })).toMatch(/turned the counts off/i);
    expect(offReason({ usage: true })).toBe('');
  });

  it("knows a test browser from a reader", () => {
    expect(typeof machineAddress()).toBe('boolean');
    expect(typeof trackingOff()).toBe('boolean');
  });

  it("never carries the words of the reader", () => {
    const { t, sent } = trackerWith();
    t.trackError(new Error('private note: I prayed for my mother'), 'scene');
    t.flush();
    const text = sent[0].fields.err.arrayValue.values.map((v) => v.stringValue).join(' ');
    expect(text).toContain('scene');
    expect(text.length).toBeLessThanOrEqual(140);
  });
});
