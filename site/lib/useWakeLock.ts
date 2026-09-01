'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Screen Wake Lock API — keeps the phone from dimming and locking itself while
 * the radio is on.
 *
 * Why this exists: a YouTube embed is stopped by the browser the moment the
 * screen locks or the tab is backgrounded (YouTube reserves true background
 * playback for its own apps). We can't change that from here. What we *can* do
 * is stop the screen turning off in the first place, which is what actually
 * interrupts listening in practice.
 *
 * The browser releases the lock itself whenever the document becomes hidden, so
 * we re-acquire on the way back to visible.
 */

interface WakeLockLike {
  readonly released: boolean
  release(): Promise<void>
  addEventListener(type: 'release', fn: () => void): void
}

export function useWakeLock(wanted: boolean) {
  const sentinelRef = useRef<WakeLockLike | null>(null)
  const [supported, setSupported] = useState(false)
  const [held, setHeld] = useState(false)

  // Feature detection has to wait for mount — `navigator` doesn't exist during
  // the static export's prerender.
  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator)
  }, [])

  const release = useCallback(async () => {
    const s = sentinelRef.current
    sentinelRef.current = null
    setHeld(false)
    if (s && !s.released) await s.release().catch(() => {})
  }, [])

  const acquire = useCallback(async () => {
    // lib.dom types navigator.wakeLock as always present; it isn't on Safari
    // or Firefox, so the runtime check is load-bearing.
    const api = navigator.wakeLock as Navigator['wakeLock'] | undefined
    if (!api || sentinelRef.current) return
    // A hidden document can't hold a lock; requesting throws.
    if (document.visibilityState !== 'visible') return
    try {
      const s: WakeLockLike = await api.request('screen')
      sentinelRef.current = s
      setHeld(true)
      s.addEventListener('release', () => {
        if (sentinelRef.current === s) sentinelRef.current = null
        setHeld(false)
      })
    } catch {
      // Denied (unsupported, low battery, insecure context) — not fatal.
      setHeld(false)
    }
  }, [])

  useEffect(() => {
    if (!supported) return
    if (wanted) void acquire()
    else void release()
  }, [supported, wanted, acquire, release])

  // Re-arm after the OS auto-releases on tab-hide.
  useEffect(() => {
    if (!supported || !wanted) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [supported, wanted, acquire])

  // Never leave a lock behind.
  useEffect(() => () => void release(), [release])

  return { supported, held }
}
