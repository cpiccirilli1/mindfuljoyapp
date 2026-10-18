// Breathing pacer tab.
import { $ } from './dom.js';
import { chime, ensureAudio } from './audio.js';
import { acquireWake } from './wake.js';
import { registerActivity, maybeRelease } from './activity.js';

const PATTERNS = {
  box:      [['Inhale',4],['Hold',4],['Exhale',4],['Hold',4]],
  '478':    [['Inhale',4],['Hold',7],['Exhale',8]],
  coherent: [['Inhale',5],['Exhale',5]]
};
const breathCircle = $('breathCircle');
const breathLabel = $('breathLabel');
const breathCycleCount = $('breathCycleCount');
const breathPlayBtn = $('breathPlayBtn');
const patternSelect = $('patternSelect');
const cyclesSelect = $('cyclesSelect');
let breathTimer = null, breathRunning = false, breathStepIdx = 0, breathCycle = 1;

function setCircleSize(phaseName){
  breathCircle.style.width = (phaseName==='Inhale' || phaseName==='Hold') ? '72%' : '46%';
  breathCircle.style.height = (phaseName==='Inhale' || phaseName==='Hold') ? '72%' : '46%';
}
function softChime(){ chime('interval'); }

function breathStep(){
  const steps = PATTERNS[patternSelect.value];
  const totalCycles = Number(cyclesSelect.value);
  if(breathStepIdx >= steps.length){ breathStepIdx = 0; breathCycle++; }
  if(breathCycle > totalCycles){ stopBreathing(); breathLabel.textContent='Complete'; breathCircle.style.width='46%'; breathCircle.style.height='46%'; chime('end'); return; }
  const [name, secs] = steps[breathStepIdx];
  breathLabel.textContent = name;
  breathCycleCount.textContent = 'Cycle ' + breathCycle + ' of ' + totalCycles;
  setCircleSize(name);
  softChime();
  breathStepIdx++;
  breathTimer = setTimeout(breathStep, secs*1000);
}
function startBreathing(){
  ensureAudio();
  acquireWake();
  breathRunning = true; breathStepIdx = 0; breathCycle = 1;
  patternSelect.disabled = true; cyclesSelect.disabled = true;
  breathPlayBtn.innerHTML = '&#10074;&#10074;';
  breathStep();
}
export function stopBreathing(){
  breathRunning = false;   // first, so the screen can be released below
  maybeRelease();
  if(breathTimer){ clearTimeout(breathTimer); breathTimer = null; }
  patternSelect.disabled = false; cyclesSelect.disabled = false;
  breathPlayBtn.innerHTML = '&#9654;';
  breathLabel.textContent = 'Ready';
  breathCycleCount.textContent = '';
  breathCircle.style.width = '46%'; breathCircle.style.height = '46%';
}

registerActivity('breathing', { isRunning: ()=> breathRunning, pause: stopBreathing });

breathPlayBtn.addEventListener('click', ()=>{ breathRunning ? stopBreathing() : startBreathing(); });
patternSelect.addEventListener('change', ()=>{ if(!breathRunning){ breathStepIdx=0; breathCycle=1; } });
