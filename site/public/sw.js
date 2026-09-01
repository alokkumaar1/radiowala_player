/*
  Radio Wala — app-shell service worker.

  This caches the *website* so it opens instantly and survives a dead signal:
  HTML, JS, CSS, fonts, icons and our own artwork. It deliberately does not
  touch the music. Audio streams from YouTube's player in a cross-origin
  iframe, and this worker never sees or stores those bytes — every request that
  isn't same-origin is passed straight through untouched, as are range
  requests. Caching copyrighted audio would be both illegal and a lie about
  what this site is.
*/

const VERSION = 'v1'
const SHELL = `radio-wala-shell-${VERSION}`
const ASSETS = `radio-wala-assets-${VERSION}`
const KEEP = new Set([SHELL, ASSETS])

// Enough to boot the app offline. Hashed /_next/static/* files are picked up on
// first visit instead — listing them here would mean regenerating this file on
// every build.
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon-128.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/artwork-512.jpg',
  '/hero-1024.webp',
]

const CACHEABLE = /\.(?:js|css|woff2?|png|jpe?g|webp|svg|ico|webmanifest|mp3)$/i
const LOCAL_SONGS = /^\/songs\//

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then(async (cache) => {
      // One missing file shouldn't fail the whole install, so they go in
      // individually rather than through addAll.
      await Promise.all(
        PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))
      )
      await self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => !KEEP.has(n)).map((n) => caches.delete(n)))
      await self.clients.claim()
    })()
  )
})

/** Network first, cache as the safety net. Used for pages. */
async function networkFirst(request) {
  const cache = await caches.open(SHELL)
  try {
    const fresh = await fetch(request)
    if (fresh && fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    const hit = (await cache.match(request)) ?? (await cache.match('/'))
    if (hit) return hit
    throw new Error('offline and nothing cached')
  }
}

/** Cache first for immutable hashed assets — they never change under a name. */
async function cacheFirst(request) {
  const cache = await caches.open(ASSETS)
  const hit = await cache.match(request)
  if (hit) return hit
  const fresh = await fetch(request)
  if (fresh && fresh.ok) cache.put(request, fresh.clone())
  return fresh
}

/** Serve the copy we have, refresh it in the background. For our own images. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS)
  const hit = await cache.match(request)
  const update = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(request, fresh.clone())
      return fresh
    })
    .catch(() => null)
  return hit ?? (await update) ?? Response.error()
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Local MP3 songs: cache with range request support for streaming
  if (LOCAL_SONGS.test(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Range requests for YouTube/external: never intercept them.
  if (request.headers.has('range')) return

  // YouTube, its CDNs, anything else third party: not ours to store.
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (CACHEABLE.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
