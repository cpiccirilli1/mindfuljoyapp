// Count Up timer (More menu): runs until you stop it, with an optional interval chime.
import { $ } from './dom.js';
import { fmt, announce, initRing, setRing } from './display.js';
import { ensureAudio, stopBells, playBell } from './audio.js';
import { acquireWake } from './wake.js';
import { registerActivity, pauseOthers, maybeRelease, updateLive } from './activity.js';

const cuEl = { time: $('cuTime'), phase: $('cuPhase'), ring: $('cuRing'),
  play: $('cuPlay'), reset: $('cuReset'), chime: $('cuChime') };
initRing(cuEl.ring);
let cuRunning = false, cuStart = 0, cuElapsed = 0, cuHandle = null, cuLastChime = 0;

function cuRender(){
  const s = Math.floor(cuElapsed);
  cuEl.time.textContent = fmt(s);
  setRing(cuEl.ring, (cuElapsed % 60) / 60);   // the ring fills once a minute
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
  pauseOthers('countup');
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
export function cuReset(){
  cuRunning = false; clearInterval(cuHandle); cuHandle = null; cuElapsed = 0; cuLastChime = 0;
  stopBells(); maybeRelease();
  announce('Count up reset'); cuRender(); cuButtons();
}
export function cuToggle(){ cuRunning ? cuPause() : cuPlay(); }

registerActivity('countup', { isRunning: ()=> cuRunning, pause: cuPause, more: true });

cuEl.play.addEventListener('click', cuToggle);
cuEl.reset.addEventListener('click', cuReset);
cuRender(); cuButtons();
