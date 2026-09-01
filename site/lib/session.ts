import type { RotationKey } from '@/data/songs'

/**
 * The listening session, persisted so that locking the phone, switching apps or
 * refreshing doesn't lose your place. Only our own state goes in here — no
 * audio, no media, nothing from YouTube.
 */

const KEY = 'radio-wala:session'
const VERSION = 2

// Resuming mid-song is helpful an hour later and strange a week later.
const MAX_RESUME_AGE_MS = 12 * 60 * 60 * 1000

export interface SavedSession {
  v: number
  rotation: RotationKey
  /** Play order, by song slug — preserves a shuffled queue exactly. */
  queue: string[]
  index: number
  elapsed: number
  volume: number
  muted: boolean
  shuffle: boolean
  keepAwake: boolean
  at: number
}

export function loadSession(): Partial<SavedSession> | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SavedSession
    if (s.v !== VERSION) return null

    // Preferences always survive; playback position expires.
    const stale = !s.at || Date.now() - s.at > MAX_RESUME_AGE_MS
    return stale ? { ...s, elapsed: 0 } : s
  } catch {
    return null
  }
}

export function saveSession(s: Omit<SavedSession, 'v' | 'at'>): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, v: VERSION, at: Date.now() }))
  } catch {
    // Private mode / quota — losing the session is survivable.
  }
}
