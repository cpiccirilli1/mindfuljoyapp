// Shared basics for the main timer: duration menus, timer state, settings object, clock formatting, screen-reader announcer, ring drawing.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Duration select ----------
const durationSelect = document.getElementById('durationSelect');
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
const customLenRow = document.getElementById('customLenRow');
const customLenInput = document.getElementById('customLenInput');
const intervalEvery = document.getElementById('intervalEvery');
for(let m=1; m<=30; m++){
  const opt = document.createElement('option');
  opt.value = m; opt.textContent = m + (m===1?' minute':' minutes');
  if(m===5) opt.selected = true;
  intervalEvery.appendChild(opt);
}

// ---------- State ----------
let totalSeconds = Number(durationSelect.value) * 60;
let phase = 'idle'; // idle | prep | session
let phaseTotal = totalSeconds;
let phaseStartTimestamp = null;
let phasePausedElapsed = 0;
let isRunning = false;
let tickHandle = null;
let triggered = new Set();
let customTimes = []; // minutes
let storeReady = false; // true once saved settings have been loaded

const settings = { startEnabled:true, endEnabled:true, intervalEnabled:false, mode:'regular', prepSeconds:5, bellSound:'bowl', startCount:1, endCount:1, segEnabled:true, segCount:1, volume:1, vibrate:false };
document.getElementById('prepSelect').addEventListener('change', e=>{ settings.prepSeconds = Number(e.target.value); });

// ---------- DOM ----------
const timeDisplay = document.getElementById('timeDisplay');
const phaseLabel = document.getElementById('phaseLabel');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const ring = document.getElementById('ringProgress');
const CIRC = 2 * Math.PI * 100;
ring.style.strokeDasharray = CIRC;

function fmt(s){
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  const mm = String(m).padStart(2,'0'), ss = String(sec).padStart(2,'0');
  return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
}
const announcer = document.getElementById('announcer');
function announce(msg){ announcer.textContent = ''; setTimeout(()=>{ announcer.textContent = msg; }, 60); }

function updateRing(remaining, total){
  const frac = total ? remaining/total : 0;
  ring.style.strokeDashoffset = CIRC * (1 - frac);
}

function render(remaining){
  timeDisplay.textContent = fmt(remaining);
  updateRing(remaining, phaseTotal);
}

function renderPrep(remaining){
  timeDisplay.textContent = fmt(remaining);
  updateRing(remaining, phaseTotal);
}
