const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('my-pwa-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 오프라인 상태에서도 알림을 보낼 수 있도록 background sync 이벤트 리스너 추가
self.addEventListener('sync', event => {
  if (event.tag === 'hourly-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_MESSAGE',
            payload: 'Background sync triggered.'
          });
        });
      })
    );
  }
});

// 주기적인 동기화를 위한 periodic sync 이벤트 리스너 추가
self.addEventListener('periodicsync', event => {
  if (event.tag === 'hourly-periodic-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PERIODIC_SYNC_MESSAGE',
            payload: 'Periodic sync triggered.'
          });
        });
      })
    );
  }
});
