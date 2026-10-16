const CACHE = 'elemental-v3';
const PRECACHE = [
  './',
  'offline.html',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/emblem.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/levels/level-0.svg',
  'icons/levels/level-1.svg',
  'icons/levels/level-2.svg',
  'icons/levels/level-3.svg',
  'icons/levels/level-4.svg',
  'icons/levels/level-5.svg',
  'icons/rewards/coin.svg',
  'icons/rewards/xp.svg',
  'sounds/test-success.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE.map((asset) => new URL(asset, self.registration.scope).toString())),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(new URL('./', self.registration.scope).toString()).then((shell) => {
            if (shell) return shell;

            return caches.match(new URL('offline.html', self.registration.scope).toString());
          }),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
