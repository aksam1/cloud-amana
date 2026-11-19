// A tiny helper so the web build can be made the same way everywhere:
//   node tools/build-web.mjs [--outDir=dist-web] [--test]
// It sets VITE_TARGET=web and runs the build.
//
// The live build can never carry the test-only flags: every environment variable whose name
// begins with VITE_USAGE_ is dropped, unless --test is given (only the usage test build asks
// for that). A unit test asserts that this file does not name the flag.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const argv = process.argv.slice(2);
const outDir = argv.find((a) => a.startsWith('--outDir='));
const testBuild = argv.includes('--test');
const rest = argv.filter((a) => !a.startsWith('--outDir=') && a !== '--test');

const env = { ...process.env, VITE_TARGET: 'web' };
if (!testBuild) {
  for (const key of Object.keys(env)) {
    if (key.startsWith('VITE_USAGE_')) delete env[key];
  }
}

const r = spawnSync(process.execPath, [vite, 'build', ...(outDir ? [outDir] : []), ...rest], {
  stdio: 'inherit',
  cwd: root,
  env,
});
process.exit(r.status ?? 1);
