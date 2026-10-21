// Coremon - service worker: primero la red (siempre la última versión) y,
// sin conexión, lo guardado en caché.
const CACHE = 'coremon-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/audio.js', 'js/data.js', 'js/sprites.js', 'js/scenery.js', 'js/maps.js',
  'js/game.js', 'js/ui.js', 'js/battle.js', 'js/taller.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
