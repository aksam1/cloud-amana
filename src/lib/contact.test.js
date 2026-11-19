import { describe, expect, it } from 'vitest';
import { CONTACT_KINDS, KIND_IDS, kindFrom, kindLabel } from './contact.js';

describe('the kinds of message', () => {
  it("are the four the form offers", () => {
    expect(KIND_IDS).toEqual(['mistake', 'privacy', 'question', 'other']);
    expect(CONTACT_KINDS.every((k) => k.id && k.label)).toBe(true);
  });

  it("come from a link, and a link that names nothing gets a mistake report", () => {
    expect(kindFrom('privacy')).toBe('privacy');
    expect(kindFrom('question')).toBe('question');
    expect(kindFrom('other')).toBe('other');
    expect(kindFrom('mistake')).toBe('mistake');
    expect(kindFrom('')).toBe('mistake');
    expect(kindFrom(undefined)).toBe('mistake');
  });

  it("never becomes a kind the form does not know", () => {
    expect(kindFrom('muslim')).toBe('mistake');
    expect(kindFrom('a long answer about a person')).toBe('mistake');
    expect(KIND_IDS).toContain(kindFrom('PRIVACY'));
  });

  it("has a label for every kind", () => {
    for (const k of KIND_IDS) expect(kindLabel(k)).toBeTruthy();
    expect(kindLabel('privacy')).toMatch(/privacy request/i);
  });
});
