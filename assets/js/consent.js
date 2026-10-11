/* Cookie consent banner — shared by every page.
   Accept: hides the banner and remembers the choice on this device.
   Reject: sends the visitor to google.com. */
(function () {
  'use strict';
  var KEY = 'mj.consent.v1';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  if (get() === 'accepted') return;

  var bar = document.createElement('div');
  bar.className = 'consent';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Cookie consent');
  bar.innerHTML =
    '<p class="consent-text">This site uses cookies, including cookies from Google for advertising, ' +
    'and stores your settings on your device. Read our <a href="privacy.html">Privacy Policy</a>. ' +
    'Do you consent?</p>' +
    '<div class="consent-actions">' +
    '<button type="button" class="consent-btn consent-reject">Reject</button>' +
    '<button type="button" class="consent-btn consent-accept">Accept</button>' +
    '</div>';
  document.body.appendChild(bar);
  document.documentElement.classList.add('consent-open');

  bar.querySelector('.consent-accept').addEventListener('click', function () {
    set('accepted');
    bar.remove();
    document.documentElement.classList.remove('consent-open');
  });
  bar.querySelector('.consent-reject').addEventListener('click', function () {
    window.location.href = 'https://www.google.com/';
  });
})();
