// Tabs, the "More" timers menu, and helpers shared by the More timers (wake-lock release, "live" dot).
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Tabs ----------
const tabBtns = { timer: document.getElementById('tabBtnTimer'), breathe: document.getElementById('tabBtnBreathe'), reflect: document.getElementById('tabBtnReflect') };
const moreBtn = document.getElementById('moreBtn');
const tabPanels = { timer: document.getElementById('panel-timer'), breathe: document.getElementById('panel-breathe'), reflect: document.getElementById('panel-reflect'), pomodoro: document.getElementById('panel-pomodoro'), countup: document.getElementById('panel-countup'), stopwatch: document.getElementById('panel-stopwatch') };
function showTab(name){
  Object.keys(tabPanels).forEach(k=>{
    tabPanels[k].classList.toggle('active', k===name);
    if(tabBtns[k]){ tabBtns[k].classList.toggle('active', k===name); tabBtns[k].setAttribute('aria-pressed', String(k===name)); }
  });
  moreBtn.classList.toggle('active', name === 'pomodoro' || name === 'countup' || name === 'stopwatch');
  if(name !== 'breathe') stopBreathing();
}
Object.keys(tabBtns).forEach(k=>{ tabBtns[k].addEventListener('click', ()=>{ closeMore(); showTab(k); }); });

// ---------- "More timers" menu ----------
const morePop = document.getElementById('morePop');
function openMore(){ morePop.hidden = false; moreBtn.setAttribute('aria-expanded','true'); const f = morePop.querySelector('.more-item'); if(f) f.focus(); }
function closeMore(refocus){ if(morePop.hidden) return; morePop.hidden = true; moreBtn.setAttribute('aria-expanded','false'); if(refocus) moreBtn.focus(); }
moreBtn.addEventListener('click', ()=>{ morePop.hidden ? openMore() : closeMore(); });
morePop.addEventListener('click', e=>{
  const it = e.target.closest('[data-open]'); if(!it) return;
  closeMore(); showTab(it.dataset.open);
});
document.addEventListener('click', e=>{ if(!morePop.hidden && !e.target.closest('.more-wrap')) closeMore(); });

let swRunning = false, swElapsed = 0; // Stopwatch state (declared early; used by shared helpers)
let cuRunning = false, cuStart = 0, cuElapsed = 0, cuHandle = null, cuLastChime = 0; // Count Up state (declared early; used by shared helpers)

// Release the screen wake lock only when nothing is running.
function maybeRelease(){ if(!isRunning && !pRunning && !cuRunning && !swRunning) releaseWake(); }
function updateLive(){ moreBtn.classList.toggle('live', pRunning || cuRunning || swRunning); }
