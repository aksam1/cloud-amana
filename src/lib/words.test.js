import { describe, expect, it } from 'vitest';
import { inMode } from './words.js';

describe('the Muslim view says Allah where narration names God', () => {
  it('swaps God used as His name', () => {
    expect(inMode('God told the angels.', 'muslim')).toBe('Allah told the angels.');
    expect(inMode("God's mercy", 'muslim')).toBe("Allah's mercy");
  });
  it('leaves "the God of", "your God" and "one God" alone, where God is a common noun', () => {
    expect(inMode('his wife believed in the God of Musa.', 'muslim')).toBe('his wife believed in the God of Musa.');
    expect(inMode('we will worship your God', 'muslim')).toBe('we will worship your God');
    expect(inMode('one God', 'muslim')).toBe('one God');
  });
  it('never touches "god" or "gods" (idols, Pharaoh)', () => {
    expect(inMode('there is no god but You; they carved their gods', 'muslim')).toBe('there is no god but You; they carved their gods');
  });
  it('changes nothing in the Exploring view', () => {
    expect(inMode('God told the angels.', 'curious')).toBe('God told the angels.');
  });
});
