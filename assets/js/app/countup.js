// Count Up timer (More menu).
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Count Up (open-ended stopwatch) ----------
const cuEl = { time: document.getElementById('cuTime'), phase: document.getElementById('cuPhase'), ring: document.getElementById('cuRing'),
  play: document.getElementById('cuPlay'), reset: document.getElementById('cuReset'), chime: document.getElementById('cuChime') };
cuEl.ring.style.strokeDasharray = CIRC;
function cuRender(){
  const s = Math.floor(cuElapsed);
  cuEl.time.textContent = fmt(s);
  cuEl.ring.style.strokeDashoffset = CIRC * (1 - (cuElapsed % 60) / 60);
  cuEl.phase.textContent = cuRunning ? 'Sitting' : (cuElapsed > 0 ? 'Paused' : 'Ready');
}
function cuButtons(){
  cuEl.play.innerHTML = cuRunning ? '&#10074;&#10074;' : '&#9654;';
  cuEl.play.setAttribute('aria-label', cuRunning ? 'Pause Count Up' : (cuElapsed > 0 ? 'Resume Count Up' : 'Start Count Up'));
  updateLive();
}
function cuTick(){
  cuElapsed = (Date.now() - cuStart) / 1000;
  const every = +cuEl.chime.value * 60;
  if(every > 0){
    const n = Math.floor(cuElapsed / every);
    if(n > cuLastChime){ cuLastChime = n; playBell('interval'); }
  }
  cuRender();
}
function cuPlay(){
  if(isRunning) pause();
  pPause(); swPause(); stopBreathing();
  ensureAudio(); acquireWake();
  if(cuElapsed === 0){ playBell('start'); cuLastChime = 0; }
  cuRunning = true; cuStart = Date.now() - cuElapsed * 1000;
  clearInterval(cuHandle); cuHandle = setInterval(cuTick, 200);
  announce(cuElapsed > 0 ? 'Resumed' : 'Count up started');
  cuButtons(); cuTick();
}
function cuPause(){
  if(!cuRunning) return;
  cuElapsed = (Date.now() - cuStart) / 1000; cuRunning = false;
  clearInterval(cuHandle); cuHandle = null;
  maybeRelease();
  announce('Paused ' + fmt(cuElapsed)); cuRender(); cuButtons();
}
function cuReset(){
  cuRunning = false; clearInterval(cuHandle); cuHandle = null; cuElapsed = 0; cuLastChime = 0;
  stopBells(); maybeRelease();
  announce('Count up reset'); cuRender(); cuButtons();
}
cuEl.play.addEventListener('click', ()=>{ cuRunning ? cuPause() : cuPlay(); });
cuEl.reset.addEventListener('click', cuReset);
cuRender(); cuButtons();
