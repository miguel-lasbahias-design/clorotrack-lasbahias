const CACHE_NAME = 'clorotrack-v13';
const ASSETS = [
  '/',
  '/index.html',
  '/manual.html',
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
  // Network first para Firebase, Anthropic, Cloud Functions y nuestro proxy
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('firestore') ||
      event.request.url.includes('anthropic') ||
      event.request.url.includes('google') ||
      event.request.url.includes('cloudfunctions') ||
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('/api/')) {
    return;
  }
  // Cache first para assets locales
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
