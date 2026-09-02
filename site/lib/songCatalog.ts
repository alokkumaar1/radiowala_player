'use client'

import { useEffect, useMemo, useState } from 'react'
import { songs as seededSongs, type RotationKey, type Song } from '@/data/songs'

export const CUSTOM_SONGS_KEY = 'radio-wala-custom-songs'

export const ROTATION_KEYS: RotationKey[] = ['udit', 'sanu', 'mustafa', 'raat', 'purane']

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function normalizeYoutubeId(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/i)
  return match ? match[1] : trimmed
}

export function normalizeSong(input: Partial<Song>): Song | null {
  const title = (input.title ?? '').trim()
  const film = (input.film ?? '').trim()
  const year = Number(input.year)
  const rotation = input.rotation
  const youtubeId = normalizeYoutubeId(String(input.youtubeId ?? ''))

  if (!title || !film || !year || !rotation || !youtubeId) return null
  if (!ROTATION_KEYS.includes(rotation as RotationKey)) return null

  return {
    slug: input.slug || `${slugify(title)}-${slugify(film)}-${year}`,
    title,
    film,
    year,
    rotation: rotation as RotationKey,
    youtubeId,
  }
}

export function readCustomSongs(): Song[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CUSTOM_SONGS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((item) => {
      const song = normalizeSong(item as Partial<Song>)
      return song ? [song] : []
    })
  } catch {
    return []
  }
}

export function writeCustomSongs(songs: Song[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CUSTOM_SONGS_KEY, JSON.stringify(songs))
  window.dispatchEvent(new CustomEvent('radio-wala:songs-updated'))
}

export function useSongCatalog(): Song[] {
  const [customSongs, setCustomSongs] = useState<Song[]>([])

  useEffect(() => {
    const sync = () => setCustomSongs(readCustomSongs())
    sync()

    const onUpdate = () => sync()
    window.addEventListener('radio-wala:songs-updated', onUpdate)
    window.addEventListener('storage', onUpdate)

    return () => {
      window.removeEventListener('radio-wala:songs-updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  return useMemo(() => [...seededSongs, ...customSongs], [customSongs])
}
