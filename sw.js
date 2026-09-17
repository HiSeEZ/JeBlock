const CACHE = 'jezblock-v011';
const PROFILE_MIME = 'application/x-apple-aspen-config';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './jezblock-standard.mobileconfig',
  './jezblock-family.mobileconfig',
  './jezblock-off.mobileconfig'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('.mobileconfig')) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      const source = cached || await fetch(event.request);
      const body = await source.arrayBuffer();
      const headers = new Headers(source.headers);
      const filename = url.pathname.split('/').pop() || 'jezblock.mobileconfig';

      // GitHub Pages may identify these as plain text. Force Apple's profile MIME
      // for any direct/fallback navigation handled by the service worker.
      headers.set('Content-Type', PROFILE_MIME);
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);

      return new Response(body, {
        status: source.status,
        statusText: source.statusText,
        headers
      });
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
