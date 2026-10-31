// Tabs (Timer / Breathe / Reflect) and the "More" menu that opens Pomodoro, Count Up, Stopwatch and History.
import { $ } from './dom.js';
import { stopBreathing } from './breathing.js';

const tabBtns = { timer: $('tabBtnTimer'), breathe: $('tabBtnBreathe'), reflect: $('tabBtnReflect') };
const moreBtn = $('moreBtn');
const tabPanels = { timer: $('panel-timer'), breathe: $('panel-breathe'), reflect: $('panel-reflect'), pomodoro: $('panel-pomodoro'), countup: $('panel-countup'), stopwatch: $('panel-stopwatch'), history: $('panel-history') };

export const isTabActive = name => tabPanels[name].classList.contains('active');

function showTab(name){
  Object.keys(tabPanels).forEach(k=>{
    tabPanels[k].classList.toggle('active', k===name);
    if(tabBtns[k]){ tabBtns[k].classList.toggle('active', k===name); tabBtns[k].setAttribute('aria-pressed', String(k===name)); }
  });
  moreBtn.classList.toggle('active', name === 'pomodoro' || name === 'countup' || name === 'stopwatch' || name === 'history');
  if(name !== 'breathe') stopBreathing();
  if(name === 'history') document.dispatchEvent(new Event('mj:show-history'));
}

// ----- "More timers" menu -----
const morePop = $('morePop');
export const isMoreOpen = () => !morePop.hidden;
function openMore(){ morePop.hidden = false; moreBtn.setAttribute('aria-expanded','true'); const f = morePop.querySelector('.more-item'); if(f) f.focus(); }
export function closeMore(refocus){ if(morePop.hidden) return; morePop.hidden = true; moreBtn.setAttribute('aria-expanded','false'); if(refocus) moreBtn.focus(); }

Object.keys(tabBtns).forEach(k=>{ tabBtns[k].addEventListener('click', ()=>{ closeMore(); showTab(k); }); });
moreBtn.addEventListener('click', ()=>{ morePop.hidden ? openMore() : closeMore(); });
morePop.addEventListener('click', e=>{
  const it = e.target.closest('[data-open]'); if(!it) return;
  closeMore(); showTab(it.dataset.open);
});
document.addEventListener('click', e=>{ if(!morePop.hidden && !e.target.closest('.more-wrap')) closeMore(); });
