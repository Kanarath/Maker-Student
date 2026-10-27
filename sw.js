// Service worker: red primero, caché como respaldo (funciona sin conexión).
// IMPORTANTE: subir CACHE en cada versión y listar aquí los ficheros nuevos.
// El prefijo del nombre debe ser ÚNICO de esta app (el dominio de GitHub Pages se comparte con otras apps).
const PREFIX = 'tallerinv-';
const CACHE = PREFIX + 'v1';
const FILES = ['./', 'index.html', 'style.css', 'content.js', 'mascot.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  // borra SOLO las cachés antiguas de esta app, nunca las de otras apps del mismo dominio
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
