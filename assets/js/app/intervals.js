// Interval bells: when they ring (regular or custom times) and the controls for them.
import { $ } from './dom.js';
import { settings } from './state.js';
import { playBell } from './audio.js';
import { announce } from './display.js';

// "Ring every N minutes" menu
const intervalEvery = $('intervalEvery');
for(let m=1; m<=30; m++){
  const opt = document.createElement('option');
  opt.value = m; opt.textContent = m + (m===1?' minute':' minutes');
  if(m===5) opt.selected = true;
  intervalEvery.appendChild(opt);
}

let customTimes = [];          // minutes, for "custom times" mode
const triggered = new Set();   // interval bells already rung in this session

// Forget which bells have rung (a new session started, or the schedule changed).
export function resetIntervals(){ triggered.clear(); }

export function getCustomTimes(){ return customTimes; }
export function setCustomTimes(list){ customTimes = list; renderChips(); }

// Seconds into the session at which an interval bell should ring.
function triggerPoints(totalSeconds){
  const pts = [];
  if(!settings.intervalEnabled) return pts;
  if(settings.mode === 'regular'){
    const step = Number(intervalEvery.value) * 60;
    for(let t=step; t<totalSeconds; t+=step) pts.push(t);
  } else {
    customTimes.forEach(m=>{
      const t = m*60;
      if(t>0 && t<totalSeconds) pts.push(t);
    });
  }
  return pts.sort((a,b)=>a-b);
}

// Called on every tick of a running session: ring any bell whose time has come.
export function checkIntervals(elapsed, totalSeconds){
  triggerPoints(totalSeconds).forEach(pt=>{
    if(!triggered.has(pt) && elapsed >= pt){
      triggered.add(pt);
      playBell('interval');
      announce('Interval bell');
    }
  });
}

// ----- Controls in Bell Settings -----
intervalEvery.addEventListener('change', resetIntervals);

const intervalBody = $('intervalBody');
$('intervalEnabled').addEventListener('change', e=>{
  settings.intervalEnabled = e.target.checked;
  intervalBody.classList.toggle('sub-disabled', !e.target.checked);
  resetIntervals();
});

const modeRegularBtn = $('modeRegularBtn');
const modeCustomBtn = $('modeCustomBtn');
const regularFields = $('regularFields');
const customFields = $('customFields');
export function setMode(mode){
  settings.mode = mode;
  modeRegularBtn.classList.toggle('active', mode==='regular');
  modeCustomBtn.classList.toggle('active', mode==='custom');
  regularFields.style.display = mode==='regular' ? '' : 'none';
  customFields.style.display = mode==='custom' ? '' : 'none';
  resetIntervals();
}
modeRegularBtn.addEventListener('click', ()=>setMode('regular'));
modeCustomBtn.addEventListener('click', ()=>setMode('custom'));

const customChips = $('customChips');
const customMinuteInput = $('customMinuteInput');
function renderChips(){
  customChips.innerHTML = '';
  if(customTimes.length===0){
    const p = document.createElement('div');
    p.className = 'empty-note';
    p.textContent = 'No custom times added yet.';
    customChips.appendChild(p);
    return;
  }
  customTimes.slice().sort((a,b)=>a-b).forEach(m=>{
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = '<span>' + m + ' min</span>';
    const rm = document.createElement('button');
    rm.textContent = '×';
    rm.setAttribute('aria-label','Remove ' + m + ' minute bell');
    rm.addEventListener('click', ()=>{
      customTimes = customTimes.filter(x=>x!==m);
      renderChips();
      resetIntervals();
    });
    chip.appendChild(rm);
    customChips.appendChild(chip);
  });
}
$('addCustomBtn').addEventListener('click', ()=>{
  const v = Math.round(Number(customMinuteInput.value));
  if(!v || v<1 || v>59) return;
  if(!customTimes.includes(v)) customTimes.push(v);
  customMinuteInput.value = '';
  renderChips();
  resetIntervals();
});
renderChips();
