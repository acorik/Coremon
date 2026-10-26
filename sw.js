// Coremon 2.0 - service worker: primero la red (siempre la última versión) y,
// sin conexión, lo guardado en caché (se guarda todo lo que se va cargando).
const CACHE = 'coremon-v2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png',
  'coremon1/index.html', 'coremon1/css/style.css',
  'coremon1/js/audio.js', 'coremon1/js/data.js', 'coremon1/js/sprites.js', 'coremon1/js/scenery.js', 'coremon1/js/maps.js',
  'coremon1/js/game.js', 'coremon1/js/ui.js', 'coremon1/js/battle.js', 'coremon1/js/taller.js'
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
