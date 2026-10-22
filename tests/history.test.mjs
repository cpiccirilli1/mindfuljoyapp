// Tests for the history maths. Run them with:  node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../assets/js/app/history-store.js';

// A session that ended on a given local day (year, month 1-12, day) at 8:00 am, lasting `minutes`.
let n = 0;
const on = (y, m, d, minutes = 20, k = 'timer') => ({ id: 's' + (n++), t: Math.floor(new Date(y, m - 1, d, 8).getTime() / 1000), d: minutes * 60, k });
const today = new Date(2026, 9, 22, 18, 0);   // Thu 22 Oct 2026, evening

// A tiny stand-in for localStorage.
const fakeStorage = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };

test('cleanSession keeps good sessions and rejects bad ones', () => {
  const now = Math.floor(today.getTime() / 1000);
  assert.deepEqual(H.cleanSession({ id: 'a-1', t: now, d: 600, k: 'timer', extra: 'x' }, now), { id: 'a-1', t: now, d: 600, k: 'timer' });
  assert.equal(H.cleanSession({ id: 'a-1', t: now, d: 600, k: 'nope' }, now), null);      // unknown kind
  assert.equal(H.cleanSession({ id: 'bad id!', t: now, d: 600, k: 'timer' }, now), null);  // odd characters in the id
  assert.equal(H.cleanSession({ id: 'a', t: now + 10 * 86400, d: 600, k: 'timer' }, now), null); // far in the future
  assert.equal(H.cleanSession({ id: 'a', t: now, d: 0, k: 'timer' }, now), null);          // zero length
  assert.equal(H.cleanSession('hello', now), null);
});

test('addSession ignores anything under a minute and saves the rest', () => {
  const st = fakeStorage();
  assert.equal(H.addSession('timer', 30, today.getTime(), st), null);
  const s = H.addSession('breath', 125, today.getTime(), st);
  assert.equal(s.d, 125);
  assert.equal(H.loadSessions(st).length, 1);
});

test('merging twice adds nothing the second time', () => {
  const a = [on(2026, 10, 20), on(2026, 10, 21)];
  const b = [a[1], on(2026, 10, 22)];
  const once = H.mergeSessions(a, b);
  assert.equal(once.added, 1);
  const twice = H.mergeSessions(once.sessions, b);
  assert.equal(twice.added, 0);
  assert.equal(twice.sessions.length, 3);
});

test('streak counts days in a row ending today', () => {
  const list = [on(2026, 10, 20), on(2026, 10, 21), on(2026, 10, 22)];
  assert.deepEqual(H.streaks(list, today), { current: 3, best: 3 });
});

test('streak stays alive until midnight if today has no session yet', () => {
  const list = [on(2026, 10, 20), on(2026, 10, 21)];
  assert.equal(H.streaks(list, today).current, 2);
});

test('streak resets after a missed day, and best remembers the longest run', () => {
  const list = [on(2026, 10, 1), on(2026, 10, 2), on(2026, 10, 3), on(2026, 10, 4), on(2026, 10, 21)];
  assert.deepEqual(H.streaks(list, today), { current: 1, best: 4 });
  assert.equal(H.streaks([on(2026, 10, 18)], today).current, 0);
});

test('a day needs 5 minutes in total to count; short sessions add up', () => {
  assert.equal(H.streaks([on(2026, 10, 22, 4)], today).current, 0);
  assert.equal(H.streaks([on(2026, 10, 22, 3), on(2026, 10, 22, 3)], today).current, 1);
});

test('streak works across a month end', () => {
  const list = [on(2026, 9, 30), on(2026, 10, 1)];
  assert.equal(H.streaks(list, new Date(2026, 9, 1, 20)).current, 2);
});

test('lastDays gives seven days ending today with the right totals', () => {
  const days = H.lastDays([on(2026, 10, 22, 15), on(2026, 10, 22, 5), on(2026, 10, 16, 30)], 7, today);
  assert.equal(days.length, 7);
  assert.equal(days[6].key, '2026-10-22');
  assert.equal(days[6].seconds, 20 * 60);
  assert.equal(days[0].key, '2026-10-16');
  assert.equal(days[0].seconds, 30 * 60);
  assert.equal(H.weekSeconds([on(2026, 10, 22, 15), on(2026, 10, 16, 30), on(2026, 10, 15, 99)], today), 45 * 60);
});

test('heatmap is 12 Monday-to-Sunday columns, ending this week, with future days marked', () => {
  const weeks = H.heatmapWeeks([on(2026, 10, 22)], 12, today);
  assert.equal(weeks.length, 12);
  weeks.forEach(w => assert.equal(w.length, 7));
  const last = weeks[11];
  assert.equal(last[0].key, '2026-10-19');          // Monday of this week
  assert.equal(last[3].today, true);                // Thursday
  assert.equal(last[4].future, true);               // Friday has not happened yet
  assert.equal(last[3].seconds, 1200);
});

test('level steps get darker with longer days', () => {
  assert.deepEqual([0, 60, 600, 1200, 2400].map(H.level), [0, 1, 2, 3, 4]);
});

test('export then import round-trips', () => {
  const list = [on(2026, 10, 21), on(2026, 10, 22)];
  const file = H.buildExport(list, { scheme: 'sage', volume: '0.5', evil: 'ignored' }, today);
  const back = H.parseImport(JSON.stringify(file), Math.floor(today.getTime() / 1000));
  assert.equal(back.error, undefined);
  assert.deepEqual(back.sessions, list);
  assert.deepEqual(back.settings, { scheme: 'sage', volume: '0.5' });   // unknown settings are dropped
});

test('import rejects things that are not backups', () => {
  const now = Math.floor(today.getTime() / 1000);
  assert.ok(H.parseImport('', now).error);
  assert.ok(H.parseImport('not json', now).error);
  assert.ok(H.parseImport('{"app":"other","version":1,"sessions":[]}', now).error);
  assert.ok(H.parseImport('{"app":"mindful-joy","version":99,"sessions":[]}', now).error);
  assert.ok(H.parseImport('{"app":"mindful-joy","version":1}', now).error);
});

test('import skips bad sessions and counts them', () => {
  const now = Math.floor(today.getTime() / 1000);
  const text = JSON.stringify({ app: 'mindful-joy', version: 1, sessions: [
    { id: 'ok-1', t: now, d: 600, k: 'timer' }, { id: '<script>', t: now, d: 600, k: 'timer' }, { id: 'ok-1', t: now, d: 600, k: 'timer' }
  ] });
  const r = H.parseImport(text, now);
  assert.equal(r.sessions.length, 1);
  assert.equal(r.skipped, 2);
});

test('settings with oversized or nested junk are dropped', () => {
  const big = { scheme: 'x'.repeat(500), segments: [{ type: 'sit', minutes: 20 }], volume: { a: { b: { c: 1 } } } };
  assert.deepEqual(H.cleanSettings(big), { segments: [{ type: 'sit', minutes: 20 }] });
});

test('the formatter reads naturally', () => {
  assert.equal(H.formatDuration(45 * 60), '45m');
  assert.equal(H.formatDuration(155 * 60), '2h 35m');
  assert.equal(H.formatDuration(120 * 60), '2h');
});
