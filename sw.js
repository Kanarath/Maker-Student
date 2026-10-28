// Service worker: red primero, cachÃ© como respaldo (funciona sin conexiÃ³n).
// IMPORTANTE: subir CACHE en cada versiÃ³n y listar aquÃ­ los ficheros nuevos.
// El prefijo del nombre debe ser ÃšNICO de esta app (el dominio de GitHub Pages se comparte con otras apps).
const PREFIX = 'tallerinv-';
const CACHE = PREFIX + 'v10';
const FILES = ['./', 'index.html', 'style.css', 'content.js', 'content2.js', 'content3.js', 'content4.js', 'mascot.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  // borra SOLO las cachÃ©s antiguas de esta app, nunca las de otras apps del mismo dominio
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
