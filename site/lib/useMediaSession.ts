'use client'

import { useEffect } from 'react'

/**
 * Media Session API — puts the current song on the phone's lock screen and in
 * the notification shade, with working play / pause / skip buttons, plus the
 * hardware keys on a laptop.
 *
 * The YouTube iframe doesn't publish its own metadata to us, so we publish
 * ours: our title/film/year beat "youtube-nocookie.com" on the lock screen
 * every time.
 */

export interface NowPlaying {
  title: string
  artist: string
  album?: string
}

interface Handlers {
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  seek?: (to: number) => void
}

export function useMediaSession(
  now: NowPlaying | null,
  playing: boolean,
  { elapsed, duration }: { elapsed: number; duration: number },
  handlers: Handlers
) {
  /* ── metadata ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !now) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: now.title,
      artist: now.artist,
      album: now.album ?? 'रेडियो वाला · Radio Wala',
      artwork: [
        { src: '/artwork-512.jpg', sizes: '512x512', type: 'image/jpeg' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
    })
  }, [now])

  /* ── transport state ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [playing])

  /* ── scrubber position ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession?.setPositionState) return
    if (!duration || !Number.isFinite(duration)) return
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(Math.max(elapsed, 0), duration),
        playbackRate: 1,
      })
    } catch {
      // Chrome throws if position > duration during a track change; harmless.
    }
  }, [elapsed, duration])

  /* ── buttons ───────────────────────────────────────────────────────────── */
  // Re-registered whenever a handler identity changes so the lock screen never
  // calls into a stale closure.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession

    const bind: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => handlers.play()],
      ['pause', () => handlers.pause()],
      ['nexttrack', () => handlers.next()],
      ['previoustrack', () => handlers.prev()],
      // Songs aren't stoppable here — stop just pauses.
      ['stop', () => handlers.pause()],
      [
        'seekto',
        handlers.seek
          ? (d) => {
              if (typeof d.seekTime === 'number') handlers.seek!(d.seekTime)
            }
          : null,
      ],
    ]

    for (const [action, fn] of bind) {
      try {
        ms.setActionHandler(action, fn)
      } catch {
        // Unsupported action on this browser — skip it.
      }
    }

    return () => {
      for (const [action] of bind) {
        try {
          ms.setActionHandler(action, null)
        } catch {
          /* ignore */
        }
      }
    }
  }, [handlers])
}
