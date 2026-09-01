'use client'

import { useRadio } from './RadioProvider'

export const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/* ── icons ─────────────────────────────────────────────────────────────── */

export function PrevIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h2v14H6zM20 5v14L9 12z" />
    </svg>
  )
}

export function NextIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 5h2v14h-2zM4 5l11 7L4 19z" />
    </svg>
  )
}

export function PlayIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5l12 7-12 7z" />
    </svg>
  )
}

export function PauseIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  )
}

export function ShuffleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M21 16v5h-5M14 14l7 7M3 3l7 7" />
    </svg>
  )
}

export function QueueIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h11M4 12h11M4 18h7M18 10v8M18 18a2 2 0 11-2 2" />
    </svg>
  )
}

export function VolumeIcon({ muted, size = 15 }: { muted: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 9h3l5-4v14l-5-4H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      ) : (
        <path
          d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      )}
    </svg>
  )
}

/* ── sliders ───────────────────────────────────────────────────────────────
   The visible track is only 8px tall, which is a cruel thing to ask a thumb to
   hit. So the input is 36px tall and the background is clipped to the content
   box: the bar looks thin, but the whole padded height is draggable. Halved on
   desktop, where a mouse is precise. */
const SLIDER =
  'h-9 w-full cursor-pointer touch-none appearance-none rounded-full bg-clip-content py-3.5 sm:h-5 sm:py-1.5'

/* ── the round brass power knob, reused at three sizes ──────────────────── */
export function PowerKnob({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { playing, ready, current, toggle } = useRadio()

  const box = { sm: 'h-11 w-11', md: 'h-16 w-16', lg: 'h-[4.75rem] w-[4.75rem]' }[size]
  const glyph = { sm: 16, md: 22, lg: 26 }[size]

  return (
    <button
      onClick={toggle}
      disabled={!ready || !current}
      aria-label={playing ? 'Pause the radio' : 'Play the radio'}
      className={`brass-edge relative grid shrink-0 place-items-center rounded-full shadow-lg shadow-black/50 transition hover:brightness-110 active:scale-95 disabled:opacity-40 ${box} ${className}`}
    >
      <span className="absolute inset-1.5 rounded-full bg-walnut/85 shadow-inner" />
      <span className="relative text-brass-bright">
        {playing ? <PauseIcon size={glyph} /> : <PlayIcon size={glyph} />}
      </span>
    </button>
  )
}

/** Prev / play / next, sized for either a thumb or a mouse. */
export function Transport({ big = false }: { big?: boolean }) {
  const { ready, queue, next, prev } = useRadio()
  const disabled = !ready || queue.length < 2

  return (
    <div className={`flex items-center ${big ? 'gap-7' : 'gap-5 sm:gap-3'}`}>
      <button
        onClick={prev}
        disabled={disabled}
        aria-label="Previous song"
        className="rounded-full border border-brass/35 p-3 text-cream-dim transition hover:border-brass hover:text-brass-bright active:scale-95 disabled:opacity-30 sm:p-2.5"
      >
        <PrevIcon size={big ? 18 : 16} />
      </button>

      <PowerKnob size={big ? 'lg' : 'md'} />

      <button
        onClick={next}
        disabled={disabled}
        aria-label="Next song"
        className="rounded-full border border-brass/35 p-3 text-cream-dim transition hover:border-brass hover:text-brass-bright active:scale-95 disabled:opacity-30 sm:p-2.5"
      >
        <NextIcon size={big ? 18 : 16} />
      </button>
    </div>
  )
}

/** Shuffle on/off + a count of what's behind it. */
export function ShuffleButton() {
  const { shuffle, toggleShuffle } = useRadio()
  return (
    <button
      onClick={toggleShuffle}
      aria-pressed={shuffle}
      className={`flex items-center gap-2 rounded-full border px-3 py-2.5 font-mono text-[0.62rem] tracking-wide uppercase transition active:scale-95 sm:py-2 ${
        shuffle
          ? 'border-brass/60 bg-brass/10 text-brass-bright'
          : 'border-cream-dim/20 text-cream-dim/70 hover:border-brass/40'
      }`}
    >
      <ShuffleIcon />
      {shuffle ? 'Shuffle' : 'In order'}
    </button>
  )
}

export function VolumeControl({ className = '' }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = useRadio()
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        aria-pressed={muted}
        className={`shrink-0 rounded p-2.5 transition sm:p-1.5 ${
          muted ? 'text-red' : 'text-cream-dim hover:text-brass-bright'
        }`}
      >
        <VolumeIcon muted={muted} />
      </button>
      <label className="flex min-w-0 flex-1 items-center">
        <span className="sr-only">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className={`${SLIDER} bg-cream-dim/25 accent-brass sm:w-28 sm:flex-none`}
        />
      </label>
    </div>
  )
}

/** Seek bar plus elapsed/remaining. `onDial` styles it for the cream dial face. */
export function SeekBar({ onDial = false }: { onDial?: boolean }) {
  const { elapsed, duration, seek } = useRadio()
  return (
    <>
      <label className="block">
        <span className="sr-only">Seek within the current song</span>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={Math.min(elapsed, duration || 1)}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!duration}
          className={`${SLIDER} disabled:cursor-not-allowed ${
            onDial ? 'bg-ink/25 accent-red' : 'bg-cream-dim/25 accent-brass'
          }`}
        />
      </label>
      <div
        className={`mt-1.5 flex justify-between font-mono text-[0.62rem] tabular-nums ${
          onDial ? 'text-ink/55' : 'text-cream-dim/70'
        }`}
      >
        <span>{fmt(elapsed)}</span>
        <span>{duration ? fmt(duration) : '--:--'}</span>
      </div>
    </>
  )
}
