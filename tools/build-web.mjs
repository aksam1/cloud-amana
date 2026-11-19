// A tiny helper so the web build can be made the same way everywhere:
//   node tools/build-web.mjs
// It sets VITE_TARGET=web and runs the build.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const r = spawnSync(process.execPath, [vite, 'build'], { stdio: 'inherit', cwd: root, env: { ...process.env, VITE_TARGET: 'web' } });
process.exit(r.status ?? 1);
