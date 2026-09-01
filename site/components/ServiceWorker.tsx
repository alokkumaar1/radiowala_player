'use client'

import { useEffect } from 'react'

/**
 * Registers the app-shell service worker, and only in a production build — a
 * worker caching /_next/static during `next dev` fights hot reload. Any worker
 * left over from a previous build is torn down in development so the dev server
 * is never served stale chunks.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {})
      return
    }

    // Wait for load so registration never competes with the first paint or the
    // YouTube API fetch for bandwidth.
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Unsupported, blocked by policy, or served over plain http — the site
        // works fine without it.
      })
    }

    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
