'use client'

import { useMemo, useState } from 'react'
import { rotations } from '@/lib/rotations'
import { useRadio } from './RadioProvider'
import QueuePanel from './QueuePanel'
import {
  QueueIcon,
  SeekBar,
  ShuffleButton,
  Transport,
  VolumeControl,
} from './controls'

/**
 * The radio cabinet — the page's centrepiece on tablet and desktop, and the
 * hero instrument on phones (where the docked MiniPlayer handles the day-to-day
 * transport once you've scrolled away).
 */
export default function Player() {
  const {
    rotation,
    rotationKey,
    queue,
    index,
    current,
    playing,
    ready,
    notice,
    clock,
    elapsed,
    duration,
    tune,
    keepAwake,
    setKeepAwake,
    wakeLockSupported,
    wakeLockHeld,
  } = useRadio()

  const [showQueue, setShowQueue] = useState(false)

  const progress = duration ? Math.min(elapsed / duration, 1) : 0
  const ticks = useMemo(() => Array.from({ length: 41 }, (_, i) => i), [])

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* warm light spilling out from behind the cabinet */}
      <div
        aria-hidden
        className="valve-glow absolute -inset-6 -z-10 rounded-[3rem] bg-glow/20 blur-3xl sm:-inset-8"
      />

      <div className="brass-edge rounded-[1.4rem] p-[2px] shadow-2xl shadow-black/70 sm:rounded-[1.75rem]">
        <div className="walnut-panel rounded-[1.3rem] p-4 sm:rounded-[1.6rem] sm:p-7">
          {/* ── top plate ───────────────────────────────────────────────── */}
          <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <span
                className={`on-air-dot h-2.5 w-2.5 shrink-0 rounded-full ${
                  playing ? 'bg-red shadow-[0_0_10px_3px] shadow-red/60' : 'bg-cream-dim/40'
                }`}
              />
              <span className="truncate font-mono text-[0.6rem] tracking-[0.18em] text-cream-dim uppercase sm:text-[0.68rem] sm:tracking-[0.22em]">
                {playing ? 'On Air' : ready ? 'Standby' : 'Warming up'}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {clock && (
                <span className="font-mono text-[0.6rem] text-cream-dim/70 tabular-nums sm:text-[0.68rem]">
                  {clock} IST
                </span>
              )}
              <span className="brass-edge rounded px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-ink tabular-nums sm:px-2 sm:text-[0.68rem]">
                {rotation?.freq ?? '—'} FM
              </span>
            </div>
          </div>

          {/* ── tuning dial ─────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-xl border border-black/40 bg-gradient-to-b from-cream to-cream-dim/70 px-3 pt-3 pb-4 shadow-inner sm:px-4">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-devanagari truncate text-base leading-none text-ink/80 sm:text-lg">
                {rotation?.hindi ?? '—'}
              </span>
              <span className="hidden shrink-0 font-mono text-[0.62rem] tracking-[0.15em] text-ink/50 uppercase sm:inline">
                {rotation?.english ?? ''}
              </span>
            </div>

            {/* frequency ticks */}
            <div aria-hidden className="flex h-6 items-end justify-between gap-px sm:h-7">
              {ticks.map((t) => (
                <span
                  key={t}
                  className={`w-px bg-ink/35 ${
                    t % 10 === 0 ? 'h-6' : t % 5 === 0 ? 'h-4' : 'h-2.5'
                  }`}
                />
              ))}
            </div>

            {/* needle */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-9 bottom-9 w-[3px] rounded-full bg-red shadow-[0_0_8px_2px] shadow-red/50 transition-[left] duration-500 ease-out sm:top-10"
              style={{ left: `calc(0.75rem + ${progress * 100}% - ${progress * 1.5}rem)` }}
            />

            <div className="mt-2">
              <SeekBar onDial />
            </div>
          </div>

          {/* ── now playing ─────────────────────────────────────────────── */}
          <div className="mt-4 min-h-[4rem] sm:mt-5 sm:min-h-[4.25rem]">
            {current ? (
              <>
                <h3 className="text-lg leading-snug font-semibold text-balance text-cream sm:text-2xl">
                  {current.title}
                </h3>
                <p className="mt-1 text-[0.82rem] text-cream-dim sm:text-sm">
                  {current.film} · {current.year}
                </p>
              </>
            ) : (
              <p className="text-sm text-cream-dim">Tuning in…</p>
            )}
            {notice && <p className="mt-2 text-xs text-brass-bright">{notice}</p>}
          </div>

          {/* ── controls ────────────────────────────────────────────────── */}
          {/* Phone: transport centred on its own row. Desktop: one line. */}
          <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex justify-center sm:justify-start">
              <Transport />
            </div>

            {/* eq bars — decorative, so the narrow phone layout drops them */}
            <div aria-hidden className="hidden h-9 items-end gap-1 sm:flex">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-sm bg-gradient-to-t from-brass to-brass-bright ${
                    playing ? 'eq-bar' : ''
                  }`}
                  style={{
                    height: `${[40, 68, 90, 55, 78, 34, 60][i]}%`,
                    animationDelay: `${i * 110}ms`,
                    opacity: playing ? 1 : 0.2,
                  }}
                />
              ))}
            </div>

            <VolumeControl className="sm:ml-auto" />
          </div>

          {/* ── shuffle + queue ─────────────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <ShuffleButton />

            <button
              onClick={() => setShowQueue((v) => !v)}
              aria-expanded={showQueue}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[0.62rem] tracking-wide uppercase transition active:scale-95 ${
                showQueue
                  ? 'border-brass/60 bg-brass/10 text-brass-bright'
                  : 'border-cream-dim/20 text-cream-dim/70 hover:border-brass/40'
              }`}
            >
              <QueueIcon />
              Queue
              <span className="tabular-nums opacity-60">
                {queue.length ? `${index + 1}/${queue.length}` : '0'}
              </span>
            </button>
          </div>

          {showQueue && (
            <div className="mt-3 max-h-72 rounded-xl border border-cream-dim/12 bg-ink/40 p-2">
              <QueuePanel />
            </div>
          )}

          {/* ── speaker grille ──────────────────────────────────────────── */}
          <div className="grille mt-5 h-9 rounded-lg border border-black/40 bg-walnut-light/50 sm:mt-6 sm:h-11" />

          <p className="mt-3 text-center font-mono text-[0.58rem] tracking-[0.14em] text-cream-dim/45 uppercase sm:text-[0.6rem] sm:tracking-[0.18em]">
            {queue.length
              ? `${index + 1} / ${queue.length} · ${rotation?.label ?? ''}`
              : 'no tracks on this band'}
          </p>
        </div>
      </div>

      {/* ── keep-awake ────────────────────────────────────────────────────── */}
      {wakeLockSupported && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setKeepAwake(!keepAwake)}
            aria-pressed={keepAwake}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[0.62rem] tracking-wide uppercase transition active:scale-95 ${
              keepAwake
                ? 'border-brass/60 bg-brass/10 text-brass-bright'
                : 'border-cream-dim/20 text-cream-dim/70 hover:border-brass/40'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 00-4 12.7V18a2 2 0 002 2h4a2 2 0 002-2v-3.3A7 7 0 0012 2zm-2 20h4" />
            </svg>
            {keepAwake ? 'Screen stays on' : 'Screen may sleep'}
            {keepAwake && wakeLockHeld && (
              <span className="h-1.5 w-1.5 rounded-full bg-brass-bright" aria-hidden />
            )}
          </button>
        </div>
      )}

      {/* ── station selector ──────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap justify-center gap-2 sm:mt-6">
        {rotations.map((r) => {
          const active = r.key === rotationKey
          return (
            <button
              key={r.key}
              onClick={() => tune(r.key)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-2 text-xs transition active:scale-95 sm:px-3.5 sm:py-1.5 ${
                active
                  ? 'border-brass bg-brass/15 text-brass-bright'
                  : 'border-cream-dim/20 text-cream-dim hover:border-brass/50 hover:text-cream'
              }`}
            >
              <span className="font-devanagari mr-1.5 text-sm">{r.hindi}</span>
              <span className="font-mono text-[0.62rem] tabular-nums opacity-70">{r.freq}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
