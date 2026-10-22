// Session history: the data and the arithmetic, with no page code in it.
// Everything here is plain functions, so it can run in the browser and in the tests (tests/history.test.mjs).
//
// A session is one small record:
//   { id: 'lq3x9k-a8f2', t: 1792700000, d: 1200, k: 'timer' }
//     id  unique name, so importing the same backup twice never makes copies
//     t   when it ended, in seconds since 1970 (the "unix time")
//     d   how long it lasted, in seconds
//     k   what it was: 'timer' (main timer), 'seq' (sit + walk) or 'breath' (breathing pacer)
//
// History lives in localStorage on this device only. It is separate from the settings key.

export const HISTORY_KEY = 'mj.history.v1';
export const SETTINGS_KEY = 'still.settings.v1';
export const FILE_APP = 'mindful-joy';
export const FILE_VERSION = 1;

export const MIN_SESSION_SECONDS = 60;   // shorter than this is not recorded
export const DAY_GOAL_SECONDS = 300;     // a day counts toward the streak at 5 minutes or more
export const MAX_SESSIONS = 5000;        // keeps storage small; the oldest are dropped first
const MAX_SESSION_SECONDS = 24 * 3600;
const KINDS = ['timer', 'seq', 'breath'];
const OLDEST_T = 1577836800;             // 1 Jan 2020: nothing from before the app existed

// Settings keys that an import is allowed to bring in (the same ones storage.js saves).
const SETTING_KEYS = [
  'scheme','duration','customLen','bell','volume','startEnabled','startCount','endEnabled','endCount','vibrate',
  'prep','intervalEnabled','mode','intervalEvery','customTimes','pattern','cycles','breathSound','segEnabled',
  'segCount','segments','pomoFocus','pomoShort','pomoLong','pomoRounds','pomoAuto','cuChime'
];

// ---------- Making and checking sessions ----------
export function newId(nowMs = Date.now()){
  return nowMs.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Returns a clean copy of a session, or null if it is not a believable one.
// Used on everything that comes from outside (saved data, imported files).
export function cleanSession(x, nowSec = Math.floor(Date.now() / 1000)){
  if(!x || typeof x !== 'object') return null;
  const id = typeof x.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(x.id) ? x.id : null;
  const t = Math.round(Number(x.t)), d = Math.round(Number(x.d));
  if(!id || !Number.isFinite(t) || !Number.isFinite(d)) return null;
  if(t < OLDEST_T || t > nowSec + 86400) return null;
  if(d < 1 || d > MAX_SESSION_SECONDS) return null;
  if(KINDS.indexOf(x.k) < 0) return null;
  return { id, t, d, k: x.k };
}
export function cleanSessions(list, nowSec){
  if(!Array.isArray(list)) return [];
  const seen = new Set(), out = [];
  list.forEach(x=>{
    const s = cleanSession(x, nowSec);
    if(s && !seen.has(s.id)){ seen.add(s.id); out.push(s); }
  });
  return out;
}
function sortAndTrim(list){
  list.sort((a, b)=> a.t - b.t);
  return list.length > MAX_SESSIONS ? list.slice(list.length - MAX_SESSIONS) : list;
}

// Add the incoming sessions to the existing ones. Sessions with an id we already have are skipped.
export function mergeSessions(existing, incoming){
  const have = new Set(existing.map(s=> s.id));
  const added = incoming.filter(s=> !have.has(s.id));
  return { sessions: sortAndTrim(existing.concat(added)), added: added.length };
}

// ---------- Saving and loading ----------
export function loadSessions(storage = globalThis.localStorage){
  try{
    const raw = JSON.parse(storage.getItem(HISTORY_KEY) || 'null');
    return sortAndTrim(cleanSessions(raw && raw.sessions));
  }catch(e){ return []; }
}
export function saveSessions(list, storage = globalThis.localStorage){
  try{ storage.setItem(HISTORY_KEY, JSON.stringify({ v: 1, sessions: list })); return true; }
  catch(e){ return false; }
}
// Record a finished (or ended-early) session. Returns the record, or null if it was too short.
export function addSession(kind, seconds, nowMs = Date.now(), storage = globalThis.localStorage){
  const d = Math.round(seconds);
  if(!(d >= MIN_SESSION_SECONDS)) return null;
  const s = cleanSession({ id: newId(nowMs), t: Math.floor(nowMs / 1000), d, k: kind }, Math.floor(nowMs / 1000));
  if(!s) return null;
  const list = loadSessions(storage);
  list.push(s);
  saveSessions(sortAndTrim(list), storage);
  return s;
}
export function clearSessions(storage = globalThis.localStorage){
  try{ storage.removeItem(HISTORY_KEY); }catch(e){}
}

// ---------- Days ----------
const pad = n => String(n).padStart(2, '0');
export function keyOf(date){ return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()); }
// "2026-10-22" for the local day a session ended on.
export function dayKey(tSec){ return keyOf(new Date(tSec * 1000)); }
function atNoon(date){ return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12); }
function shiftDays(date, n){ const d = atNoon(date); d.setDate(d.getDate() + n); return d; }
// Whole-day number, so two keys can be compared for "the next day" without clock-change surprises.
function dayNumber(key){ const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); }

// { '2026-10-22': 1500, ... } seconds meditated per local day
export function dailyTotals(sessions){
  const totals = {};
  sessions.forEach(s=>{ const k = dayKey(s.t); totals[k] = (totals[k] || 0) + s.d; });
  return totals;
}

// ---------- Streaks and totals ----------
// current: days in a row ending today. If today has no meditation yet, the streak is still alive
// (it ends at midnight), so it counts back from yesterday. best: the longest run ever.
export function streaks(sessions, now = new Date()){
  const totals = dailyTotals(sessions);
  const counted = Object.keys(totals).filter(k=> totals[k] >= DAY_GOAL_SECONDS).map(dayNumber).sort((a, b)=> a - b);
  let best = 0, run = 0;
  counted.forEach((n, i)=>{
    run = i > 0 && n === counted[i - 1] + 1 ? run + 1 : 1;
    if(run > best) best = run;
  });
  const set = new Set(counted);
  let day = dayNumber(keyOf(now));
  if(!set.has(day)) day--;
  let current = 0;
  while(set.has(day)){ current++; day--; }
  return { current, best };
}

// The last n days, oldest first, ending today: [{ key, date, seconds }]
export function lastDays(sessions, n, now = new Date()){
  const totals = dailyTotals(sessions);
  const out = [];
  for(let i = n - 1; i >= 0; i--){
    const date = shiftDays(now, -i), key = keyOf(date);
    out.push({ key, date, seconds: totals[key] || 0 });
  }
  return out;
}
export function weekSeconds(sessions, now = new Date()){
  return lastDays(sessions, 7, now).reduce((t, d)=> t + d.seconds, 0);
}

// A calendar grid: `weeks` columns, each a list of 7 days from Monday to Sunday, ending with this week.
// Days after today are marked future so they can be left blank.
export function heatmapWeeks(sessions, weeks = 12, now = new Date()){
  const totals = dailyTotals(sessions);
  const todayKey = keyOf(now);
  const sinceMonday = (now.getDay() + 6) % 7;
  const thisMonday = shiftDays(now, -sinceMonday);
  const out = [];
  for(let w = weeks - 1; w >= 0; w--){
    const col = [];
    for(let i = 0; i < 7; i++){
      const date = shiftDays(thisMonday, -7 * w + i), key = keyOf(date);
      col.push({ key, date, seconds: totals[key] || 0, future: key > todayKey, today: key === todayKey });
    }
    out.push(col);
  }
  return out;
}
// 0 = nothing, 1 to 4 = darker as the day gets longer
export function level(seconds){
  const m = seconds / 60;
  if(m <= 0) return 0;
  if(m < 10) return 1;
  if(m < 20) return 2;
  if(m < 40) return 3;
  return 4;
}
export function formatDuration(seconds){
  const m = Math.round(seconds / 60);
  if(m < 60) return m + 'm';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? h + 'h ' + r + 'm' : h + 'h';
}

// ---------- Export and import ----------
function cleanSettingValue(v, depth = 0){
  if(v === null || typeof v === 'boolean') return v;
  if(typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if(typeof v === 'string') return v.length <= 200 ? v : undefined;
  if(depth >= 2) return undefined;
  if(Array.isArray(v)){
    if(v.length > 100) return undefined;
    const out = v.map(x=> cleanSettingValue(x, depth + 1));
    return out.indexOf(undefined) < 0 ? out : undefined;
  }
  if(typeof v === 'object'){
    const keys = Object.keys(v);
    if(keys.length > 20) return undefined;
    const out = {};
    for(const k of keys){
      const c = cleanSettingValue(v[k], depth + 1);
      if(c === undefined) return undefined;
      out[k] = c;
    }
    return out;
  }
  return undefined;
}
export function cleanSettings(obj){
  if(!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const out = {};
  SETTING_KEYS.forEach(k=>{
    if(!(k in obj)) return;
    const c = cleanSettingValue(obj[k]);
    if(c !== undefined) out[k] = c;
  });
  return Object.keys(out).length ? out : null;
}

export function buildExport(sessions, settings = null, now = new Date()){
  const file = { app: FILE_APP, version: FILE_VERSION, exported: now.toISOString(), sessions };
  const s = cleanSettings(settings);
  if(s) file.settings = s;
  return file;
}
export function exportFileName(now = new Date()){ return 'mindful-joy-backup-' + keyOf(now) + '.json'; }

// Read a backup file's text. Returns { sessions, settings, skipped } or { error }.
// Nothing is trusted: the text must be JSON from this app, and every session and setting is checked.
export function parseImport(text, nowSec = Math.floor(Date.now() / 1000)){
  if(typeof text !== 'string' || !text.trim()) return { error: 'The file is empty.' };
  if(text.length > 3000000) return { error: 'The file is too large to be a Mindful Joy backup.' };
  let data;
  try{ data = JSON.parse(text); }catch(e){ return { error: 'That is not a Mindful Joy backup (the text could not be read).' }; }
  if(!data || typeof data !== 'object' || data.app !== FILE_APP) return { error: 'That is not a Mindful Joy backup.' };
  if(typeof data.version !== 'number' || data.version > FILE_VERSION){
    return { error: 'This backup is from a newer version of Mindful Joy. Please reload the site and try again.' };
  }
  if(!Array.isArray(data.sessions)) return { error: 'The backup has no history in it.' };
  const sessions = cleanSessions(data.sessions, nowSec);
  return { sessions, settings: cleanSettings(data.settings), skipped: data.sessions.length - sessions.length };
}
