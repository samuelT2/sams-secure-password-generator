const CACHE_NAME = 'sspg-v1.3.1';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/css/style.css?v=1.3.1',
  '/js/sspg.js?v=1.3.1',
  '/register-sw.js?v=1.3.1',
  '/assets/pwa/manifest.json',
  '/assets/favicon/android-icon-192x192.png',
  '/assets/favicon/android-icon-512x512.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        // Offline navigation fallback to the cached app shell.
        if (request.mode === 'navigate') return caches.match('/index.html');
        return Response.error();
      });
    })
  );
});
