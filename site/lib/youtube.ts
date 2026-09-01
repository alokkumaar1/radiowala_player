/**
 * Minimal typings for the slice of the YouTube IFrame API this app touches.
 * The full @types/youtube package is more surface than we need.
 */

export type YTPlayerState = -1 | 0 | 1 | 2 | 3 | 5

/** Object form is what lets us resume a track at a saved position. */
export interface YTLoadArgs {
  videoId: string
  startSeconds?: number
}

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  loadVideoById(id: string | YTLoadArgs): void
  cueVideoById(id: string | YTLoadArgs): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  setVolume(volume: number): void
  getVolume(): number
  mute(): void
  unMute(): void
  isMuted(): boolean
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): YTPlayerState
  destroy(): void
}

export interface YTEvent<T = unknown> {
  target: YTPlayer
  data: T
}

interface YTNamespace {
  Player: new (
    el: HTMLElement | string,
    opts: {
      height?: string | number
      width?: string | number
      videoId?: string
      host?: string
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (e: YTEvent) => void
        onStateChange?: (e: YTEvent<YTPlayerState>) => void
        onError?: (e: YTEvent<number>) => void
      }
    }
  ) => YTPlayer
  PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let loader: Promise<YTNamespace> | null = null

/** Loads the IFrame API once and resolves with the global YT namespace. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (loader) return loader

  loader = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }

    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube IFrame API loaded without YT.Player'))
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => reject(new Error('Failed to load the YouTube IFrame API'))
    document.head.appendChild(script)
  })

  return loader
}

/**
 * Errors that mean "this particular video will never play here":
 *   2   — bad video id
 *   5   — HTML5 player cannot play it
 *   100 — removed or private
 *   101 — embedding disallowed by the owner
 *   150 — same as 101, reported differently
 * A verified-but-unembeddable video lands on 101/150, which is exactly the gap
 * oEmbed validation can't close, so the player skips instead of going silent.
 */
export const FATAL_YT_ERRORS = new Set([2, 5, 100, 101, 150])
