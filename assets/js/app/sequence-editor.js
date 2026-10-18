// Sit + walk editor: the rows, presets, and layouts saved on this device.
import { $ } from './dom.js';
import { announce } from './display.js';
import { seq, isSeq, cleanSegments, seqTotalSeconds, seqSummary, MAX_SEGMENTS, MAX_SEG_MIN } from './sequence.js';
import { setDuration, isIdle } from './timer.js';

const segList = $('segList');
const seqTotal = $('seqTotal');
const seqMsg = $('seqMsg');
const LAYOUT_KEY = 'still.layouts.v1';

// Show a message under the editor and read it out to screen readers.
function say(msg){ seqMsg.textContent = msg; announce(msg); }

// The list changed shape: redraw it, and update the timer if it is idle.
function segmentsChanged(){
  renderSegments();
  if(isIdle() && isSeq()) setDuration();
}
export function renderSegments(){
  const segments = seq.segments;
  segList.innerHTML = '';
  segments.forEach((sg, i)=>{
    const li = document.createElement('li');
    li.className = 'seg-row';
    li.dataset.i = i;
    const num = document.createElement('span');
    num.className = 'seg-num'; num.textContent = i + 1;
    const type = document.createElement('select');
    type.className = 'seg-type'; type.setAttribute('aria-label', 'Segment ' + (i+1) + ' type');
    [['sit','Sit'],['walk','Walk']].forEach(([v,t])=>{
      const o = document.createElement('option'); o.value = v; o.textContent = t;
      if(sg.type === v) o.selected = true;
      type.appendChild(o);
    });
    const mins = document.createElement('input');
    mins.type = 'number'; mins.className = 'num-input seg-min'; mins.min = 1; mins.max = MAX_SEG_MIN;
    mins.value = sg.minutes; mins.inputMode = 'numeric';
    mins.setAttribute('aria-label', 'Segment ' + (i+1) + ' minutes');
    const unit = document.createElement('span');
    unit.className = 'seg-unit'; unit.textContent = 'min';
    const mk = (cls, label, tip, html, disabled)=>{
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-btn ' + cls; b.setAttribute('aria-label', label + ' segment ' + (i+1));
      b.title = tip;  // short hover tooltip
      b.innerHTML = html; b.disabled = !!disabled;
      return b;
    };
    li.append(num, type, mins, unit,
      mk('seg-up', 'Move up', 'Move up', '&#9650;', i === 0),
      mk('seg-down', 'Move down', 'Move down', '&#9660;', i === segments.length-1),
      mk('seg-remove', 'Remove', 'Delete', '&times;', segments.length === 1));
    segList.appendChild(li);
  });
  seqTotal.textContent = Math.round(seqTotalSeconds()/60) + ' min total';
  $('addSitBtn').disabled = $('addWalkBtn').disabled = segments.length >= MAX_SEGMENTS;
}
// Typing or choosing a value updates the data in place. The list is only
// redrawn for structural changes (move, add, remove, preset, load), so the
// field you are in never gets replaced while you use it.
function segValuesChanged(){
  seqTotal.textContent = Math.round(seqTotalSeconds()/60) + ' min total';
  if(isIdle() && isSeq()) setDuration();
}
segList.addEventListener('change', e=>{
  const li = e.target.closest('.seg-row'); if(!li) return;
  const sg = seq.segments[Number(li.dataset.i)];
  if(e.target.classList.contains('seg-type')) sg.type = e.target.value === 'walk' ? 'walk' : 'sit';
  if(e.target.classList.contains('seg-min')){
    sg.minutes = Math.min(MAX_SEG_MIN, Math.max(1, Math.round(Number(e.target.value)) || 1));
    e.target.value = sg.minutes;
  }
  segValuesChanged();
});
segList.addEventListener('input', e=>{
  if(!e.target.classList.contains('seg-min')) return;
  const v = Math.round(Number(e.target.value));
  if(v >= 1 && v <= MAX_SEG_MIN){
    seq.segments[Number(e.target.closest('.seg-row').dataset.i)].minutes = v;
    segValuesChanged();
  }
});
segList.addEventListener('click', e=>{
  const segments = seq.segments;
  const b = e.target.closest('.seg-btn'); if(!b) return;
  const i = Number(b.closest('.seg-row').dataset.i);
  if(b.classList.contains('seg-remove') && segments.length > 1) segments.splice(i, 1);
  else if(b.classList.contains('seg-up') && i > 0) [segments[i-1], segments[i]] = [segments[i], segments[i-1]];
  else if(b.classList.contains('seg-down') && i < segments.length-1) [segments[i+1], segments[i]] = [segments[i], segments[i+1]];
  else return;
  segmentsChanged();
  // keep keyboard focus on the same kind of control after the list re-renders
  const row = segList.children[b.classList.contains('seg-remove') ? Math.min(i, segments.length-1) : (b.classList.contains('seg-up') ? i-1 : i+1)];
  const again = row && row.querySelector(b.classList.contains('seg-remove') ? '.seg-remove' : b.classList.contains('seg-up') ? '.seg-up' : '.seg-down');
  if(again && !again.disabled) again.focus(); else if(row) row.querySelector('.seg-type').focus();
});
function addSeg(type){
  if(seq.segments.length >= MAX_SEGMENTS) return;
  seq.segments.push({type, minutes: type === 'walk' ? 10 : 20});
  segmentsChanged();
}
$('addSitBtn').addEventListener('click', ()=>addSeg('sit'));
$('addWalkBtn').addEventListener('click', ()=>addSeg('walk'));

const PRESETS = {
  'sit-walk-sit': [['sit',20],['walk',10],['sit',20]],
  'sit-walk': [['sit',20],['walk',10]],
  'walk-sit': [['walk',10],['sit',20]],
  'rounds': [['sit',10],['walk',5],['sit',10],['walk',5]]
};
const presetSelect = $('presetSelect');
presetSelect.addEventListener('change', ()=>{
  const p = PRESETS[presetSelect.value];
  if(!p) return;
  seq.segments = p.map(([type,minutes])=>({type, minutes}));
  presetSelect.value = '';
  segmentsChanged();
  say('Preset applied: ' + seqSummary());
});

// ----- Saved sequences (on this device only) -----
const layoutName = $('layoutName');
const layoutSelect = $('layoutSelect');
const savedBlock = $('savedBlock');
function readLayouts(){
  try{
    const d = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '[]');
    return Array.isArray(d) ? d.filter(x=> x && typeof x.name === 'string' && cleanSegments(x.segments)) : [];
  }catch(e){ return []; }
}
function writeLayouts(list){
  try{ localStorage.setItem(LAYOUT_KEY, JSON.stringify(list)); return true; }catch(e){ return false; }
}
function renderLayouts(selectName){
  const list = readLayouts();
  layoutSelect.innerHTML = '';
  list.forEach(l=>{
    const o = document.createElement('option'); o.value = l.name; o.textContent = l.name;
    if(l.name === selectName) o.selected = true;
    layoutSelect.appendChild(o);
  });
  savedBlock.hidden = list.length === 0;
}
$('saveLayoutBtn').addEventListener('click', ()=>{
  const name = layoutName.value.trim().slice(0, 30);
  if(!name){ say('Type a name first.'); layoutName.focus(); return; }
  const list = readLayouts().filter(l=> l.name !== name);
  list.push({ name, segments: seq.segments.map(sg=>({type:sg.type, minutes:sg.minutes})) });
  if(list.length > 20) list.shift();
  if(!writeLayouts(list)){ say('Could not save on this device.'); return; }
  layoutName.value = '';
  renderLayouts(name);
  say('Saved "' + name + '".');
});
$('loadLayoutBtn').addEventListener('click', ()=>{
  const l = readLayouts().find(x=> x.name === layoutSelect.value);
  if(!l) return;
  seq.segments = cleanSegments(l.segments);
  segmentsChanged();
  say('Loaded "' + l.name + '": ' + seqSummary());
});
$('deleteLayoutBtn').addEventListener('click', ()=>{
  const name = layoutSelect.value; if(!name) return;
  writeLayouts(readLayouts().filter(x=> x.name !== name));
  renderLayouts();
  say('Deleted "' + name + '".');
});
renderSegments();
renderLayouts();
