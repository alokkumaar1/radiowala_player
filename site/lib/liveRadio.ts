'use client'

import { useEffect, useState } from 'react'

export type LiveRadioStatus = {
  url: string
  playing: boolean
  ready: boolean
  error: string | null
  title: string
  artist: string
}

const STORAGE_KEY = 'radio-wala:live-stream-url'
const DEFAULT_TITLE = 'Radio Wala'
const DEFAULT_ARTIST = 'Live station'

export const streamingUrl = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_LIVE_RADIO_STREAM_URL ?? ''
  }

  const fromWindow = (window as typeof window & { __RADIO_STREAM_URL__?: string }).__RADIO_STREAM_URL__
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return (
    fromWindow ??
    process.env.NEXT_PUBLIC_LIVE_RADIO_STREAM_URL ??
    stored ??
    ''
  ).trim()
}

export function setStreamingUrl(url: string) {
  const next = url.trim()
  if (typeof window !== 'undefined') {
    if (next) window.localStorage.setItem(STORAGE_KEY, next)
    else window.localStorage.removeItem(STORAGE_KEY)
  }
  const globalTarget = window as typeof window & { __RADIO_STREAM_URL__?: string }
  globalTarget.__RADIO_STREAM_URL__ = next
}

class PersistentLiveRadioPlayer {
  private static instance: PersistentLiveRadioPlayer | null = null

  static getInstance() {
    if (!PersistentLiveRadioPlayer.instance) {
      PersistentLiveRadioPlayer.instance = new PersistentLiveRadioPlayer()
    }
    return PersistentLiveRadioPlayer.instance
  }

  private audio: HTMLAudioElement | null = null
  private status: LiveRadioStatus = {
    url: '',
    playing: false,
    ready: false,
    error: null,
    title: DEFAULT_TITLE,
    artist: DEFAULT_ARTIST,
  }
  private subscribers = new Set<(state: LiveRadioStatus) => void>()
  private reconnectTimer: number | null = null

  private constructor() {
    if (typeof window === 'undefined') return
    this.ensureAudio()
  }

  subscribe(listener: (state: LiveRadioStatus) => void) {
    this.subscribers.add(listener)
    listener(this.status)
    return () => {
      this.subscribers.delete(listener)
    }
  }

  private emit() {
    for (const listener of this.subscribers) listener(this.status)
  }

  private ensureAudio() {
    if (typeof window === 'undefined') return
    if (this.audio) return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    audio.autoplay = false
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('webkit-playsinline', 'true')
    audio.volume = 0.7

    audio.addEventListener('play', () => {
      this.status = {
        ...this.status,
        playing: true,
        ready: true,
        error: null,
      }
      this.emit()
      this.updateMediaSession(true)
    })

    audio.addEventListener('pause', () => {
      this.status = {
        ...this.status,
        playing: false,
      }
      this.emit()
      this.updateMediaSession(false)
    })

    audio.addEventListener('ended', () => {
      this.status = {
        ...this.status,
        playing: false,
      }
      this.emit()
      this.updateMediaSession(false)
    })

    audio.addEventListener('error', () => {
      this.status = {
        ...this.status,
        ready: false,
        playing: false,
        error: 'Live radio stream could not be loaded. Retrying…',
      }
      this.emit()
      this.scheduleReconnect()
    })

    audio.addEventListener('canplay', () => {
      this.status = {
        ...this.status,
        ready: true,
        error: null,
      }
      this.emit()
    })

    this.audio = audio
    this.updateMediaSession(false)
  }

  private scheduleReconnect() {
    if (typeof window === 'undefined') return
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = window.setTimeout(() => {
      if (!this.status.url) return
      this.audio?.load()
      void this.audio?.play().catch(() => {})
    }, 2500)
  }

  private updateMediaSession(playing: boolean) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.status.title || DEFAULT_TITLE,
      artist: this.status.artist || DEFAULT_ARTIST,
      album: 'Radio Wala',
      artwork: [
        { src: '/artwork-512.jpg', sizes: '512x512', type: 'image/jpeg' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
    })

    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'

    const actions: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => this.play()],
      ['pause', () => this.pause()],
      ['stop', () => this.pause()],
      ['previoustrack', null],
      ['nexttrack', null],
    ]

    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Some browsers do not support every action.
      }
    }
  }

  setVolume(volume: number) {
    this.ensureAudio()
    if (!this.audio) return
    this.audio.volume = Math.min(1, Math.max(0, volume))
  }

  setStreamUrl(url: string) {
    const next = url.trim()
    this.status = {
      ...this.status,
      url: next,
      title: DEFAULT_TITLE,
      artist: DEFAULT_ARTIST,
      error: next ? null : 'No live stream URL configured',
    }
    this.emit()

    this.ensureAudio()
    if (!this.audio || !next) return

    const currentSrc = this.audio.currentSrc || this.audio.src
    const sameSource = currentSrc && decodeURIComponent(currentSrc) === decodeURIComponent(next)
    if (!sameSource) {
      this.audio.src = next
      this.audio.load()
    }
  }

  async play() {
    this.ensureAudio()
    if (!this.audio) return false

    const url = this.status.url || streamingUrl()
    if (!url) {
      this.status = {
        ...this.status,
        error: 'Set NEXT_PUBLIC_LIVE_RADIO_STREAM_URL to a valid radio stream URL.',
      }
      this.emit()
      return false
    }

    this.status = {
      ...this.status,
      url,
      title: DEFAULT_TITLE,
      artist: DEFAULT_ARTIST,
      error: null,
    }

    if (this.audio.src !== url) {
      this.audio.src = url
      this.audio.load()
    }

    try {
      await this.audio.play()
      this.status = {
        ...this.status,
        ready: true,
        playing: true,
      }
      this.emit()
      this.updateMediaSession(true)
      return true
    } catch {
      this.status = {
        ...this.status,
        playing: false,
        error: 'Auto-play was blocked. Tap play again to start the stream.',
      }
      this.emit()
      return false
    }
  }

  pause() {
    this.ensureAudio()
    if (!this.audio) return
    this.audio.pause()
    this.status = {
      ...this.status,
      playing: false,
    }
    this.emit()
    this.updateMediaSession(false)
  }

  stop() {
    this.pause()
  }

  snapshot(): LiveRadioStatus {
    return { ...this.status }
  }
}

export const liveRadio = PersistentLiveRadioPlayer.getInstance()

export function useLiveRadioStatus() {
  const [state, setState] = useState<LiveRadioStatus>(liveRadio.snapshot())

  useEffect(() => {
    return liveRadio.subscribe(setState)
  }, [])

  return state
}
