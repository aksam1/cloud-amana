/**
 * Amanah: the daily deletion of expired usage records.
 *
 * The Privacy page promises each anonymous usage record ('ev' in Firestore) is deleted about 90 days
 * after it was sent: the app writes that moment into the record as 'exp'. Firestore's own TTL policy
 * needs the paid Blaze plan, and the project stays on the free Spark plan, so this Google Apps Script
 * does the deleting instead. It runs on Google's servers once a day, signed in as the project's owner,
 * so there is no key or service account to keep, and Google emails the owner if a run fails.
 *
 * This file is the source of the script at script.google.com ("Amanah usage clean-up"). If you change
 * it, paste it there again (CLAUDE.md, "Deleting the usage records"). tools/cleanup/cleanup.test.js
 * runs the logic in Node against a pretend Firestore.
 *
 *   setup()         run once by hand: makes the daily trigger, then proves a delete works end to end
 *   dailyCleanup()  what the trigger runs
 *   selfTest()      writes a record that expired an hour ago, cleans up, and checks it is gone
 */

const PROJECT = 'amanah-stories';
const DOCS = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';
const PAGE = 500; // the most writes one batchWrite takes
const MAX_PER_RUN = 18000; // Spark allows 20,000 deletes a day; the rest is left for the console

/** The runQuery body: names only (no counts are read) of 'ev' records whose 'exp' is before 'nowIso'. */
function expiredQuery(nowIso, limit) {
  return {
    structuredQuery: {
      from: [{ collectionId: 'ev' }],
      select: { fields: [{ fieldPath: '__name__' }] },
      where: { fieldFilter: { field: { fieldPath: 'exp' }, op: 'LESS_THAN', value: { timestampValue: nowIso } } },
      orderBy: [{ field: { fieldPath: 'exp' }, direction: 'ASCENDING' }],
      limit,
    },
  };
}

/** runQuery answers with one row per document, or a single row with no document when nothing matched. */
function namesFrom(rows) {
  return (Array.isArray(rows) ? rows : []).filter((r) => r && r.document && r.document.name).map((r) => r.document.name);
}

/**
 * Delete every 'ev' record whose 'exp' has passed, at most 'max' of them.
 * 'call(path, body)' posts to DOCS + path and returns the parsed answer (or throws).
 * Returns { deleted, failed, more }; 'more' is true when the cap stopped it with records still waiting.
 */
function cleanExpired(call, now, max) {
  const nowIso = now.toISOString();
  let deleted = 0;
  let failed = 0;
  for (;;) {
    const room = max - deleted - failed;
    if (room <= 0) return { deleted, failed, more: namesFrom(call(':runQuery', expiredQuery(nowIso, 1))).length > 0 };
    const limit = Math.min(PAGE, room);
    const names = namesFrom(call(':runQuery', expiredQuery(nowIso, limit)));
    if (!names.length) return { deleted, failed, more: false };
    const answer = call(':batchWrite', { writes: names.map((name) => ({ delete: name })) });
    const status = (answer && answer.status) || [];
    names.forEach((_, i) => {
      // an empty status is success; a code means that one write failed
      if (status[i] && status[i].code) failed++;
      else deleted++;
    });
    // a failed record would come back in the next query, so stop rather than loop on it
    if (failed) return { deleted, failed, more: true };
    if (names.length < limit) return { deleted, failed, more: false };
  }
}

/* ---- Apps Script only below: UrlFetchApp and ScriptApp exist only on Google's servers ---- */

function headers_() {
  return { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Goog-User-Project': PROJECT };
}

function firestoreCall_(path, body) {
  const res = UrlFetchApp.fetch(DOCS + path, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(body),
    headers: headers_(),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200) throw new Error('Firestore ' + path + ' answered ' + code + ': ' + text.slice(0, 400));
  return JSON.parse(text);
}

function dailyCleanup() {
  const result = cleanExpired(firestoreCall_, new Date(), MAX_PER_RUN);
  console.log(JSON.stringify(result));
  // throwing makes the run show as failed, and Google emails the owner
  if (result.failed) throw new Error(result.failed + ' expired usage records could not be deleted');
  return result;
}

function selfTest() {
  const expired = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const doc = firestoreCall_('/ev', {
    fields: { ref: { stringValue: 'cleanup-selftest' }, exp: { timestampValue: expired } },
  });
  const result = cleanExpired(firestoreCall_, new Date(), MAX_PER_RUN);
  const after = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/' + doc.name, {
    headers: headers_(),
    muteHttpExceptions: true,
  }).getResponseCode();
  const ok = after === 404 && result.deleted >= 1 && !result.failed;
  console.log(JSON.stringify({ selfTest: ok ? 'PASS' : 'FAIL', wrote: doc.name, afterStatus: after, result }));
  if (!ok) throw new Error('self-test failed: the expired record answered ' + after + ' after the clean-up');
  return result;
}

function setup() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'dailyCleanup')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyCleanup').timeBased().everyDays(1).atHour(4).create();
  console.log('daily trigger set for dailyCleanup, around 4 am in the script time zone');
  return selfTest();
}
