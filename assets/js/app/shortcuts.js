// Keyboard shortcuts.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Keyboard shortcuts ----------
document.addEventListener('keydown', e=>{
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key === 'Escape'){
    if(!morePop.hidden) closeMore(true);
    else if(!themePop.hidden) closeThemeMenu(true);
    else if(panel.classList.contains('open')) closePanel();
    return;
  }
  const t = e.target, tag = t && t.tagName;
  if(tag==='INPUT' || tag==='SELECT' || tag==='TEXTAREA' || tag==='BUTTON' || tag==='A' || (t && t.isContentEditable)) return;
  if(panel.classList.contains('open') || document.body.classList.contains('info-open')) return;
  if(tabPanels.pomodoro.classList.contains('active')){
    if(e.key === ' ' || e.code === 'Space'){ e.preventDefault(); pRunning ? pPause() : pPlay(); }
    else if(e.key === 'r' || e.key === 'R'){ pReset(); }
    return;
  }
  if(tabPanels.stopwatch.classList.contains('active')){
    if(e.key === ' ' || e.code === 'Space'){ e.preventDefault(); swRunning ? swPause() : swPlay(); }
    else if(e.key === 'l' || e.key === 'L'){ swRecordLap(); }
    else if(e.key === 'r' || e.key === 'R'){ swReset(); }
    return;
  }
  if(tabPanels.countup.classList.contains('active')){
    if(e.key === ' ' || e.code === 'Space'){ e.preventDefault(); cuRunning ? cuPause() : cuPlay(); }
    else if(e.key === 'r' || e.key === 'R'){ cuReset(); }
    return;
  }
  if(!tabPanels.timer.classList.contains('active')) return;
  if(e.key === ' ' || e.code === 'Space'){ e.preventDefault(); isRunning ? pause() : play(); }
  else if(e.key === 'r' || e.key === 'R'){ reset(); }
  else if(e.key === 'b' || e.key === 'B'){ openPanel(); }
});
