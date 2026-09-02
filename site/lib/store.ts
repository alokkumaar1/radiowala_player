import { promises as fs } from 'node:fs'
import path from 'node:path'
import { songs as seededSongs, type RotationKey, type Song } from '@/data/songs'

export type StoredStation = Song & {
  id: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const storagePath = path.join(process.cwd(), 'data', 'stations.json')

const normaliseRotation = (value: unknown): RotationKey | null => {
  if (typeof value !== 'string') return null
  return seededSongs.some((song) => song.rotation === value) || ['udit', 'sanu', 'mustafa', 'raat', 'purane'].includes(value)
    ? (value as RotationKey)
    : null
}

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

export function normalizeSong(input: Partial<Song> & { id?: string; active?: boolean; createdAt?: string; updatedAt?: string }): StoredStation | null {
  const title = (input.title ?? '').trim()
  const film = (input.film ?? '').trim()
  const year = Number(input.year)
  const rotation = normaliseRotation(input.rotation)
  const youtubeId = normalizeYoutubeId(String(input.youtubeId ?? ''))

  if (!title || !film || !year || !rotation || !youtubeId) return null

  const baseSlug = input.slug || `${slugify(title)}-${slugify(film)}-${year}`

  return {
    id: input.id || baseSlug,
    slug: baseSlug,
    title,
    film,
    year,
    rotation,
    youtubeId,
    active: input.active ?? true,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
  }
}

async function ensureStore(): Promise<void> {
  await fs.mkdir(path.dirname(storagePath), { recursive: true })
  try {
    await fs.access(storagePath)
  } catch {
    await fs.writeFile(storagePath, '[]', 'utf8')
  }
}

export async function readStations(): Promise<StoredStation[]> {
  await ensureStore()

  try {
    const raw = await fs.readFile(storagePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((candidate) => normalizeSong(candidate as Partial<Song> & { id?: string; active?: boolean; createdAt?: string; updatedAt?: string }))
      .filter((item): item is StoredStation => Boolean(item))
  } catch {
    return []
  }
}

export async function writeStations(stations: StoredStation[]): Promise<void> {
  await ensureStore()
  await fs.writeFile(storagePath, JSON.stringify(stations, null, 2), 'utf8')
}

export async function listStations(): Promise<StoredStation[]> {
  const stations = await readStations()
  return [...stations].sort((a, b) => a.title.localeCompare(b.title))
}

export async function upsertStation(input: Partial<Song> & { id?: string; active?: boolean; createdAt?: string; updatedAt?: string }): Promise<StoredStation> {
  const next = normalizeSong(input)
  if (!next) {
    throw new Error('Invalid station payload.')
  }

  const existing = await readStations()
  const index = existing.findIndex((station) => station.id === next.id || station.slug === next.slug)

  const merged = index >= 0
    ? {
        ...existing[index],
        ...next,
        updatedAt: new Date().toISOString(),
      }
    : {
        ...next,
        createdAt: next.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

  const nextList = [...existing]
  if (index >= 0) nextList[index] = merged
  else nextList.push(merged)

  await writeStations(nextList)
  return merged
}

export async function deleteStation(idOrSlug: string): Promise<boolean> {
  const all = await readStations()
  const next = all.filter((station) => station.id !== idOrSlug && station.slug !== idOrSlug)
  if (next.length === all.length) return false
  await writeStations(next)
  return true
}

export async function toggleStationStatus(idOrSlug: string, active: boolean): Promise<StoredStation | null> {
  const all = await readStations()
  const index = all.findIndex((station) => station.id === idOrSlug || station.slug === idOrSlug)
  if (index < 0) return null

  const updated = {
    ...all[index],
    active,
    updatedAt: new Date().toISOString(),
  }

  all[index] = updated
  await writeStations(all)
  return updated
}

export function mergeCustomStations(customStations: StoredStation[], seeded: Song[] = seededSongs): Song[] {
  const merged = [...seeded]
  for (const station of customStations) {
    if (!station.active) continue
    const match = merged.find((song) => song.slug === station.slug)
    if (!match) merged.push({
      slug: station.slug,
      title: station.title,
      film: station.film,
      year: station.year,
      rotation: station.rotation,
      youtubeId: station.youtubeId,
    })
  }
  return merged
}
