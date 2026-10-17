// Stopwatch with laps (More menu).
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Stopwatch (hundredths of a second, with laps) ----------
const swEl = { time: document.getElementById('swTime'), phase: document.getElementById('swPhase'), ring: document.getElementById('swRing'),
  play: document.getElementById('swPlay'), reset: document.getElementById('swReset'), lap: document.getElementById('swLap'), laps: document.getElementById('swLaps') };
swEl.ring.style.strokeDasharray = CIRC;
const SW_MAX_LAPS = 99;
let swStart = 0, swHandle = null, swLaps = [], swLastLap = 0; // swHandle is a requestAnimationFrame id
function fmtSw(ms){
  ms = Math.max(0, Math.floor(ms));
  const cs = Math.floor((ms % 1000) / 10), s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000);
  const two = n => String(n).padStart(2, '0');
  return (h > 0 ? h + ':' : '') + two(m) + ':' + two(s) + '.' + two(cs);
}
function swRender(){
  swEl.time.textContent = fmtSw(swElapsed);
  swEl.ring.style.strokeDashoffset = CIRC * (1 - (swElapsed % 60000) / 60000);
  swEl.phase.textContent = swRunning ? 'Running' : (swElapsed > 0 ? 'Paused' : 'Ready');
}
function swButtons(){
  swEl.play.innerHTML = swRunning ? '&#10074;&#10074;' : '&#9654;';
  swEl.play.setAttribute('aria-label', swRunning ? 'Pause Stopwatch' : (swElapsed > 0 ? 'Resume Stopwatch' : 'Start Stopwatch'));
  swEl.lap.disabled = !swRunning || swLaps.length >= SW_MAX_LAPS;
  updateLive();
}
function swTick(){ swElapsed = Date.now() - swStart; swRender(); }
// Redraw once per screen frame so the hundredths run smoothly; the time itself always comes from the clock.
function swLoop(){ swTick(); swHandle = requestAnimationFrame(swLoop); }
function swStopLoop(){ if(swHandle !== null){ cancelAnimationFrame(swHandle); swHandle = null; } }
function swPlay(){
  if(isRunning) pause();
  pPause(); cuPause(); stopBreathing();
  acquireWake();
  swRunning = true; swStart = Date.now() - swElapsed;
  swStopLoop(); swLoop();
  announce(swElapsed > 0 ? 'Resumed' : 'Stopwatch started');
  swButtons();
}
function swPause(){
  if(!swRunning) return;
  swElapsed = Date.now() - swStart; swRunning = false;
  swStopLoop();
  maybeRelease();
  announce('Paused ' + fmtSw(swElapsed).replace('.', ' point ')); swRender(); swButtons();
}
function swRecordLap(){
  if(!swRunning || swLaps.length >= SW_MAX_LAPS) return;
  swElapsed = Date.now() - swStart;
  const lapMs = swElapsed - swLastLap; swLastLap = swElapsed;
  swLaps.push({ lap: lapMs, total: swElapsed });
  const li = document.createElement('li');
  const n = document.createElement('span'); n.className = 'lap-n'; n.textContent = 'Lap ' + swLaps.length;
  const t = document.createElement('span'); t.className = 'lap-t'; t.textContent = fmtSw(lapMs);
  const tot = document.createElement('span'); tot.className = 'lap-total'; tot.textContent = fmtSw(swElapsed);
  li.append(n, t, tot);
  swEl.laps.prepend(li); swEl.laps.hidden = false;
  announce('Lap ' + swLaps.length + ', ' + fmtSw(lapMs).replace('.', ' point '));
  swButtons();
}
function swReset(){
  swRunning = false; swStopLoop(); swElapsed = 0; swLastLap = 0; swLaps = [];
  swEl.laps.textContent = ''; swEl.laps.hidden = true;
  maybeRelease();
  announce('Stopwatch reset'); swRender(); swButtons();
}
swEl.play.addEventListener('click', ()=>{ swRunning ? swPause() : swPlay(); });
swEl.reset.addEventListener('click', swReset);
swEl.lap.addEventListener('click', swRecordLap);
swRender(); swButtons();
