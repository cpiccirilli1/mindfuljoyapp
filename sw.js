// Mindful Joy service worker: lets the site work offline once it has been visited.
// Strategy: network first (so a new deploy shows up right away), falling back to the saved copy when offline.
// Bump CACHE_VERSION to clear old saved copies.
const CACHE_VERSION = 'mj-v5';
const PRECACHE = [
  './', 'index.html', 'about.html', 'privacy.html', 'terms.html', 'articles.html', 'manifest.webmanifest',
  'assets/css/styles.css',
  'assets/js/app/activity.js', 'assets/js/app/audio.js', 'assets/js/app/bell-settings.js', 'assets/js/app/breathing.js', 'assets/js/app/countup.js', 'assets/js/app/display.js', 'assets/js/app/dom.js', 'assets/js/app/intervals.js', 'assets/js/app/main.js', 'assets/js/app/pomodoro.js', 'assets/js/app/reflect.js', 'assets/js/app/sequence-editor.js', 'assets/js/app/sequence.js', 'assets/js/app/shortcuts.js', 'assets/js/app/state.js', 'assets/js/app/stopwatch.js', 'assets/js/app/storage.js', 'assets/js/app/tabs.js', 'assets/js/app/theme-menu.js', 'assets/js/app/timer.js', 'assets/js/app/wake.js',
  'assets/js/menu.js', 'assets/js/consent.js', 'assets/js/site.js', 'assets/js/themes.js', 'assets/js/pwa.js', 'assets/js/preview.js',
  'assets/favicon.svg', 'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/audio/bowl.mp3', 'assets/audio/burma.mp3', 'assets/audio/singing.mp3', 'assets/audio/gong.mp3', 'assets/audio/interval.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Only handle our own pages and files. Ads, fonts and everything else go straight to the network.
  if(req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if(res && res.ok && res.type === 'basic'){
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
    )
  );
});
