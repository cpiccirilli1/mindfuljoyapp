// Remembers settings on this device only (localStorage), and restores them when the page opens.
// Loaded last on purpose: restoring a value "changes" each control, and every other file
// must already be listening for those changes.
import { $ } from './dom.js';
import { settings, store } from './state.js';
import { seq, cleanSegments } from './sequence.js';
import { getCustomTimes, setCustomTimes, setMode } from './intervals.js';
import { syncLengthUI, setDuration, isIdle } from './timer.js';
import { renderSegments } from './sequence-editor.js';

const STORE_KEY = 'still.settings.v1';

function saveSettings(){
  if(!store.ready) return;
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify({
      scheme: $('schemeSelect').value, duration: $('durationSelect').value, customLen: $('customLenInput').value,
      bell: $('bellSelect').value, volume: $('volumeRange').value,
      startEnabled: $('startEnabled').checked, startCount: $('startCount').value,
      endEnabled: $('endEnabled').checked, endCount: $('endCount').value, vibrate: $('vibrateEnabled').checked,
      prep: $('prepSelect').value,
      intervalEnabled: $('intervalEnabled').checked, mode: settings.mode,
      intervalEvery: $('intervalEvery').value, customTimes: getCustomTimes(),
      pattern: $('patternSelect').value, cycles: $('cyclesSelect').value, breathSound: $('breathSoundSelect').value,
      segEnabled: $('segEnabled').checked, segCount: $('segCount').value, segments: seq.segments,
      pomoFocus: $('pomoFocus').value, pomoShort: $('pomoShort').value, pomoLong: $('pomoLong').value,
      pomoRounds: $('pomoRounds').value, pomoAuto: $('pomoAuto').checked,
      cuChime: $('cuChime').value
    }));
  }catch(e){}
}

// Put a saved value back into a control and tell the rest of the page it changed.
function setVal(id, v){
  const e = $(id);
  if(!e || v === undefined || v === null) return;
  if(e.type === 'checkbox'){ e.checked = !!v; }
  else {
    if(e.tagName === 'SELECT' && ![].some.call(e.options, o=> String(o.value) === String(v))) return;
    e.value = v;
  }
  if(e.type === 'range') e.dispatchEvent(new Event('input', {bubbles:true}));
  e.dispatchEvent(new Event('change', {bubbles:true}));
}
function loadSettings(){
  let d = null;
  try{ d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); }catch(e){ d = null; }
  if(d && typeof d === 'object'){
    setVal('schemeSelect', d.scheme);
    setVal('customLenInput', d.customLen);
    setVal('durationSelect', d.duration);
    setVal('bellSelect', d.bell);
    setVal('volumeRange', d.volume);
    setVal('startEnabled', d.startEnabled); setVal('startCount', d.startCount);
    setVal('endEnabled', d.endEnabled); setVal('endCount', d.endCount); setVal('vibrateEnabled', d.vibrate);
    setVal('prepSelect', d.prep);
    if(Array.isArray(d.customTimes)){
      setCustomTimes(d.customTimes.map(Number).filter(n=> n>=1 && n<=59));
    }
    if(d.mode === 'regular' || d.mode === 'custom') setMode(d.mode);
    setVal('intervalEvery', d.intervalEvery);
    setVal('intervalEnabled', d.intervalEnabled);
    setVal('patternSelect', d.pattern); setVal('cyclesSelect', d.cycles); setVal('breathSoundSelect', d.breathSound);
    setVal('segEnabled', d.segEnabled); setVal('segCount', d.segCount);
    setVal('pomoFocus', d.pomoFocus); setVal('pomoShort', d.pomoShort); setVal('pomoLong', d.pomoLong);
    setVal('pomoRounds', d.pomoRounds); setVal('pomoAuto', d.pomoAuto); setVal('cuChime', d.cuChime);
    const saved = cleanSegments(d.segments);
    if(saved){ seq.segments = saved; renderSegments(); }
  }
  syncLengthUI();
  if(isIdle()) setDuration();
  store.ready = true;
}
loadSettings();
['change','input','click'].forEach(t=> document.addEventListener(t, ()=>{ setTimeout(saveSettings, 0); }));
