/* Header controls for About / Privacy / Terms: theme gear menu. */
(function(){
  var MJ = window.MJ;
  var select = document.getElementById('schemeSelect');
  var btn = document.getElementById('themeBtn');
  var pop = document.getElementById('themePop');
  var menu = document.getElementById('themeMenu');
  var current = MJ.find(MJ.savedScheme()) || MJ.find('sage');
  MJ.fillSelect(select, current.id);
  var picker = MJ.buildPicker(select);
  function open(){ picker.sync(); pop.hidden = false; btn.setAttribute('aria-expanded','true'); }
  function close(ret){
    var was = !pop.hidden;
    pop.hidden = true; btn.setAttribute('aria-expanded','false');
    if(was && ret) btn.focus();
  }
  btn.addEventListener('click', function(){ pop.hidden ? open() : close(false); });
  document.addEventListener('click', function(e){ if(!pop.hidden && !menu.contains(e.target)) close(false); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !pop.hidden) close(true); });
  select.addEventListener('change', function(){
    var s = MJ.find(select.value);
    if(!s) return;
    MJ.applyScheme(s);
    try{
      var d = JSON.parse(localStorage.getItem(MJ.STORE_KEY) || 'null') || {};
      d.scheme = s.id;
      localStorage.setItem(MJ.STORE_KEY, JSON.stringify(d));
    }catch(e){}
    close(true);
  });
})();

/* Floating "Back to top" button: appears once the reader has scrolled down a little. */
(function(){
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.title = 'Back to top';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);

  var SHOW_AFTER = 300; // pixels scrolled before the button appears
  function update(){ btn.classList.toggle('show', (window.pageYOffset || document.documentElement.scrollTop) > SHOW_AFTER); }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  btn.addEventListener('click', function(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var back = document.querySelector('.back-link');
    if(back){ back.focus({ preventScroll: true }); }
  });
})();
