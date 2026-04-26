const CACHE_NAME = 'clorotrack-v9';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network first para Firebase, Anthropic API y nuestro proxy de Netlify
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('anthropic') ||
      event.request.url.includes('google') ||
      event.request.url.includes('/.netlify/functions/')) {
    return;
  }
  // Cache first para assets locales
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
