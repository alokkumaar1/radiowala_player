'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { rotations } from '@/lib/rotations'
import { useSongCatalog } from '@/lib/songCatalog'
import { useRadio } from './RadioProvider'

const ytMusic = (q: string) =>
  `https://music.youtube.com/search?q=${encodeURIComponent(q)}`
const spotify = (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`

// 57 rows is not a lot, but the index is below the fold on a phone and every
// row costs layout — reveal a screenful at a time as it's scrolled into view.
const PAGE = 15

export default function SongIndex() {
  const { current, playing, playSong } = useRadio()
  const songs = useSongCatalog()
  const [query, setQuery] = useState('')
  const [band, setBand] = useState<string>('all')
  const [shown, setShown] = useState(PAGE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return songs
      .filter((s) => band === 'all' || s.rotation === band)
      .filter(
        (s) =>
          !q ||
          s.title.toLowerCase().includes(q) ||
          s.film.toLowerCase().includes(q) ||
          String(s.year).includes(q)
      )
      .sort((a, b) => a.year - b.year)
  }, [query, band])

  // A new search should start from the top of its own results.
  useEffect(() => setShown(PAGE), [query, band])

  // Infinite scroll, with the button below as the fallback for browsers
  // without IntersectionObserver.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown((n) => n + PAGE)
      },
      { rootMargin: '300px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [filtered.length])

  const visible = filtered.slice(0, shown)
  const more = filtered.length - visible.length

  return (
    <section
      id="songs"
      className="scroll-mt-20 border-t border-brass/12 px-4 py-16 sm:scroll-mt-24 sm:px-5 sm:py-20"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="font-devanagari text-2xl text-cream sm:text-4xl">सारे ग़म के गाने</h2>
        <p className="mt-2 text-[0.84rem] text-cream-dim sm:text-sm">
          Every sad song on the station, oldest first. {songs.length} of them — tap one to play
          it.
        </p>

        {/* controls */}
        <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="relative sm:flex-1 sm:basis-56">
            <span className="sr-only">Search songs</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a song, film, or year…"
              // 16px minimum on mobile, or iOS zooms the page on focus.
              className="w-full rounded-lg border border-cream-dim/18 bg-walnut/35 px-3.5 py-2.5 text-base text-cream placeholder:text-cream-dim/45 focus:border-brass/70 focus:outline-none sm:py-2 sm:text-sm"
            />
          </label>

          {/* Scrolls sideways on a phone rather than stacking into four rows. */}
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <button
              onClick={() => setBand('all')}
              aria-pressed={band === 'all'}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition sm:py-1 ${
                band === 'all'
                  ? 'border-brass bg-brass/15 text-brass-bright'
                  : 'border-cream-dim/18 text-cream-dim hover:border-brass/50'
              }`}
            >
              All
            </button>
            {rotations.map((r) => (
              <button
                key={r.key}
                onClick={() => setBand(r.key)}
                aria-pressed={band === r.key}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition sm:py-1 ${
                  band === r.key
                    ? 'border-brass bg-brass/15 text-brass-bright'
                    : 'border-cream-dim/18 text-cream-dim hover:border-brass/50'
                }`}
              >
                {r.english}
              </button>
            ))}
          </div>
        </div>

        {/* list */}
        <ul className="mt-6 divide-y divide-cream-dim/8">
          {visible.map((s) => {
            const q = `${s.title} ${s.film}`
            const isCurrent = current?.slug === s.slug
            return (
              <li key={s.slug} className="group relative">
                {/* Phone: year gutter + stacked title/film. Desktop: one row. */}
                <div
                  className={`grid grid-cols-[2.5rem_1fr] items-baseline gap-x-2.5 gap-y-1 py-3 transition sm:flex sm:flex-wrap sm:gap-x-3 ${
                    isCurrent ? 'bg-brass/8' : 'hover:bg-brass/4'
                  }`}
                >
                  <span
                    className={`font-mono text-[0.7rem] tabular-nums ${
                      isCurrent ? 'text-brass-bright' : 'text-cream-dim/50'
                    }`}
                  >
                    {isCurrent && playing ? '▶' : s.year}
                  </span>

                  {/* The row itself is the play button; the outbound links sit
                      above it so they stay independently tappable. */}
                  <button
                    onClick={() => playSong(s.slug)}
                    aria-label={`Play ${s.title} from ${s.film}`}
                    className="absolute inset-0 z-0"
                  />

                  <span
                    className={`pointer-events-none z-10 text-[0.95rem] font-medium ${
                      isCurrent ? 'text-brass-bright' : 'text-cream'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="pointer-events-none z-10 col-start-2 text-[0.82rem] text-cream-dim sm:col-auto">
                    {s.film}
                  </span>

                  <span className="z-10 col-start-2 flex shrink-0 gap-3 font-mono text-[0.65rem] sm:col-auto sm:ml-auto">
                    <a
                      href={ytMusic(q)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative text-cream-dim/60 transition hover:text-brass-bright"
                    >
                      YT Music ↗
                    </a>
                    <a
                      href={spotify(q)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative text-cream-dim/60 transition hover:text-brass-bright"
                    >
                      Spotify ↗
                    </a>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>

        {/* load more — the sentinel drives it automatically, the button is the
            no-IntersectionObserver fallback and the keyboard path */}
        {more > 0 && (
          <div ref={sentinelRef} className="mt-6 flex justify-center">
            <button
              onClick={() => setShown((n) => n + PAGE)}
              className="rounded-full border border-cream-dim/20 px-4 py-2 font-mono text-[0.65rem] tracking-wide text-cream-dim uppercase transition hover:border-brass/50 hover:text-brass-bright"
            >
              {more} more
            </button>
          </div>
        )}

        {!filtered.length && (
          <p className="mt-8 text-center text-sm text-cream-dim/70">
            Nothing on that band. Try another search.
          </p>
        )}
      </div>
    </section>
  )
}
