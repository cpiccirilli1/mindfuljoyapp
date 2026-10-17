// Color scheme picker and the gear menu (themes themselves live in themes.js).
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Color schemes ----------
const SCHEMES = window.MJ.SCHEMES;
const applyScheme = window.MJ.applyScheme;

const schemeSelect = document.getElementById('schemeSelect');
window.MJ.fillSelect(schemeSelect, 'sage');
schemeSelect.addEventListener('change', ()=>{
  const s = SCHEMES.find(x=>x.id===schemeSelect.value);
  if(s) applyScheme(s);
});
applyScheme(SCHEMES.find(x=>x.id==='sage'));

// ---------- Theme gear menu ----------
const themeBtn = document.getElementById('themeBtn');
const themePop = document.getElementById('themePop');
const themeMenu = document.getElementById('themeMenu');
function openThemeMenu(){ themePop.hidden = false; themeBtn.setAttribute('aria-expanded','true'); }
function closeThemeMenu(returnFocus){
  const wasOpen = !themePop.hidden;
  themePop.hidden = true; themeBtn.setAttribute('aria-expanded','false');
  if(wasOpen && returnFocus) themeBtn.focus();
}
themeBtn.addEventListener('click', ()=>{ themePop.hidden ? openThemeMenu() : closeThemeMenu(false); });
document.addEventListener('click', e=>{ if(!themePop.hidden && !themeMenu.contains(e.target)) closeThemeMenu(false); });
schemeSelect.addEventListener('change', ()=>{ if(storeReady) closeThemeMenu(true); });
