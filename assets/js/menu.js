/* Hamburger navigation menu — shared by every page.
   Injects a button under the site title and a dropdown list of pages. */
(function () {
  'use strict';
  var mark = document.querySelector('.topbar .mark');
  if (!mark) return;

  var PAGES = [
    { href: 'index.html',   label: 'Timer' },
    { href: 'about.html',   label: 'About' },
    { href: 'privacy.html', label: 'Privacy Policy' },
    { href: 'terms.html',   label: 'Terms of Service' }
  ];
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // Wrap the title so the button can sit beneath it.
  var brand = document.createElement('div');
  brand.className = 'brand';
  mark.parentNode.insertBefore(brand, mark);
  brand.appendChild(mark);

  var wrap = document.createElement('div');
  wrap.className = 'nav-menu';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-btn';
  btn.id = 'menuBtn';
  btn.setAttribute('aria-label', 'Main menu');
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'menuPop');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  var pop = document.createElement('nav');
  pop.className = 'menu-pop';
  pop.id = 'menuPop';
  pop.hidden = true;
  pop.setAttribute('aria-label', 'Main menu');
  PAGES.forEach(function (p) {
    var a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    var file = p.href.toLowerCase();
    if (file === here || (here === '' && file === 'index.html')) a.setAttribute('aria-current', 'page');
    pop.appendChild(a);
  });

  wrap.appendChild(btn);
  wrap.appendChild(pop);
  brand.appendChild(wrap);

  function setOpen(open, returnFocus) {
    pop.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open && returnFocus) btn.focus();
  }
  btn.addEventListener('click', function () { setOpen(pop.hidden); });
  document.addEventListener('click', function (e) {
    if (!pop.hidden && !wrap.contains(e.target)) setOpen(false);
  });
  // Capture phase so Esc closes the menu without also triggering timer shortcuts.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !pop.hidden) {
      e.stopPropagation();
      setOpen(false, true);
    }
  }, true);
})();
