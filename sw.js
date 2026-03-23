const CACHE_NAME = 'tastelist-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response; // Ritorna la cache se sei offline
        return fetch(event.request);
      })
  );
});