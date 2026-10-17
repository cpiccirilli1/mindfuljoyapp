// Marks preview builds so they are never mistaken for the live site.
// It looks at the address the page is running on, not at the branch, so the same file lives on both
// `dev` and `main` and merging can never carry a "preview" mark into production.
// If the live site ever gets another address, add it to LIVE_HOSTS below.
(function () {
  'use strict';
  var LIVE_HOSTS = ['mindfuljoy.app', 'www.mindfuljoy.app'];
  var host = (location.hostname || '').toLowerCase();
  if (LIVE_HOSTS.indexOf(host) !== -1) return;

  document.title = '[Preview] ' + document.title;

  var tag = document.createElement('div');
  tag.className = 'preview-tag';
  tag.textContent = 'Preview build';
  tag.setAttribute('role', 'note');
  tag.title = 'You are viewing a preview, not mindfuljoy.app (' + host + ')';
  var st = document.createElement('style');
  st.textContent =
    '.preview-tag{position:fixed;top:3px;left:50%;transform:translateX(-50%);z-index:60;' +
    'padding:1px 10px;border-radius:999px;font:600 .62rem/1.5 Inter,system-ui,sans-serif;letter-spacing:.06em;' +
    'text-transform:uppercase;color:var(--bg);background:var(--accent);opacity:.92;pointer-events:none;white-space:nowrap}';
  document.head.appendChild(st);
  (document.body || document.documentElement).appendChild(tag);
})();
