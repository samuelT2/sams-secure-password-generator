self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('sams-secure-password-generator').then((cache) => {
      cache.addAll([
        '/index.html',
        '/css/style.css',
        '/js/sspg.js'
      ])
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
})