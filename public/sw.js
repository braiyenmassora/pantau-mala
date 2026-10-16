/**
 * pantaumala service worker — lightweight offline shell and caching.
 */
const BUILD_ID = '__PANTAU_BUILD__'
const CACHE_NAME = `pantaumala-v2-${BUILD_ID}`
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting())
  }
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key.startsWith('pantaumala-') && key !== CACHE_NAME)
              return caches.delete(key)
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
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return

  // API and dynamic session routes: network-first, do not lock to stale cache
  if (
    url.pathname === '/api' ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/auth' ||
    url.pathname.startsWith('/auth/') ||
    url.pathname === '/frontend/session'
  ) {
    return
  }

  // HTML navigation: Network first with cache fallback
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            event.waitUntil(
              copy.text().then((html) => {
                const headers = new Headers(copy.headers)
                headers.delete('Content-Length')
                const offline = html.replace(/<meta name="pantau-page-view" content="[0-9a-f-]{36}">/g, '')
                return caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', new Response(offline, { headers })))
              }).catch(() => {}),
            )
          }
          return response
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/')) || new Response('Aplikasi belum tersedia offline.', { status: 503 })),
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
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {}))
        }
        return networkRes
      })
    }),
  )
})
