import { describe, expect, it } from 'vitest';
import { tapKind } from './taps.js';

// A stand-in for a pressed element: just the parts tapKind reads.
function el({ attrs = {}, tap, cls = [], disabled = false, silent = false } = {}) {
  return {
    disabled,
    dataset: tap ? { tap } : {},
    classList: { contains: (c) => cls.includes(c) },
    getAttribute: (k) => (k in attrs ? String(attrs[k]) : null),
    closest: (sel) => (sel === '[data-silent]' && silent ? {} : null),
  };
}

describe('tapKind', () => {
  it('is quiet for nothing, a disabled control and anything marked silent', () => {
    expect(tapKind(null)).toBe(null);
    expect(tapKind(el({ disabled: true }))).toBe(null);
    expect(tapKind(el({ attrs: { 'aria-disabled': 'true' } }))).toBe(null);
    expect(tapKind(el({ silent: true, cls: ['btn-gold'] }))).toBe(null);
  });

  it('lets a control name its own click', () => {
    expect(tapKind(el({ tap: 'primary' }))).toBe('primary');
    // a choice card is pressed when chosen, but pressing it again never turns the choice off
    expect(tapKind(el({ tap: 'on', attrs: { 'aria-pressed': 'true' } }))).toBe('on');
  });

  it('reads a switch before the press flips it', () => {
    expect(tapKind(el({ attrs: { role: 'switch', 'aria-checked': 'false' } }))).toBe('on');
    expect(tapKind(el({ attrs: { role: 'switch', 'aria-checked': 'true' } }))).toBe('off');
    expect(tapKind(el({ attrs: { 'aria-pressed': 'true' } }))).toBe('off');
    expect(tapKind(el({ attrs: { 'aria-pressed': 'mixed' } }))).toBe('tap');
    expect(tapKind(el({ attrs: { role: 'radio', 'aria-checked': 'true' } }))).toBe('on');
  });

  it('gives the gold main button its own click and everything else the plain one', () => {
    expect(tapKind(el({ cls: ['btn-gold'] }))).toBe('primary');
    expect(tapKind(el({ cls: ['hud-btn'] }))).toBe('tap');
  });
});
