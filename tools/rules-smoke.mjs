// A smoke test for the Firestore rules: it makes the requests the rules must allow and the
// requests the rules must refuse, and prints PASS or FAIL for each.
//
//   node tools/rules-smoke.mjs --project=amanah-stories --key=<the web API key>
//
// or with the values in the environment:
//   VITE_FIREBASE_PROJECT_ID=amanah-stories VITE_FIREBASE_API_KEY=... node tools/rules-smoke.mjs
//
// The owner runs this after deploying firestore.rules. It talks to the real Firestore REST API,
// so it is never run against the project by accident: without a project and key (flags or env) it does
// nothing but print what to do.
//
// The requests it makes:
//   must succeed
//     · a valid `ev` document, built by buildDoc() and toFirestore() from src/lib/usageRules.js
//     · the same, sent exactly as the app sends it (a text/plain body, which needs no CORS preflight)
//   The two it adds are marked ref 'rules-smoke', so they can be left out of the totals; like every
//   count they are deleted once `exp` passes (the daily Apps Script job, tools/cleanup/Code.gs).
//   must fail
//     · an `ev` document with one extra field
//     · an `ev` document carrying the reader's chosen view
//     · an `ev` document with 121 events
//     · a read of an `ev` document (only the owner may read)
//     · a read of `users/x` without signing in
//     · a write to `daily`
import { buildDoc, toFirestore } from '../src/lib/usageRules.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = ''] = a.replace(/^--/, '').split('=');
    return [k, v];
  }),
);
const project = args.project || process.env.VITE_FIREBASE_PROJECT_ID || '';
const key = args.key || process.env.VITE_FIREBASE_API_KEY || '';

if (!project || !key) {
  console.log('Nothing to do: no project and key.');
  console.log('Run it as: node tools/rules-smoke.mjs --project=<project> --key=<web api key>');
  process.exit(2);
}

const BASE = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
const now = Date.now();
let failures = 0;

/** A Firestore document name with a random-ish id (a visit-part is not identified). */
const newId = () => `smoke-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Post one document to a collection. Returns { ok, status, body }. */
async function create(collection, fields, type = 'application/json') {
  const res = await fetch(`${BASE}/${collection}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': type },
    body: JSON.stringify({ fields }),
  });
  let body = '';
  try {
    body = await res.text();
  } catch {
    /* an empty body is enough */
  }
  return { ok: res.ok, status: res.status, body };
}

/** Read one document. */
async function read(path) {
  const res = await fetch(`${BASE}/${path}?key=${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return { ok: res.ok, status: res.status };
}

/** Report one line. */
function check(name, passed, detail = '') {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!passed) failures += 1;
}

/** The fields of a valid document, as the app would send them. */
const validFields = () => {
  const doc = buildDoc({
    now,
    part: 0,
    device: 'phone',
    lang: 'en',
    ref: 'rules-smoke',
    app: true,
    ret: '2-7d',
    seconds: 120,
    routes: { scene: 1 },
    events: ['scene.start:heavens'],
    errors: ['boom'],
  });
  return toFirestore(doc).fields;
};

// ── must succeed ──────────────────────────────────────────────────────────────
const ok = await create('ev', validFields());
check('a valid ev document is accepted', ok.ok, `status ${ok.status}`);

const asApp = await create('ev', validFields(), 'text/plain;charset=UTF-8');
check('a valid ev document sent as the app sends it (text/plain) is accepted', asApp.ok, `status ${asApp.status}`);

// ── must fail ─────────────────────────────────────────────────────────────────
const extra = { ...validFields(), secret: { stringValue: 'x' } };
const withExtra = await create('ev', extra);
check('an ev document with an extra field is refused', !withExtra.ok, `status ${withExtra.status}`);

const withView = { ...validFields(), mode: { stringValue: 'muslim' } };
const withMode = await create('ev', withView);
check('an ev document carrying the chosen view is refused', !withMode.ok, `status ${withMode.status}`);

const manyEvents = {
  ...validFields(),
  ev: { arrayValue: { values: Array.from({ length: 121 }, (_, i) => ({ stringValue: `scene.start:s${i}` })) } },
};
const withMany = await create('ev', manyEvents);
check('an ev document with 121 events is refused', !withMany.ok, `status ${withMany.status}`);

const evRead = await read(`ev/${newId()}`);
check('an ev document cannot be read without signing in', !evRead.ok, `status ${evRead.status}`);

const userRead = await read(`users/${newId()}`);
check('a user document cannot be read without signing in', !userRead.ok, `status ${userRead.status}`);

const dailyWrite = await create('daily', { count: { integerValue: '1' } });
check('a daily total cannot be written without signing in', !dailyWrite.ok, `status ${dailyWrite.status}`);

console.log(failures ? `\n${failures} of the checks failed.` : '\nAll the checks passed.');
process.exit(failures ? 1 : 0);
