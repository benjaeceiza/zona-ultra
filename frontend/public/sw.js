const APP_SHELL_CACHE = 'zona-ultra-shell-v3';
const STATIC_CACHE = 'zona-ultra-static-v3';
const API_CACHE = 'zona-ultra-api-v3';

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo-zona-ultra.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_FILES).catch((err) => {
        console.warn('[SW] Algunos archivos del shell no pudieron pre-cachearse:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const allowedCaches = [APP_SHELL_CACHE, STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (!allowedCaches.includes(name)) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo interceptamos peticiones GET HTTP/HTTPS
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // Ignorar módulos de desarrollo de Vite HMR para no interferir en local
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // 1. Peticiones a la API (/api/...) -> Network First con Fallback a Caché (Entrenamientos, planes, usuario, zapatillas)
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request.url, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request.url);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'Sin conexión a internet y sin datos en caché.'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // 2. Navegación SPA (HTML) -> Network First con Fallback al index.html cacheado
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => {
            cache.put('/index.html', responseClone);
          });
          return networkResponse;
        })
        .catch(async () => {
          const cachedIndex =
            (await caches.match('/index.html')) || (await caches.match('/'));
          return cachedIndex;
        })
    );
    return;
  }

  // 3. Recursos estáticos del mismo origen (JS, CSS, imágenes, íconos, fuentes) -> Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
