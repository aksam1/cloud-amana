// A tiny helper so the web build can be made the same way everywhere:
//   node tools/build-web.mjs
// It sets VITE_TARGET=web and runs the build.
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['vite', 'build'], { stdio: 'inherit', shell: true, env: { ...process.env, VITE_TARGET: 'web' } });
process.exit(r.status ?? 1);
