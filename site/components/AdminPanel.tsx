'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { songs as seededSongs, type RotationKey } from '@/data/songs'
import { normalizeSong, useSongCatalog, writeCustomSongs } from '@/lib/songCatalog'

const initialForm = {
  title: '',
  film: '',
  year: new Date().getFullYear(),
  rotation: 'sanu' as RotationKey,
  youtubeId: '',
}

export default function AdminPanel() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [stations, setStations] = useState<any[]>([])

  useEffect(() => {
    if (typeof document === 'undefined') return
    setIsUnlocked(document.cookie.includes('radio-wala-admin=1'))
  }, [])

  useEffect(() => {
    if (!isUnlocked) return

    const loadStations = async () => {
      try {
        const response = await fetch('/api/stations', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        setStations(Array.isArray(data) ? data : [])
      } catch {
        setStations([])
      }
    }

    loadStations()
  }, [isUnlocked])

  const customSongs = useSongCatalog().filter(
    (song) => !seededSongs.some((seed) => seed.slug === song.slug)
  )

  const unlock = async (event: FormEvent) => {
    event.preventDefault()

    setLoading(true)
    setStatus('Checking admin credentials...')
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Incorrect username or password.')
      }

      setIsUnlocked(true)
      setStatus('Access granted.')
      setError('')
    } catch (caught) {
      setStatus('Incorrect username or password. Only the admin can add songs.')
      setError(caught instanceof Error ? caught.message : 'Access denied.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!isUnlocked) {
      setStatus('Please unlock the admin panel first.')
      setError('Admin access required.')
      return
    }

    const title = form.title.trim().toLowerCase()
    const film = form.film.trim().toLowerCase()
    const year = Number(form.year)

    const duplicate = customSongs.some(
      (song) =>
        song.title.toLowerCase() === title &&
        song.film.toLowerCase() === film &&
        song.year === year
    )

    if (duplicate) {
      setStatus('This song already exists in the station.')
      setError('Duplicate submission blocked.')
      return
    }

    const song = normalizeSong({
      ...form,
      year: Number(form.year),
      youtubeId: form.youtubeId,
    })

    if (!song) {
      setStatus('Add a title, film, year, band, and a valid YouTube link or video ID.')
      setError('Validation failed.')
      return
    }

    setLoading(true)
    setStatus('Saving song...')
    setError('')

    try {
      const response = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to save station.')
      }

      setForm(initialForm)
      setStatus(`Saved: ${song.title} from ${song.film} is now in the station.`)
      setError('')
      writeCustomSongs([])

      const refreshed = await fetch('/api/stations', { cache: 'no-store' })
      if (refreshed.ok) {
        const next = await refreshed.json()
        setStations(Array.isArray(next) ? next : [])
      }
    } catch (caught) {
      setStatus('Unable to save the station right now.')
      setError(caught instanceof Error ? caught.message : 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!isUnlocked) {
    return (
      <section
        id="admin"
        className="scroll-mt-20 border-t border-brass/12 px-4 py-16 sm:scroll-mt-24 sm:px-5 sm:py-20"
      >
        <div className="mx-auto max-w-xl rounded-2xl border border-brass/20 bg-walnut/30 p-5 sm:p-6">
          <h2 className="font-devanagari text-2xl text-cream sm:text-4xl">एडमिन पैनल</h2>
          <p className="mt-2 text-sm text-cream-dim">
            This section is locked to admin access only.
          </p>

          <form onSubmit={unlock} className="mt-5 space-y-4">
            <label className="block text-sm text-cream-dim">
              <span className="mb-1.5 block">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter admin username"
                className="w-full rounded-lg border border-cream-dim/18 bg-ink/40 px-3 py-2.5 text-base text-cream placeholder:text-cream-dim/50 focus:border-brass/70 focus:outline-none"
              />
            </label>

            <label className="block text-sm text-cream-dim">
              <span className="mb-1.5 block">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-lg border border-cream-dim/18 bg-ink/40 px-3 py-2.5 text-base text-cream placeholder:text-cream-dim/50 focus:border-brass/70 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="brass-edge inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-110"
            >
              {loading ? 'Checking...' : 'Unlock admin panel'}
            </button>

            {status && <p className="text-sm text-brass-bright">{status}</p>}
            {error && <p className="text-sm text-red-300">{error}</p>}
          </form>
        </div>
      </section>
    )
  }

  return (
    <section
      id="admin"
      className="scroll-mt-20 border-t border-brass/12 px-4 py-16 sm:scroll-mt-24 sm:px-5 sm:py-20"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-devanagari text-2xl text-cream sm:text-4xl">एडमिन पैनल</h2>
            <p className="mt-2 text-[0.84rem] text-cream-dim sm:text-sm">
              Add a new song here. It appears in search, band filters, and the radio queue right away.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' })
              setIsUnlocked(false)
              setUsername('')
              setPassword('')
              setStatus('Logged out.')
              setError('')
            }}
            className="rounded-full border border-cream-dim/18 px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.14em] text-cream-dim uppercase transition hover:border-brass/50 hover:text-brass-bright"
          >
            Log out
          </button>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-brass/20 bg-walnut/30 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-cream-dim">
                <span className="mb-1.5 block">Song title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Teri Yaad Mein"
                  className="w-full rounded-lg border border-cream-dim/18 bg-ink/40 px-3 py-2.5 text-base text-cream placeholder:text-cream-dim/50 focus:border-brass/70 focus:outline-none"
                />
              </label>

              <label className="block text-sm text-cream-dim">
                <span className="mb-1.5 block">Film</span>
                <input
                  value={form.film}
                  onChange={(event) => setForm((prev) => ({ ...prev, film: event.target.value }))}
                  placeholder="Aashiqui"
                  className="w-full rounded-lg border border-cream-dim/18 bg-ink/40 px-3 py-2.5 text-base text-cream placeholder:text-cream-dim/50 focus:border-brass/70 focus:outline-none"
                />
              </label>

              <label className="block text-sm text-cream-dim">
                <span className="mb-1.5 block">Year</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.year}
                  onChange={(event) => setForm((prev) => ({ ...prev, year: Number(event.target.value) || new Date().getFullYear() }))}
                  className="w-full rounded-lg border border-cream-dim/18 bg-ink/40 px-3 py-2.5 text-base text-cream focus:border-brass/70 focus:outline-none"
                />
              </label>

              <label className="block text-sm text-cream-dim">
                <span className="mb-1.5 block">Band</span>
                <select
                  value={form.rotation}
                  onChange={(event) => setForm((prev) => ({ ...prev, rotation: event.target.value as RotationKey }))}
                  className="w-full rounded-lg border border-cream-dim/18 bg-ink/40 px-3 py-2.5 text-base text-cream focus:border-brass/70 focus:outline-none"
                >
                  <option value="udit">Udit Narayan</option>
                  <option value="sanu">Kumar Sanu</option>
                  <option value="mustafa">Mustafa Zahid</option>
                  <option value="raat">Raat Ke Do Baje</option>
                  <option value="purane">Purane Zakhm</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm text-cream-dim">
              <span className="mb-1.5 block">YouTube link or video ID</span>
              <input
                value={form.youtubeId}
                onChange={(event) => setForm((prev) => ({ ...prev, youtubeId: event.target.value }))}
                placeholder="https://youtu.be/.... or dQw4w9WgXcQ"
                className="w-full rounded-lg border border-cream-dim/18 bg-ink/40 px-3 py-2.5 text-base text-cream placeholder:text-cream-dim/50 focus:border-brass/70 focus:outline-none"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading}
                className="brass-edge inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-110"
              >
                {loading ? 'Saving...' : 'Add song'}
              </button>

              <span className="font-mono text-[0.62rem] tracking-[0.16em] text-cream-dim uppercase">
                {customSongs.length} custom songs saved
              </span>
            </div>

            {status && <p className="mt-4 text-sm text-brass-bright">{status}</p>}
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          </form>

          <div className="rounded-2xl border border-brass/20 bg-walnut/25 p-4 sm:p-5">
            <p className="font-mono text-[0.62rem] tracking-[0.18em] text-cream-dim/70 uppercase">
              Saved songs
            </p>

            {stations.length || customSongs.length ? (
              <ul className="mt-4 space-y-2.5 text-sm text-cream-dim">
                {(stations.length ? stations : customSongs).map((song: any) => (
                  <li key={song.slug || song.id} className="rounded-lg border border-cream-dim/10 bg-ink/30 p-2.5">
                    <p className="font-medium text-cream">{song.title}</p>
                    <p className="mt-0.5 text-[0.76rem] text-cream-dim/80">
                      {song.film} · {song.year} · {song.rotation}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-cream-dim/75">
                No custom songs yet. Add your first one in the form.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
