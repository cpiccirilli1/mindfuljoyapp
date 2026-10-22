// Main meditation timer: session length, the tick loop, play / pause / reset.
import { $ } from './dom.js';
import { settings } from './state.js';
import { fmt, announce, updateRing } from './display.js';
import { ensureAudio, stopBells, playBell } from './audio.js';
import { acquireWake, releaseWake } from './wake.js';
import { registerActivity, pauseOthers } from './activity.js';
import { seq, isSeq, seqTotalSeconds, segIndexAt, spokenSeg, sessionLabel, renderSeq, renderSeqIdle } from './sequence.js';
import { resetIntervals, checkIntervals } from './intervals.js';
import { recordSession } from './history.js';

// ----- Session length menu -----
const durationSelect = $('durationSelect');
for(let m=5; m<=60; m+=5){
  const opt = document.createElement('option');
  opt.value = m; opt.textContent = m + ' min';
  if(m===20) opt.selected = true;
  durationSelect.appendChild(opt);
}
[['sequence','Sit + walk'],['custom','Custom length']].forEach(([v,t])=>{
  const opt = document.createElement('option');
  opt.value = v; opt.textContent = t;
  durationSelect.appendChild(opt);
});
const customLenRow = $('customLenRow');
const customLenInput = $('customLenInput');
const seqEditor = $('seqEditor');
const segStatus = $('segStatus');

const timeDisplay = $('timeDisplay');
const phaseLabel = $('phaseLabel');
const playBtn = $('playBtn');
const resetBtn = $('resetBtn');

// ----- State -----
let totalSeconds = Number(durationSelect.value) * 60;
let phase = 'idle'; // idle | prep | session
let phaseTotal = totalSeconds;
let phaseStartTimestamp = null;
let phasePausedElapsed = 0;
let isRunning = false;
let tickHandle = null;

$('prepSelect').addEventListener('change', e=>{ settings.prepSeconds = Number(e.target.value); });

export const isIdle = () => phase === 'idle';

function render(remaining){
  timeDisplay.textContent = fmt(remaining);
  updateRing(remaining, phaseTotal);
}

// ----- Timer control -----
function readLength(){
  const v = durationSelect.value;
  if(v === 'sequence'){ totalSeconds = seqTotalSeconds(); return; }
  if(v === 'custom'){
    let m = Math.round(Number(customLenInput.value));
    if(!m || m < 1) m = 1;
    if(m > 240) m = 240;
    totalSeconds = m*60;
  } else {
    totalSeconds = Number(v)*60;
  }
}
function renderIdle(){
  phaseTotal = totalSeconds;
  render(totalSeconds);
  if(isSeq()) renderSeqIdle();
}
function renderSession(elapsed){
  if(isSeq()){
    renderSeq(elapsed);
  } else {
    render(phaseTotal - elapsed);
  }
}
// Re-read the chosen length and show it (only while the timer is idle).
export function setDuration(){
  readLength();
  phasePausedElapsed = 0;
  resetIntervals();
  renderIdle();
  phaseLabel.textContent = 'Ready';
}
function setLengthLocked(b){ durationSelect.disabled = b; customLenInput.disabled = b; seqEditor.disabled = b; }

function stopTick(){
  if(tickHandle){ clearInterval(tickHandle); tickHandle = null; }
}

function tick(){
  const elapsed = (Date.now() - phaseStartTimestamp)/1000;
  const remaining = phaseTotal - elapsed;
  if(remaining <= 0){
    if(phase === 'prep'){ beginSession(); return; }
    render(0);
    finish();
    return;
  }
  if(phase === 'prep'){ render(remaining); }
  else {
    render(remaining);
    if(isSeq()){
      renderSeq(elapsed);
      const idx = segIndexAt(elapsed);
      if(idx > seq.lastSeg){
        seq.lastSeg = idx;
        playBell('segment');
        announce(spokenSeg(idx));
      }
    }
    checkIntervals(elapsed, totalSeconds);
  }
}

function beginSession(){
  phase = 'session';
  phaseTotal = totalSeconds;
  phasePausedElapsed = 0;
  phaseStartTimestamp = Date.now();
  resetIntervals();
  seq.lastSeg = 0;
  playBell('start');
  phaseLabel.textContent = sessionLabel(0);
  announce(isSeq() ? 'Session started. ' + spokenSeg(0) : 'Session started');
  renderSession(0);
}

function play(){
  pauseOthers('main');
  ensureAudio();
  acquireWake();
  if(phase === 'idle') readLength();
  setLengthLocked(true);
  playBtn.innerHTML = '&#10074;&#10074;';
  playBtn.setAttribute('aria-label','Pause');
  isRunning = true;

  if(phase === 'idle'){
    if(settings.prepSeconds > 0){
      phase = 'prep';
      phaseTotal = settings.prepSeconds;
      phaseLabel.textContent = 'Starting in';
      announce('Starting in ' + settings.prepSeconds + ' seconds');
    } else {
      phase = 'session';
      phaseTotal = totalSeconds;
      resetIntervals();
      seq.lastSeg = 0;
      playBell('start');
      phaseLabel.textContent = sessionLabel(0);
      announce(isSeq() ? 'Session started. ' + spokenSeg(0) : 'Session started');
      renderSession(0);
    }
    phaseStartTimestamp = Date.now();
  } else {
    // resuming from pause, mid-prep or mid-session
    phaseStartTimestamp = Date.now() - phasePausedElapsed*1000;
    phaseLabel.textContent = phase === 'prep' ? 'Starting in' : sessionLabel(phasePausedElapsed);
    announce('Resumed');
  }
  tickHandle = setInterval(tick, 200);
}

function pause(){
  releaseWake();
  isRunning = false;
  phasePausedElapsed = (Date.now() - phaseStartTimestamp)/1000;
  stopTick();
  playBtn.innerHTML = '&#9654;';
  playBtn.setAttribute('aria-label','Resume');
  phaseLabel.textContent = 'Paused';
  announce('Paused');
}

function finish(){
  releaseWake();
  isRunning = false;
  stopTick();
  playBell('end');
  playBtn.innerHTML = '&#9654;';
  playBtn.setAttribute('aria-label','Start');
  phaseLabel.textContent = 'Complete';
  announce('Session complete');
  recordSession(isSeq() ? 'seq' : 'timer', totalSeconds);
  phase = 'idle';
  phaseTotal = totalSeconds;
  phasePausedElapsed = 0;
  setLengthLocked(false);
  if(isSeq()) renderSeqIdle();
}

export function reset(){
  // Ending a session early still counts for the time actually sat (history ignores anything under a minute).
  if(phase === 'session'){
    const elapsed = isRunning ? (Date.now() - phaseStartTimestamp)/1000 : phasePausedElapsed;
    recordSession(isSeq() ? 'seq' : 'timer', Math.min(elapsed, totalSeconds));
  }
  releaseWake();
  stopBells();
  isRunning = false;
  stopTick();
  phase = 'idle';
  phasePausedElapsed = 0;
  resetIntervals();
  seq.lastSeg = 0;
  readLength();
  renderIdle();
  playBtn.innerHTML = '&#9654;';
  playBtn.setAttribute('aria-label','Start');
  phaseLabel.textContent = 'Ready';
  announce('Timer reset');
  setLengthLocked(false);
}

// Space bar and the play button both use this.
export function toggle(){ isRunning ? pause() : play(); }

// Show or hide the custom-length box and the sit + walk editor to match the chosen length.
export function syncLengthUI(){
  customLenRow.hidden = durationSelect.value !== 'custom';
  seqEditor.hidden = !isSeq();
  segStatus.hidden = !isSeq();
}

registerActivity('main', { isRunning: ()=> isRunning, pause: ()=>{ if(isRunning) pause(); } });

playBtn.addEventListener('click', toggle);
resetBtn.addEventListener('click', reset);
durationSelect.addEventListener('change', ()=>{ syncLengthUI(); if(phase==='idle') setDuration(); });
['input','change'].forEach(t=> customLenInput.addEventListener(t, ()=>{ if(phase==='idle' && durationSelect.value==='custom') setDuration(); }));

render(totalSeconds);
