const CACHE_NAME = 'sspg-v1.4.1';
// The pages are cached by file name, not as "/" and "/de/": "/" may answer with
// a redirect to /de/ (.htaccess, German browsers), and a redirected response
// must not be served for a navigation. Navigations are mapped in PAGE_FOR.
const CACHE_FILES = [
  '/index.html',
  '/de/index.html',
  '/css/style.css?v=1.4.1',
  '/js/sspg.js?v=1.4.1',
  '/register-sw.js?v=1.4.1',
  '/assets/pwa/manifest.json',
  '/assets/favicon/android-icon-192x192.png',
  '/assets/favicon/android-icon-512x512.png',
];

// Navigation path -> cached page (English at /, German at /de/).
const PAGE_FOR = {
  '/': '/index.html',
  '/index.html': '/index.html',
  '/de/': '/de/index.html',
  '/de/index.html': '/de/index.html',
};

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

  const url = new URL(request.url);
  const page = request.mode === 'navigate' && url.origin === self.location.origin
    ? PAGE_FOR[url.pathname]
    : undefined;

  e.respondWith(
    caches.match(page || request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        // Offline navigation fallback to the cached app shell in the right language.
        if (request.mode === 'navigate') {
          return caches.match(url.pathname.startsWith('/de/') ? '/de/index.html' : '/index.html');
        }
        return Response.error();
      });
    })
  );
});
