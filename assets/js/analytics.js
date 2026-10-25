// Optional visitor counts with Cloudflare Web Analytics: no cookies, no accounts, no tracking across sites.
// It does NOTHING until a token is pasted into TOKEN below, so it is safe to leave in place.
//
// To turn it on:
//   1. In the Cloudflare dashboard, open Web Analytics, add mindfuljoy.app, and copy the site token.
//   2. Paste the token between the quotes in TOKEN.
//   3. Update the Privacy Policy (TODO.txt has the sentence to add), then publish.
// It never runs on preview builds, and it skips visitors who send "Do Not Track" or Global Privacy Control.
(function () {
  'use strict';
  var TOKEN = '';
  var LIVE_HOSTS = ['mindfuljoy.app', 'www.mindfuljoy.app'];

  if (!TOKEN) return;
  var host = (location.hostname || '').toLowerCase();
  if (LIVE_HOSTS.indexOf(host) === -1) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;

  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
})();
