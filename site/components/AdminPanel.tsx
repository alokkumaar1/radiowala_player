'use client'

import { type FormEvent, useState } from 'react'
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

  const customSongs = useSongCatalog().filter(
    (song) => !seededSongs.some((seed) => seed.slug === song.slug)
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const song = normalizeSong({
      ...form,
      year: Number(form.year),
      youtubeId: form.youtubeId,
    })

    if (!song) {
      setStatus('Add a title, film, year, band, and a valid YouTube link or video ID.')
      return
    }

    const existing = JSON.parse(
      typeof window === 'undefined' ? '[]' : window.localStorage.getItem('radio-wala-custom-songs') ?? '[]'
    )

    const cleaned = Array.isArray(existing)
      ? existing.filter((item: any) => {
          const other = normalizeSong(item as any)
          return !(other && (other.slug === song.slug || (other.title === song.title && other.film === song.film && other.year === song.year)))
        })
      : []

    writeCustomSongs([...cleaned, song])
    setForm(initialForm)
    setStatus(`Saved: ${song.title} from ${song.film} is now in the station.`)
  }

  return (
    <section
      id="admin"
      className="scroll-mt-20 border-t border-brass/12 px-4 py-16 sm:scroll-mt-24 sm:px-5 sm:py-20"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="font-devanagari text-2xl text-cream sm:text-4xl">एडमिन पैनल</h2>
        <p className="mt-2 text-[0.84rem] text-cream-dim sm:text-sm">
          Add a new song here. It appears in search, band filters, and the radio queue right away.
        </p>

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
                className="brass-edge inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-110"
              >
                Add song
              </button>

              <span className="font-mono text-[0.62rem] tracking-[0.16em] text-cream-dim uppercase">
                {customSongs.length} custom songs saved
              </span>
            </div>

            {status && <p className="mt-4 text-sm text-brass-bright">{status}</p>}
          </form>

          <div className="rounded-2xl border border-brass/20 bg-walnut/25 p-4 sm:p-5">
            <p className="font-mono text-[0.62rem] tracking-[0.18em] text-cream-dim/70 uppercase">
              Saved songs
            </p>

            {customSongs.length ? (
              <ul className="mt-4 space-y-2.5 text-sm text-cream-dim">
                {customSongs.map((song) => (
                  <li key={song.slug} className="rounded-lg border border-cream-dim/10 bg-ink/30 p-2.5">
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
