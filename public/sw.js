/**
 * pantaumala service worker — lightweight offline shell and caching.
 */
const CACHE_NAME = 'pantaumala-v1'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/brand-symbol.svg',
  '/brand-wordmark.svg',
  '/apple-touch-icon.png',
  '/pwa-192.png',
  '/pwa-512.png',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key)
            return undefined
          }),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // API and dynamic session routes: network-first, do not lock to stale cache
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname === '/frontend/session'
  ) {
    return
  }

  // HTML navigation: Network first with cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html') || caches.match('/')),
    )
    return
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((networkRes) => {
        if (
          networkRes.status === 200 &&
          (url.pathname.startsWith('/assets/') ||
            url.pathname.startsWith('/fonts/') ||
            url.origin === self.location.origin)
        ) {
          const clone = networkRes.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone))
        }
        return networkRes
      })
    }),
  )
})
