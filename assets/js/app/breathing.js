// Breathing pacer tab.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Breathing pacer ----------
const PATTERNS = {
  box:      [['Inhale',4],['Hold',4],['Exhale',4],['Hold',4]],
  '478':    [['Inhale',4],['Hold',7],['Exhale',8]],
  coherent: [['Inhale',5],['Exhale',5]]
};
const breathCircle = document.getElementById('breathCircle');
const breathLabel = document.getElementById('breathLabel');
const breathCycleCount = document.getElementById('breathCycleCount');
const breathPlayBtn = document.getElementById('breathPlayBtn');
const patternSelect = document.getElementById('patternSelect');
const cyclesSelect = document.getElementById('cyclesSelect');
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
function stopBreathing(){
  maybeRelease();
  breathRunning = false;
  if(breathTimer){ clearTimeout(breathTimer); breathTimer = null; }
  patternSelect.disabled = false; cyclesSelect.disabled = false;
  breathPlayBtn.innerHTML = '&#9654;';
  breathLabel.textContent = 'Ready';
  breathCycleCount.textContent = '';
  breathCircle.style.width = '46%'; breathCircle.style.height = '46%';
}
breathPlayBtn.addEventListener('click', ()=>{ breathRunning ? stopBreathing() : startBreathing(); });
patternSelect.addEventListener('change', ()=>{ if(!breathRunning){ breathStepIdx=0; breathCycle=1; } });
