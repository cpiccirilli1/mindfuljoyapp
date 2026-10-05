/* Header controls for About / Privacy / Terms: theme gear menu. */
(function(){
  var MJ = window.MJ;
  var select = document.getElementById('schemeSelect');
  var btn = document.getElementById('themeBtn');
  var pop = document.getElementById('themePop');
  var menu = document.getElementById('themeMenu');
  MJ.SCHEMES.forEach(function(s){
    var opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name;
    select.appendChild(opt);
  });
  var current = MJ.find(MJ.savedScheme()) || MJ.find('sage');
  select.value = current.id;
  function open(){ pop.hidden = false; btn.setAttribute('aria-expanded','true'); }
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
