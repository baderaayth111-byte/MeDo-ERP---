// MeDo ERP Offline Service Worker (PWA Engine)
const CACHE_NAME = 'medo-erp-offline-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('error', (e) => {
  console.warn('[MeDo ERP SW] Error caught safely:', e);
});

self.addEventListener('unhandledrejection', (e) => {
  console.warn('[MeDo ERP SW] Unhandled rejection caught safely:', e);
});

// 1. Install event: Precache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[MeDo ERP ServiceWorker] Precaching app shell for offline use');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[MeDo ERP ServiceWorker] Precache partial error (ignored):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[MeDo ERP ServiceWorker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Stale-While-Revalidate & Network-first with Cache fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET requests, API requests, Vite internal requests, and extensions
  if (
    !request ||
    request.method !== 'GET' ||
    !request.url ||
    !request.url.startsWith('http') ||
    request.url.includes('/api/') ||
    request.url.includes('/@vite/') ||
    request.url.includes('/@fs/') ||
    request.url.includes('/@id/') ||
    request.url.includes('hot-update') ||
    request.url.includes('sockjs')
  ) {
    return;
  }

  // Handle SPA Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            }).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          // If offline, return cached page or root
          try {
            const cachedPage = await caches.match(request);
            if (cachedPage) return cachedPage;
            const cachedRoot = await caches.match('/');
            if (cachedRoot) return cachedRoot;
            const cachedHtml = await caches.match('/index.html');
            if (cachedHtml) return cachedHtml;
          } catch (e) {}
          return new Response('<html><body><h1>MeDo ERP Offline</h1><p>يرجى التحقق من اتصالك بالإنترنت.</p></body></html>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 503,
          });
        })
    );
    return;
  }

  // Static Assets / Fonts / Scripts / Images: Cache-first with background network update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            }).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          if (cachedResponse) return cachedResponse;
          return new Response('', { status: 408, statusText: 'Offline' });
        });

      return cachedResponse || fetchPromise;
    }).catch(() => {
      return fetch(request).catch(() => new Response('', { status: 408, statusText: 'Offline' }));
    })
  );
});

