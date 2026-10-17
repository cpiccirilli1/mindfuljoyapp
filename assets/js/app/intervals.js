// Interval bells: when they ring (regular or custom times) and the controls for them.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Interval schedule ----------
function triggerPoints(){
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

const intervalBody = document.getElementById('intervalBody');
document.getElementById('intervalEnabled').addEventListener('change', e=>{
  settings.intervalEnabled = e.target.checked;
  intervalBody.classList.toggle('sub-disabled', !e.target.checked);
  triggered.clear();
});

const modeRegularBtn = document.getElementById('modeRegularBtn');
const modeCustomBtn = document.getElementById('modeCustomBtn');
const regularFields = document.getElementById('regularFields');
const customFields = document.getElementById('customFields');
function setMode(mode){
  settings.mode = mode;
  modeRegularBtn.classList.toggle('active', mode==='regular');
  modeCustomBtn.classList.toggle('active', mode==='custom');
  regularFields.style.display = mode==='regular' ? '' : 'none';
  customFields.style.display = mode==='custom' ? '' : 'none';
  triggered.clear();
}
modeRegularBtn.addEventListener('click', ()=>setMode('regular'));
modeCustomBtn.addEventListener('click', ()=>setMode('custom'));

const customChips = document.getElementById('customChips');
const customMinuteInput = document.getElementById('customMinuteInput');
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
    rm.textContent = '\u00d7';
    rm.setAttribute('aria-label','Remove ' + m + ' minute bell');
    rm.addEventListener('click', ()=>{
      customTimes = customTimes.filter(x=>x!==m);
      renderChips();
      triggered.clear();
    });
    chip.appendChild(rm);
    customChips.appendChild(chip);
  });
}
document.getElementById('addCustomBtn').addEventListener('click', ()=>{
  const v = Math.round(Number(customMinuteInput.value));
  if(!v || v<1 || v>59) return;
  if(!customTimes.includes(v)) customTimes.push(v);
  customMinuteInput.value = '';
  renderChips();
  triggered.clear();
});
renderChips();
