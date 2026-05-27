const CACHE_NAME = 'rosarium-cache-v1';

// Essential files to cache immediately on install
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg'
];

// Install Event - Cache the App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
});

// Activate Event - Clean up old caches if CACHE_NAME changes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        
        // Fetch fresh version from network in the background
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // Update the cache with the fresh response
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Ignore network errors (offline mode)
        });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchedResponse;
      });
    })
  );
});