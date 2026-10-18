// Pomodoro timer (More menu): focus rounds with short breaks and a long break at the end.
import { $ } from './dom.js';
import { fmt, announce, initRing, setRing } from './display.js';
import { ensureAudio, stopBells, playBell } from './audio.js';
import { acquireWake, releaseWake } from './wake.js';
import { registerActivity, pauseOthers, maybeRelease, updateLive } from './activity.js';

const pEl = { time: $('pomoTime'), phase: $('pomoPhase'), round: $('pomoRound'),
  ring: $('pomoRing'), play: $('pomoPlay'), reset: $('pomoReset'), skip: $('pomoSkip'),
  focus: $('pomoFocus'), short: $('pomoShort'), long: $('pomoLong'),
  rounds: $('pomoRounds'), auto: $('pomoAuto') };
initRing(pEl.ring);
let pPlan = [], pIdx = 0, pRunning = false, pStart = 0, pPaused = 0, pHandle = null, pStarted = false;

// The cycle as a list of steps: focus, break, focus, break, ... with the last break long.
function buildPlan(){
  const f = +pEl.focus.value * 60, sb = +pEl.short.value * 60, lb = +pEl.long.value * 60, n = +pEl.rounds.value;
  const plan = [];
  for(let i=0;i<n;i++){
    plan.push({ kind:'focus', secs:f, round:i+1 });
    plan.push(i === n-1 ? { kind:'long', secs:lb, round:i+1 } : { kind:'short', secs:sb, round:i+1 });
  }
  return plan;
}
const P_NAME = { focus:'Focus', short:'Short break', long:'Long break' };
function pRender(remaining){
  const cur = pPlan[pIdx];
  pEl.time.textContent = fmt(remaining);
  setRing(pEl.ring, cur.secs ? Math.max(0, Math.min(1, remaining / cur.secs)) : 0);
  pEl.phase.textContent = !pRunning && pStarted && pPaused > 0 ? 'Paused' : P_NAME[cur.kind];
  pEl.round.textContent = 'Round ' + cur.round + ' of ' + pPlan.filter(x=>x.kind==='focus').length;
}
// Lengths can't be changed once a cycle has started.
function pLock(){
  const lock = pStarted;
  [pEl.focus, pEl.short, pEl.long, pEl.rounds].forEach(e=>{ e.disabled = lock; });
  updateLive();
}
function pSetButtons(){
  pEl.play.innerHTML = pRunning ? '&#10074;&#10074;' : '&#9654;';
  pEl.play.setAttribute('aria-label', pRunning ? 'Pause Pomodoro' : (pStarted ? 'Resume Pomodoro' : 'Start Pomodoro'));
  pEl.skip.disabled = !pStarted;
  pLock();
}
function pIdle(){
  pPlan = buildPlan(); pIdx = 0; pPaused = 0; pStarted = false; pRunning = false;
  clearInterval(pHandle); pHandle = null;
  pRender(pPlan[0].secs); pSetButtons();
}
function pTick(){
  const el = (Date.now() - pStart) / 1000, cur = pPlan[pIdx], rem = cur.secs - el;
  if(rem <= 0){ pAdvance(true); return; }
  pRender(rem);
}
function pSpeak(){ const c = pPlan[pIdx]; announce(P_NAME[c.kind] + ', round ' + c.round + ', ' + Math.round(c.secs/60) + ' minutes'); }
// Move to the next phase. fromTimer: phase ended naturally (ring a bell); otherwise it was skipped.
function pAdvance(fromTimer){
  if(pIdx >= pPlan.length - 1){
    // finished the whole cycle
    clearInterval(pHandle); pHandle = null; releaseWake();
    if(fromTimer) playBell('end');
    announce('Pomodoro cycle complete');
    pIdle(); pEl.phase.textContent = 'Complete';
    return;
  }
  if(fromTimer) playBell('segment');
  pIdx++; pPaused = 0;
  const keepGoing = pRunning && (pEl.auto.checked || !fromTimer);
  if(keepGoing){ pStart = Date.now(); pSpeak(); pRender(pPlan[pIdx].secs); }
  else {
    pRunning = false; clearInterval(pHandle); pHandle = null; releaseWake();
    pPaused = 0; pRender(pPlan[pIdx].secs); pSpeak();
  }
  pSetButtons();
}
function pPlay(){
  pauseOthers('pomodoro');
  ensureAudio(); acquireWake();
  if(!pStarted){ pStarted = true; playBell('start'); pPaused = 0; }
  pRunning = true; pStart = Date.now() - pPaused * 1000;
  clearInterval(pHandle); pHandle = setInterval(pTick, 200);
  announce(pPaused > 0 ? 'Resumed' : 'Pomodoro started. ' + P_NAME[pPlan[pIdx].kind]);
  pSetButtons(); pTick();
}
function pPause(){
  if(!pRunning) return;
  pRunning = false; pPaused = (Date.now() - pStart) / 1000;
  clearInterval(pHandle); pHandle = null;
  maybeRelease();
  announce('Paused'); pRender(pPlan[pIdx].secs - pPaused); pSetButtons();
}
export function pReset(){ stopBells(); maybeRelease(); pIdle(); announce('Pomodoro reset'); }
export function pToggle(){ pRunning ? pPause() : pPlay(); }

registerActivity('pomodoro', { isRunning: ()=> pRunning, pause: pPause, more: true });

pEl.play.addEventListener('click', pToggle);
pEl.reset.addEventListener('click', pReset);
pEl.skip.addEventListener('click', ()=>{ if(pStarted) pAdvance(false); });
[pEl.focus, pEl.short, pEl.long, pEl.rounds].forEach(e=> e.addEventListener('change', ()=>{ if(!pStarted) pIdle(); }));
pIdle();
