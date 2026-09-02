import { NextResponse } from 'next/server'
import { deleteStation, listStations, upsertStation } from '@/lib/store'
import { normalizeSong } from '@/lib/songCatalog'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAdmin(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  return cookie.split(';').some((pair) => {
    const [key, value] = pair.split('=')
    return key.trim() === 'radio-wala-admin' && value?.trim() === '1'
  })
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = await listStations()
  const station = list.find((item) => item.id === id || item.slug === id)
  if (!station) {
    return NextResponse.json({ error: 'Station not found.' }, { status: 404 })
  }
  return NextResponse.json(station)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return unauthorized()

  const { id } = await params

  const existing = await listStations()
  const current = existing.find((item) => item.id === id || item.slug === id)
  if (!current) return NextResponse.json({ error: 'Station not found.' }, { status: 404 })

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const next = normalizeSong({
    ...current,
    ...payload,
    title: payload.title ?? current.title,
    film: payload.film ?? current.film,
    year: payload.year ?? current.year,
    rotation: payload.rotation ?? current.rotation,
    youtubeId: payload.youtubeId ?? current.youtubeId,
    active: payload.active ?? current.active,
  })

  if (!next) {
    return NextResponse.json({ error: 'Invalid station payload.' }, { status: 400 })
  }

  const updated = await upsertStation({ ...next, id, updatedAt: new Date().toISOString() })
  return NextResponse.json({ success: true, station: updated })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return unauthorized()

  const { id } = await params
  const removed = await deleteStation(id)
  if (!removed) {
    return NextResponse.json({ error: 'Station not found.' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
