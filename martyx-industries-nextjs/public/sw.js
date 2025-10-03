/* global workbox */
// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (typeof workbox !== 'undefined') {
  workbox.core.setCacheNameDetails({ prefix: 'martyx-nextjs' });
  self.skipWaiting();
  workbox.core.clientsClaim();
  workbox.navigationPreload.enable();

  // Precache essential offline assets
  workbox.precaching.precacheAndRoute([
    { url: '/offline.html', revision: '1' },
    { url: '/favicon.ico', revision: '1' },
    { url: '/logo.png', revision: '1' },
  ]);

  // Next.js static assets: CSS/JS/Workers
  workbox.routing.registerRoute(
    ({ request, url }) => {
      return ['style', 'script', 'worker'].includes(request.destination) ||
             url.pathname.startsWith('/_next/static/');
    },
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'martyx-nextjs-assets',
    })
  );

  // Images (including Next.js optimized images)
  workbox.routing.registerRoute(
    ({ request, url }) => {
      return request.destination === 'image' ||
             url.pathname.startsWith('/_next/image');
    },
    new workbox.strategies.CacheFirst({
      cacheName: 'martyx-nextjs-images',
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
      cacheName: 'martyx-nextjs-models',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
        }),
      ],
    })
  );

  // API GET requests (including Next.js API routes)
  workbox.routing.registerRoute(
    ({ url, request }) => {
      return (url.pathname.startsWith('/api/') || 
              url.pathname.startsWith('/_next/')) && 
             request.method === 'GET';
    },
    new workbox.strategies.NetworkFirst({
      cacheName: 'martyx-nextjs-api',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({ 
          statuses: [0, 200] 
        }),
      ],
    })
  );

  // External API requests (to backend)
  workbox.routing.registerRoute(
    ({ url, request }) => {
      const isExternalAPI = url.origin !== self.location.origin && 
                           url.pathname.includes('/api/');
      return isExternalAPI && request.method === 'GET';
    },
    new workbox.strategies.NetworkFirst({
      cacheName: 'martyx-nextjs-external-api',
      networkTimeoutSeconds: 5,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({ 
          statuses: [0, 200] 
        }),
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
  const networkFirstPages = new workbox.strategies.NetworkFirst({ 
    cacheName: 'martyx-nextjs-pages',
    networkTimeoutSeconds: 3,
  });
  
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

  // Handle font files
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'martyx-nextjs-fonts',
    })
  );

  // Handle manifest and other PWA assets
  workbox.routing.registerRoute(
    ({ url }) => {
      return url.pathname.endsWith('.webmanifest') ||
             url.pathname.endsWith('/manifest.json');
    },
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'martyx-nextjs-pwa',
    })
  );

} else {
  console.warn('Workbox failed to load');
}
