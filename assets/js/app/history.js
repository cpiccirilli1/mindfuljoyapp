// History: records finished sessions and draws the History page (under the More menu).
// The data and maths live in history-store.js. This file is the page side of it.
//
// Two small events keep the pieces in touch without importing each other:
//   'mj:history-changed'  a session was added, cleared or imported
//   'mj:show-history'     the History tab was opened
import { $ } from './dom.js';
import * as H from './history-store.js';

const changed = () => document.dispatchEvent(new Event('mj:history-changed'));

// Called by the timer and the breathing pacer when a session ends.
export function recordSession(kind, seconds){
  const s = H.addSession(kind, seconds);
  if(s) changed();
  return s;
}

const KIND_NAMES = { timer: 'Meditation', seq: 'Sit + walk', breath: 'Breathing' };
const body = $('histBody');
const clearBtn = $('histClear');
const panel = $('panel-history');

const dayName = date => date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

// ----- The three numbers at the top -----
function tilesHTML(sessions, now){
  const s = H.streaks(sessions, now);
  return '<div class="hist-tiles">'
    + '<div class="hist-tile"><b>' + plural(s.current, 'day') + '</b><span>Current streak</span></div>'
    + '<div class="hist-tile"><b>' + plural(s.best, 'day') + '</b><span>Best streak</span></div>'
    + '<div class="hist-tile"><b>' + H.formatDuration(H.weekSeconds(sessions, now)) + '</b><span>Past 7 days</span></div>'
    + '</div>';
}

// ----- Bar chart: minutes per day, last 7 days -----
function barsHTML(sessions, now){
  const days = H.lastDays(sessions, 7, now);
  const mins = days.map(d=> Math.round(d.seconds / 60));
  const top = Math.max(20, Math.ceil(Math.max.apply(null, mins) / 10) * 10);   // axis tops out at a round number
  const W = 330, H_ = 124, left = 24, bottom = 20, topPad = 14, barW = 22;
  const plotH = H_ - bottom - topPad;
  const gap = (W - left - 7 * barW) / 7;
  const yOf = v => topPad + plotH * (1 - v / top);
  let svg = '';
  [0, top / 2, top].forEach(v=>{
    svg += '<line class="hist-grid" x1="' + left + '" x2="' + W + '" y1="' + yOf(v) + '" y2="' + yOf(v) + '"/>'
         + '<text class="hist-axis" x="0" y="' + (yOf(v) + 3.5) + '">' + v + '</text>';
  });
  const best = mins.indexOf(Math.max.apply(null, mins));
  days.forEach((d, i)=>{
    const x = left + gap / 2 + i * (barW + gap), v = mins[i], h = plotH * v / top, y = H_ - bottom - h;
    const label = dayName(d.date) + ': ' + H.formatDuration(d.seconds);
    if(v > 0){
      const r = Math.min(4, h);
      svg += '<path class="hist-bar' + (i === 6 ? ' today' : '') + '" d="M' + x + ',' + (H_ - bottom) + ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y
           + ' H' + (x + barW - r) + ' Q' + (x + barW) + ',' + y + ' ' + (x + barW) + ',' + (y + r) + ' V' + (H_ - bottom) + ' Z"><title>' + label + '</title></path>';
    }
    svg += '<rect class="hist-hit" x="' + (x - gap / 2) + '" y="0" width="' + (barW + gap) + '" height="' + (H_ - bottom) + '"><title>' + label + '</title></rect>'
         + '<text class="hist-axis day" x="' + (x + barW / 2) + '" y="' + (H_ - 5) + '">' + d.date.toLocaleDateString(undefined, { weekday: 'narrow' }) + '</text>';
    if(v > 0 && i === best) svg += '<text class="hist-value" x="' + (x + barW / 2) + '" y="' + (y - 4) + '">' + v + '</text>';
  });
  const summary = 'Minutes meditated each day for the past 7 days: ' + days.map((d, i)=> dayName(d.date) + ' ' + mins[i]).join(', ') + '.';
  return '<div class="hist-card"><h3>Past 7 days <span>minutes</span></h3>'
    + '<svg viewBox="0 0 ' + W + ' ' + H_ + '" role="img" aria-label="' + summary + '">' + svg + '</svg></div>';
}

// ----- Calendar grid: 12 weeks -----
function gridHTML(sessions, now){
  const weeks = H.heatmapWeeks(sessions, 12, now);
  const first = weeks[0][0].key;
  const count = sessions.filter(s=> H.dayKey(s.t) >= first).length;
  let cells = '';
  weeks.forEach(col=> col.forEach(c=>{
    if(c.future){ cells += '<i class="fut"></i>'; return; }
    const label = dayName(c.date) + ': ' + (c.seconds ? H.formatDuration(c.seconds) : 'no sessions');
    cells += '<i class="l' + H.level(c.seconds) + (c.today ? ' today' : '') + '" title="' + label + '" aria-label="' + label + '"></i>';
  }));
  let legend = '';
  for(let l = 0; l <= 4; l++) legend += '<i class="l' + l + '"></i>';
  return '<div class="hist-card"><h3>Last 12 weeks <span>' + plural(count, 'session') + '</span></h3>'
    + '<div class="hist-grid-cells" role="img" aria-label="Calendar of the last 12 weeks. Darker squares are longer days.">' + cells + '</div>'
    + '<div class="hist-legend">Less ' + legend + ' More</div></div>';
}

// ----- Recent sessions -----
function when(t, now){
  const d = new Date(t * 1000), key = H.keyOf(d);
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  const label = key === H.keyOf(now) ? 'Today' : key === H.keyOf(yest) ? 'Yesterday' : dayName(d);
  return label + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function recentHTML(sessions, now){
  const rows = sessions.slice(-5).reverse().map(s=>
    '<li><span>' + when(s.t, now) + '</span><span class="dim">' + H.formatDuration(s.d) + ' &middot; ' + KIND_NAMES[s.k] + '</span></li>'
  ).join('');
  return '<div class="hist-card"><h3>Recent</h3><ol class="hist-recent">' + rows + '</ol></div>';
}

function render(){
  const sessions = H.loadSessions(), now = new Date();
  if(!sessions.length){
    body.innerHTML = tilesHTML(sessions, now)
      + '<p class="hist-empty">No sessions yet. Finish a timer or breathing session of a minute or more and it shows up here. '
      + 'Your history stays on this device, and you can move it to another one with Export and Import in the gear menu.</p>';
    clearBtn.hidden = true;
    return;
  }
  body.innerHTML = tilesHTML(sessions, now) + barsHTML(sessions, now) + gridHTML(sessions, now) + recentHTML(sessions, now);
  clearBtn.hidden = false;
}

clearBtn.addEventListener('click', ()=>{
  if(!confirm('Clear all of your history on this device? This cannot be undone. (Export first if you want a copy.)')) return;
  H.clearSessions();
  changed();
});
document.addEventListener('mj:show-history', render);
document.addEventListener('mj:history-changed', ()=>{ if(panel.classList.contains('active')) render(); });
