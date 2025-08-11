/* global workbox */
// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (typeof workbox !== 'undefined') {
  workbox.core.setCacheNameDetails({ prefix: 'martyx' });
  self.skipWaiting();
  workbox.core.clientsClaim();
  workbox.navigationPreload.enable();

  // Precache essential offline assets
  workbox.precaching.precacheAndRoute([
    { url: '/offline.html', revision: '1' },
    { url: '/favicon.ico', revision: '1' },
    { url: '/vite.svg', revision: '1' },
  ]);

  // Static assets: CSS/JS/Workers
  workbox.routing.registerRoute(
    ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'martyx-assets',
    })
  );

  // Images
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'martyx-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // 3D models (glb)
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.endsWith('.glb'),
    new workbox.strategies.CacheFirst({
      cacheName: 'martyx-models',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
        }),
      ],
    })
  );

  // API GET requests
  workbox.routing.registerRoute(
    ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
    new workbox.strategies.NetworkFirst({
      cacheName: 'martyx-api',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  // Offline navigation fallback
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return workbox.precaching.matchPrecache('/offline.html');
    }
    return Response.error();
  });

  // Prefer network for navigations, fallback to cache then offline
  const networkFirstPages = new workbox.strategies.NetworkFirst({ cacheName: 'martyx-pages' });
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    async (args) => {
      try {
        return await networkFirstPages.handle(args);
      } catch (e) {
        const cached = await caches.match(args.event.request);
        return cached || workbox.precaching.matchPrecache('/offline.html');
      }
    }
  );
} else {
  // No-op if Workbox failed to load
}
