// Mindful Joy service worker: lets the site work offline and start fast once it has been visited.
//
// Strategy: cache first. Every page and file is saved in one versioned cache when the worker installs,
// and launches are served from that cache straight away, with no waiting for the network.
// When a new version of the site is deployed, the browser notices that this file changed and downloads the
// whole new set into a NEW cache in the background. As soon as that is complete the new worker takes over
// (skipWaiting), so the next load, reload or reopen shows the new version with no prompt. A page that is
// already open is left alone. Files never come from two versions: a worker serves only its own cache.
//
// CACHE_VERSION is written by `node tools/stamp-sw.mjs` (a fingerprint of every file listed below).
// Run it before each commit that changes the site; `node --test tests/` fails if it was forgotten.
const CACHE_VERSION = 'mj-7d2dff0d';
const PRECACHE = [
  './', 'index.html', 'about.html', 'privacy.html', 'terms.html', 'articles.html', 'getting-started.html', 'what-is-mindfulness.html', 'install-app.html', 'manifest.webmanifest',
  'assets/css/styles.css',
  'assets/js/app/activity.js', 'assets/js/app/audio.js', 'assets/js/app/bell-settings.js', 'assets/js/app/breathing.js', 'assets/js/app/countup.js', 'assets/js/app/display.js', 'assets/js/app/data-menu.js', 'assets/js/app/dom.js', 'assets/js/app/history-store.js', 'assets/js/app/history.js', 'assets/js/app/intervals.js', 'assets/js/app/main.js', 'assets/js/app/pomodoro.js', 'assets/js/app/reflect.js', 'assets/js/app/sequence-editor.js', 'assets/js/app/sequence.js', 'assets/js/app/shortcuts.js', 'assets/js/app/state.js', 'assets/js/app/stopwatch.js', 'assets/js/app/storage.js', 'assets/js/app/tabs.js', 'assets/js/app/theme-menu.js', 'assets/js/app/timer.js', 'assets/js/app/wake.js',
  'assets/js/menu.js', 'assets/js/consent.js', 'assets/js/analytics.js', 'assets/js/site.js', 'assets/js/themes.js', 'assets/js/pwa.js', 'assets/js/preview.js',
  'assets/og-image.png', 'assets/fonts/inter-latin-wght-normal.woff2', 'assets/img/singing-bowl.webp', 'assets/img/singing-bowl.jpg', 'assets/img/stacked-stones.webp', 'assets/img/stacked-stones.jpg', 'assets/favicon.svg', 'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/apple-touch-icon.png', 'assets/icons/icon-512.png',
  'assets/audio/bowl.mp3', 'assets/audio/burma.mp3', 'assets/audio/singing.mp3', 'assets/audio/gong.mp3', 'assets/audio/interval.mp3'
];

self.addEventListener('install', e => {
  // cache:'reload' skips the browser's own HTTP cache so the saved copy is the fresh deploy.
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())   // only after every file is saved, so a half-finished update never takes over
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pages are saved under their .html names, but the host may serve them without the ending (/about).
function fromCache(req){
  return caches.match(req, { ignoreSearch: true }).then(hit => {
    if(hit || req.mode !== 'navigate') return hit;
    const path = new URL(req.url).pathname.replace(/\/$/, '');
    return path ? caches.match(path + '.html') : undefined;
  });
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Only handle our own pages and files. Ads and everything else go straight to the network.
  if(req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fromCache(req).then(hit => hit || fetch(req).catch(() =>
      req.mode === 'navigate' ? caches.match('index.html') : Response.error()
    ))
  );
});
