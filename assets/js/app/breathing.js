// Breathing pacer tab.
import { $ } from './dom.js';
import { settings } from './state.js';
import { playBreathCue, ensureAudio } from './audio.js';
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

// The circle is drawn at full size and shrunk with a CSS scale. Resting (small) size is MIN_SCALE;
// keep it in step with the starting transform in styles.css (.breath-circle).
const MIN_SCALE = 0.64;
// Slide the circle to a size over a number of seconds. The CSS transition does the smooth part.
function moveCircle(scale, seconds){
  breathCircle.style.transitionDuration = seconds + 's';
  breathCircle.style.transform = 'scale(' + scale + ')';
}

function breathStep(){
  const steps = PATTERNS[patternSelect.value];
  const totalCycles = Number(cyclesSelect.value);
  if(breathStepIdx >= steps.length){ breathStepIdx = 0; breathCycle++; }
  if(breathCycle > totalCycles){ stopBreathing(); breathLabel.textContent='Complete'; playBreathCue('done'); return; }
  const [name, secs] = steps[breathStepIdx];
  breathLabel.textContent = name;
  breathCycleCount.textContent = 'Cycle ' + breathCycle + ' of ' + totalCycles;
  // Inhale grows for the whole step and reaches full size exactly as it ends; exhale shrinks the same way.
  // Hold keeps whatever size the circle already has.
  if(name === 'Inhale') moveCircle(1, secs);
  else if(name === 'Exhale') moveCircle(MIN_SCALE, secs);
  playBreathCue(name.toLowerCase());
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
  moveCircle(MIN_SCALE, 0.6);   // settle back to the resting size
}

registerActivity('breathing', { isRunning: ()=> breathRunning, pause: stopBreathing });

breathPlayBtn.addEventListener('click', ()=>{ breathRunning ? stopBreathing() : startBreathing(); });
$('breathSoundSelect').addEventListener('change', e=>{ settings.breathSound = e.target.value === 'on'; });
patternSelect.addEventListener('change', ()=>{ if(!breathRunning){ breathStepIdx=0; breathCycle=1; } });
