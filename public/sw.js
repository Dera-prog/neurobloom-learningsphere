const SHELL_CACHE = 'neurobloom-shell-v1'
const ASSET_CACHE = 'neurobloom-assets-v1'
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']
const MAX_ASSETS = 60

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE).map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          if (fresh.ok && (fresh.headers.get('content-type') || '').includes('text/html')) {
            const cache = await caches.open(SHELL_CACHE)
            await cache.put('/', fresh.clone())
          }
          return fresh
        } catch {
          return (await caches.match(request)) || (await caches.match('/')) || Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE)
      const cached = await cache.match(request)
      if (cached) {
        fetch(request)
          .then((response) => response.ok && cache.put(request, response.clone()))
          .catch(() => undefined)
        return cached
      }
      const response = await fetch(request)
      if (response.ok) {
        await cache.put(request, response.clone())
        const keys = await cache.keys()
        if (keys.length > MAX_ASSETS) await cache.delete(keys[0])
      }
      return response
    })(),
  )
})
