// Service Worker v2 for Fullstack Quest: Versioned caching with stale-while-revalidate
const VERSION = 'fsq-v2';
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;
const MAX_RUNTIME_CACHE = 50;

const PRECACHE_URLS = ['/index.html', '/manifest.webmanifest', '/icons/icon-192.svg', '/icons/icon-512.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name.startsWith('fsq-') && name !== PRECACHE && name !== RUNTIME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const copy = res.clone();
      const cache = await caches.open(RUNTIME);
      cache.put(req, copy);
    }
    return res;
  } catch (err) {
    return caches.match('/index.html').catch(() => new Response('Offline', { status: 503 }));
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchReq = fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(RUNTIME).then(async (cache) => {
        await cache.put(req, copy);
        const keys = await cache.keys();
        if (keys.length > MAX_RUNTIME_CACHE) {
          cache.delete(keys[0]);
        }
      });
    }
    return res;
  }).catch(() => cached || caches.match('/index.html'));
  return cached || fetchReq;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (/\.(js|css|svg|woff2|png)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
