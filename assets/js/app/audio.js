// Bell sounds (Web Audio), the synthesized fallback chime, and vibration.
import { settings } from './state.js';

let audioCtx = null;
export function ensureAudio(){
  if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
  if(audioCtx.state === 'suspended'){ audioCtx.resume(); }
}
// Browsers pause audio in hidden tabs; wake it up when the tab returns.
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible' && audioCtx && audioCtx.state === 'suspended'){ audioCtx.resume(); }
});

// Real bell recordings (CC0), loaded from assets/audio/. See assets/audio/CREDITS.txt.
const SOUND_FILES = { bowl:'assets/audio/bowl.mp3', burma:'assets/audio/burma.mp3', singing:'assets/audio/singing.mp3', gong:'assets/audio/gong.mp3', interval:'assets/audio/interval.mp3' };
export const BELL_OPTIONS = [
  { id:'bowl',    name:'Singing Bowl' },
  { id:'burma',   name:'Burmese Bell' },
  { id:'singing', name:'Singing Bell' },
  { id:'gong',    name:'Zen Gong' }
];
const BELL_GAP = 4;          // seconds between strikes when several bells are set
const INTERVAL_GAIN = 0.8;
const buffers = {};          // id -> Promise<AudioBuffer|null>
let activeSources = [];

function ensureCtx(){
  if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
  return audioCtx;
}
function decodeBuf(ctx, arr){
  return new Promise((res, rej)=>{
    const p = ctx.decodeAudioData(arr, res, rej);
    if(p && p.catch) p.catch(rej);
  });
}
function loadSounds(){
  try{ ensureCtx(); }catch(e){ return; }
  Object.keys(SOUND_FILES).forEach(id=>{
    if(buffers[id]) return;
    buffers[id] = fetch(SOUND_FILES[id])
      .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(ab=>decodeBuf(audioCtx, ab))
      .catch(()=>null);
  });
}

// Synthesized fallback, only used if a recording fails to decode.
function synthChime(freq, dur){
  ensureAudio();
  const ctx = audioCtx, now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.connect(ctx.destination);
  [1, 2.01, 2.76, 4.18].forEach((mult,i)=>{
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = freq * mult;
    const g = ctx.createGain(); g.gain.value = [1,0.46,0.26,0.12][i];
    osc.connect(g).connect(master);
    osc.start(now); osc.stop(now + dur + 0.4);
  });
  master.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}

export function playSound(id, count, gain){
  ensureAudio();
  const ctx = audioCtx;
  const p = buffers[id] || Promise.resolve(null);
  p.then(buf=>{
    if(!buf){ synthChime(id==='interval' ? 880 : 392, 3); return; }
    const t0 = ctx.currentTime + 0.03;
    for(let i=0;i<count;i++){
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain(); g.gain.value = gain * settings.volume;
      src.connect(g).connect(ctx.destination);
      src.start(t0 + i*BELL_GAP);
      activeSources.push(src);
      src.onended = ()=>{ activeSources = activeSources.filter(x=>x!==src); };
    }
  });
}
export function stopBells(){
  activeSources.forEach(s=>{ try{ s.stop(); }catch(e){} });
  activeSources = [];
}

// kind: 'start' | 'end' | 'segment' use the chosen bell (count strikes); 'interval' is always the fixed higher bell.
export function chime(kind, count){
  if(kind === 'interval') playSound('interval', 1, INTERVAL_GAIN);
  else playSound(settings.bellSound, count || 1, 0.9);
}

// Vibration (phones and tablets whose browser supports it; most iPhones do not). Off unless switched on in Bell Settings.
export const VIBRATE_OK = typeof navigator.vibrate === 'function';
const VIBRATE_PATTERNS = { start:[200], end:[300,150,300,150,300] };
function vibrate(kind){
  if(!settings.vibrate || !VIBRATE_OK) return;
  try{ navigator.vibrate(VIBRATE_PATTERNS[kind]); }catch(e){}
}

// Ring (and/or vibrate for) a bell, respecting the Bell Settings switches.
export function playBell(kind){
  if(kind==='start' || kind==='end') vibrate(kind);   // independent of whether the bell sound itself is on
  if(kind==='start' && !settings.startEnabled) return;
  if(kind==='end' && !settings.endEnabled) return;
  if(kind==='interval' && !settings.intervalEnabled) return;
  if(kind==='segment' && !settings.segEnabled) return;
  chime(kind, kind==='start' ? settings.startCount : kind==='end' ? settings.endCount : kind==='segment' ? settings.segCount : 1);
}
loadSounds();
