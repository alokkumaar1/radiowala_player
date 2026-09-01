'use client'

import { useEffect, useState } from 'react'
import { rotations } from '@/lib/rotations'
import { useRadio } from './RadioProvider'
import QueuePanel from './QueuePanel'
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PowerKnob,
  PrevIcon,
  SeekBar,
  ShuffleButton,
  Transport,
  VolumeControl,
  QueueIcon,
} from './controls'

/**
 * The mobile bottom player: a compact bar that docks above the fold once
 * something is queued, expanding into a full-screen sheet on tap.
 *
 * Phones only — on tablets and up the cabinet player on the page is the primary
 * surface and a second one would just be in the way.
 */
export default function MiniPlayer() {
  const { current, playing, toggle, next, prev, ready, elapsed, duration, rotation, tune, notice } =
    useRadio()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'player' | 'queue' | 'bands'>('player')

  // Back button and Escape should close the sheet, not leave the site.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // Don't let the page scroll behind the sheet.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!current) return null

  const progress = duration ? Math.min(elapsed / duration, 1) : 0

  return (
    <>
      {/* ── docked bar ──────────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
        <div
          className="border-t border-brass/25 bg-ink/95 backdrop-blur-md"
          // Clear the iOS home bar.
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* hairline progress, doubles as the "is it playing" tell */}
          <div aria-hidden className="h-0.5 w-full bg-cream-dim/12">
            <div
              className="h-full bg-brass transition-[width] duration-500 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2">
            <button
              onClick={() => {
                setTab('player')
                setOpen(true)
              }}
              aria-label={`Open the full player. Now playing ${current.title}`}
              className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left"
            >
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-walnut text-sm"
              >
                🎵
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.88rem] leading-tight font-medium text-cream">
                  {current.title}
                </span>
                <span className="block truncate text-[0.72rem] text-cream-dim">
                  {current.film} · {current.year}
                </span>
              </span>
            </button>

            <button
              onClick={prev}
              disabled={!ready}
              aria-label="Previous song"
              className="shrink-0 rounded-full p-2.5 text-cream-dim transition active:scale-95 disabled:opacity-30"
            >
              <PrevIcon size={15} />
            </button>
            <button
              onClick={toggle}
              disabled={!ready}
              aria-label={playing ? 'Pause' : 'Play'}
              className="brass-edge grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition active:scale-95 disabled:opacity-40"
            >
              {playing ? <PauseIcon size={17} /> : <PlayIcon size={17} />}
            </button>
            <button
              onClick={next}
              disabled={!ready}
              aria-label="Next song"
              className="shrink-0 rounded-full p-2.5 text-cream-dim transition active:scale-95 disabled:opacity-30"
            >
              <NextIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── full-screen sheet ───────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Player"
          className="fixed inset-0 z-50 flex flex-col bg-ink/98 backdrop-blur-lg sm:hidden"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* handle + close */}
          <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1">
            <span aria-hidden className="h-1 w-10 rounded-full bg-cream-dim/25" />
            <span className="font-mono text-[0.6rem] tracking-[0.18em] text-cream-dim/60 uppercase">
              {rotation?.english ?? ''} · {rotation?.freq ?? '—'} FM
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close the player"
              className="-mr-2 rounded-full p-2.5 text-cream-dim transition active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* tabs */}
          <div className="flex shrink-0 gap-1 px-4 pt-2">
            {(['player', 'queue', 'bands'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`flex-1 rounded-lg border px-3 py-2 font-mono text-[0.62rem] tracking-wide uppercase transition ${
                  tab === t
                    ? 'border-brass/60 bg-brass/10 text-brass-bright'
                    : 'border-cream-dim/15 text-cream-dim/70'
                }`}
              >
                {t === 'player' ? 'Playing' : t === 'queue' ? 'Queue' : 'Bands'}
              </button>
            ))}
          </div>

          {/* ── now playing ─────────────────────────────────────────────── */}
          {tab === 'player' && (
            <div className="flex min-h-0 flex-1 flex-col justify-center px-6 pb-6">
              {/* artwork */}
              <div className="mx-auto w-full max-w-[16rem]">
                <div className="brass-edge rounded-2xl p-[2px] shadow-2xl shadow-black/60">
                  <div className="walnut-panel relative aspect-square overflow-hidden rounded-2xl">
                    <img
                      src="/artwork-512.jpg"
                      alt=""
                      width={512}
                      height={512}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="font-devanagari px-4 text-center text-3xl text-brass-bright drop-shadow-lg">
                        {rotation?.hindi ?? 'रेडियो वाला'}
                      </span>
                    </div>
                    {/* grille strip, so it reads as a speaker not a photo */}
                    <div className="grille absolute inset-x-0 bottom-0 h-8 bg-ink/50" />
                  </div>
                </div>
              </div>

              <div className="mt-7 text-center">
                <h2 className="text-xl leading-snug font-semibold text-balance text-cream">
                  {current.title}
                </h2>
                <p className="mt-1 text-[0.85rem] text-cream-dim">
                  {current.film} · {current.year}
                </p>
                {notice && <p className="mt-2 text-xs text-brass-bright">{notice}</p>}
              </div>

              <div className="mt-6">
                <SeekBar />
              </div>

              <div className="mt-5 flex justify-center">
                <Transport big />
              </div>

              <div className="mt-7 flex items-center justify-between gap-3">
                <ShuffleButton />
                <button
                  onClick={() => setTab('queue')}
                  className="flex items-center gap-2 rounded-full border border-cream-dim/20 px-3 py-2.5 font-mono text-[0.62rem] tracking-wide text-cream-dim/70 uppercase transition active:scale-95"
                >
                  <QueueIcon />
                  Queue
                </button>
              </div>

              <div className="mt-5">
                <VolumeControl />
              </div>
            </div>
          )}

          {/* ── queue ───────────────────────────────────────────────────── */}
          {tab === 'queue' && (
            <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-6">
              <QueuePanel onPick={() => setTab('player')} />
            </div>
          )}

          {/* ── bands ───────────────────────────────────────────────────── */}
          {tab === 'bands' && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
              <ul className="space-y-2">
                {rotations.map((r) => {
                  const active = r.key === rotation?.key
                  return (
                    <li key={r.key}>
                      <button
                        onClick={() => {
                          tune(r.key)
                          setTab('player')
                        }}
                        aria-pressed={active}
                        className={`w-full rounded-xl border p-4 text-left transition active:scale-[0.99] ${
                          active
                            ? 'border-brass/70 bg-brass/8'
                            : 'border-cream-dim/12 bg-walnut/25'
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-devanagari text-xl text-brass-bright">
                            {r.hindi}
                          </span>
                          <span className="font-mono text-[0.62rem] text-cream-dim/60 tabular-nums">
                            {r.freq} FM
                          </span>
                        </div>
                        <p className="mt-1 text-[0.82rem] text-cream">{r.english}</p>
                        <p className="mt-1.5 text-[0.76rem] leading-relaxed text-cream-dim/80">
                          {r.blurb}
                        </p>
                        <p className="mt-2 font-mono text-[0.6rem] text-cream-dim/50">
                          {r.label}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  )
}
