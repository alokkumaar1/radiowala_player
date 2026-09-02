import { NextResponse } from 'next/server'
import { deleteStation, listStations, upsertStation } from '@/lib/store'
import { normalizeSong } from '@/lib/songCatalog'

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get('cookie') || ''
  return cookie.split(';').some((pair) => {
    const [key, value] = pair.split('=')
    return key.trim() === 'radio-wala-admin' && value?.trim() === '1'
  })
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function GET() {
  const stations = await listStations()
  return NextResponse.json(stations)
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return unauthorized()
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid station payload.' }, { status: 400 })
  }

  const normalized = normalizeSong(payload as any)
  if (!normalized) {
    return NextResponse.json({ error: 'Add a valid title, film, year, rotation and YouTube link or video ID.' }, { status: 400 })
  }

  const existing = await listStations()
  const duplicate = existing.find((station) => {
    if (station.slug === normalized.slug) return true
    return station.title === normalized.title && station.film === normalized.film && station.year === normalized.year
  })

  if (duplicate && duplicate.id !== payload.id) {
    return NextResponse.json({ error: 'This station already exists.' }, { status: 409 })
  }

  const station = await upsertStation({
    ...normalized,
    id: payload.id || normalized.slug,
    active: payload.active ?? true,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, station }, { status: 201 })
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) {
    return unauthorized()
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
  }

  const id = typeof payload.id === 'string' ? payload.id : ''
  if (!id) {
    return NextResponse.json({ error: 'Station id is required.' }, { status: 400 })
  }

  const existing = await listStations()
  const station = existing.find((item) => item.id === id || item.slug === id)
  if (!station) {
    return NextResponse.json({ error: 'Station not found.' }, { status: 404 })
  }

  const next = await upsertStation({
    ...station,
    ...payload,
    title: payload.title ?? station.title,
    film: payload.film ?? station.film,
    year: payload.year ?? station.year,
    rotation: payload.rotation ?? station.rotation,
    youtubeId: payload.youtubeId ?? station.youtubeId,
    slug: payload.slug ?? station.slug,
    active: payload.active ?? station.active,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, station: next })
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return unauthorized()
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id') || url.searchParams.get('slug')
  if (!id) {
    return NextResponse.json({ error: 'Station id is required.' }, { status: 400 })
  }

  const removed = await deleteStation(id)
  if (!removed) {
    return NextResponse.json({ error: 'Station not found.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
