// Color scheme picker and the gear menu that holds it.
// The themes themselves are defined in themes.js (a regular script that sets window.MJ).
import { $ } from './dom.js';
import { store } from './state.js';

const SCHEMES = window.MJ.SCHEMES;
const applyScheme = window.MJ.applyScheme;

const schemeSelect = $('schemeSelect');
window.MJ.fillSelect(schemeSelect, 'sage');
schemeSelect.addEventListener('change', ()=>{
  const s = SCHEMES.find(x=>x.id===schemeSelect.value);
  if(s) applyScheme(s);
});
applyScheme(SCHEMES.find(x=>x.id==='sage'));

// ----- Gear menu -----
const themeBtn = $('themeBtn');
const themePop = $('themePop');
const themeMenu = $('themeMenu');
export const isThemeMenuOpen = () => !themePop.hidden;
function openThemeMenu(){ themePop.hidden = false; themeBtn.setAttribute('aria-expanded','true'); }
export function closeThemeMenu(returnFocus){
  const wasOpen = !themePop.hidden;
  themePop.hidden = true; themeBtn.setAttribute('aria-expanded','false');
  if(wasOpen && returnFocus) themeBtn.focus();
}
themeBtn.addEventListener('click', ()=>{ themePop.hidden ? openThemeMenu() : closeThemeMenu(false); });
document.addEventListener('click', e=>{ if(!themePop.hidden && !themeMenu.contains(e.target)) closeThemeMenu(false); });
schemeSelect.addEventListener('change', ()=>{ if(store.ready) closeThemeMenu(true); });
