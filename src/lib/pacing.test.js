import { describe, expect, it } from 'vitest';
import { captionHoldMs, READ_CPS } from './pacing.js';

describe('captionHoldMs', () => {
  it('asks for nothing when a beat has no words', () => {
    expect(captionHoldMs({})).toBe(0);
    expect(captionHoldMs({ en: '  ', say: '' })).toBe(0);
  });

  it('gives longer text more time', () => {
    const short = captionHoldMs({ say: 'The sea parted.' });
    const long = captionHoldMs({ say: 'The sea parted, and the people walked through on dry ground while the water stood.' });
    expect(long).toBeGreaterThan(short);
  });

  it('reads narration at the stated pace, plus a short settle', () => {
    const say = 'x'.repeat(READ_CPS * 10); // ten seconds of reading
    const ms = captionHoldMs({ say });
    expect(ms).toBeGreaterThanOrEqual(10000);
    expect(ms).toBeLessThan(12000);
  });

  it('waits for the Arabic to paint in before the English can be read', () => {
    const en = 'And We made from them leaders guiding by Our command.';
    expect(captionHoldMs({ en, ar: 'ا'.repeat(60) })).toBeGreaterThan(captionHoldMs({ en }));
  });

  it('never holds a beat longer than thirty seconds', () => {
    expect(captionHoldMs({ en: 'word '.repeat(400) })).toBe(30000);
  });
});
