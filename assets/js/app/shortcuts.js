// Keyboard shortcuts. Each tab has its own: Space starts/pauses, R resets, L laps (Stopwatch), B opens Bell Settings (Timer).
import { isTabActive, isMoreOpen, closeMore } from './tabs.js';
import { isThemeMenuOpen, closeThemeMenu } from './theme-menu.js';
import { isPanelOpen, openPanel, closePanel } from './bell-settings.js';
import { toggle as timerToggle, reset as timerReset } from './timer.js';
import { pToggle, pReset } from './pomodoro.js';
import { cuToggle, cuReset } from './countup.js';
import { swToggle, swReset, swRecordLap } from './stopwatch.js';

const isSpace = e => e.key === ' ' || e.code === 'Space';
const isKey = (e, k) => e.key === k || e.key === k.toUpperCase();

document.addEventListener('keydown', e=>{
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key === 'Escape'){
    if(isMoreOpen()) closeMore(true);
    else if(isThemeMenuOpen()) closeThemeMenu(true);
    else if(isPanelOpen()) closePanel();
    return;
  }
  const t = e.target, tag = t && t.tagName;
  if(tag==='INPUT' || tag==='SELECT' || tag==='TEXTAREA' || tag==='BUTTON' || tag==='A' || (t && t.isContentEditable)) return;
  if(isPanelOpen() || document.body.classList.contains('info-open')) return;
  if(isTabActive('pomodoro')){
    if(isSpace(e)){ e.preventDefault(); pToggle(); }
    else if(isKey(e, 'r')){ pReset(); }
    return;
  }
  if(isTabActive('stopwatch')){
    if(isSpace(e)){ e.preventDefault(); swToggle(); }
    else if(isKey(e, 'l')){ swRecordLap(); }
    else if(isKey(e, 'r')){ swReset(); }
    return;
  }
  if(isTabActive('countup')){
    if(isSpace(e)){ e.preventDefault(); cuToggle(); }
    else if(isKey(e, 'r')){ cuReset(); }
    return;
  }
  if(!isTabActive('timer')) return;
  if(isSpace(e)){ e.preventDefault(); timerToggle(); }
  else if(isKey(e, 'r')){ timerReset(); }
  else if(isKey(e, 'b')){ openPanel(); }
});
