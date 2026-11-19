import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

describe('the build that goes live', () => {
  it("never carries the test flag", () => {
    // netlify.toml is what Netlify builds from: it must not set the flag, and it must not
    // name it either (a commented line would still be read by a careless reader).
    const toml = read('netlify.toml');
    expect(toml).not.toMatch(/VITE_USAGE_TEST/);
  });

  it("never carries the test flag in the web build helper", () => {
    expect(read('tools/build-web.mjs')).not.toMatch(/VITE_USAGE_TEST/);
  });

  it("builds the web target, and nothing else", () => {
    expect(read('tools/build-web.mjs')).toMatch(/VITE_TARGET: 'web'/);
  });
});
