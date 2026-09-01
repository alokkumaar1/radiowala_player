'use client'

import { useState, useRef, useEffect } from 'react'
import { localSongs, getLocalSongPath } from '@/data/localSongs'
import { useWakeLock } from '@/lib/useWakeLock'

export default function LocalPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [keepAwake, setKeepAwake] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { supported: wakeLockSupported, held: wakeLockHeld } = { supported: false, held: false }

  // Try to detect Wake Lock support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      // Wake lock is available
    }
  }, [])

  const current = localSongs[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime / audio.duration)
    }

    const handleEnded = () => {
      setCurrentIndex((i) => (i + 1) % localSongs.length)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const play = () => {
    audioRef.current?.play()
    setIsPlaying(true)
  }

  const pause = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }

  const next = () => {
    setCurrentIndex((i) => (i + 1) % localSongs.length)
  }

  const prev = () => {
    setCurrentIndex((i) => (i - 1 + localSongs.length) % localSongs.length)
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time * audioRef.current.duration
    }
  }

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <section className="border-t border-brass/12 bg-walnut/30 px-4 py-8 sm:px-5 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-devanagari text-2xl text-brass-bright sm:text-3xl">
          Local Player
        </h2>
        <p className="mt-1 text-sm text-cream-dim">{localSongs.length} songs • All from Pehli Pehli Baar Mohabbat Ki Hai</p>

        {/* PWA Installation Info */}
        <div className="mt-4 rounded-lg border border-brass/30 bg-brass/10 p-4">
          <p className="text-sm text-brass-bright font-semibold">💡 For background music playback:</p>
          <p className="mt-1 text-xs text-cream-dim">Install as PWA (Add to Home Screen) → Music will keep playing with screen off</p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Now Playing */}
          <div className="rounded-lg border border-brass/20 bg-ink/60 p-6">
            <p className="text-xs font-mono text-cream-dim/60 uppercase tracking-wide">
              Now Playing
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-cream">{current.title}</h3>
            <p className="mt-1 text-sm text-cream-dim">
              {current.film} · {current.year}
            </p>
          </div>

          {/* Progress */}
          <div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full accent-brass-bright"
            />
            <div className="mt-2 flex justify-between text-xs text-cream-dim">
              <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <span>{formatTime(audioRef.current?.duration || 0)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prev}
                className="rounded-full border border-cream-dim/20 p-3 text-cream-dim transition hover:border-brass/40 hover:text-brass-bright"
                title="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                </svg>
              </button>

              <button
                onClick={isPlaying ? pause : play}
                className="brass-edge flex h-14 w-14 items-center justify-center rounded-full text-ink transition hover:brightness-110"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={next}
                className="rounded-full border border-cream-dim/20 p-3 text-cream-dim transition hover:border-brass/40 hover:text-brass-bright"
                title="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
                </svg>
              </button>
            </div>

            {/* Keep Awake Button */}
            <button
              onClick={() => setKeepAwake(!keepAwake)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[0.62rem] tracking-wide uppercase transition active:scale-95 ${
                keepAwake
                  ? 'border-brass/60 bg-brass/10 text-brass-bright'
                  : 'border-cream-dim/20 text-cream-dim/70 hover:border-brass/40'
              }`}
              title="Keep screen on while playing"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2a7 7 0 00-4 12.7V18a2 2 0 002 2h4a2 2 0 002-2v-3.3A7 7 0 0012 2zm-2 20h4" />
              </svg>
              {keepAwake ? 'Screen stays on' : 'Keep screen on'}
            </button>
          </div>

          {/* Song List */}
          <div className="mt-8">
            <h4 className="mb-3 font-mono text-sm font-semibold text-brass-bright uppercase">
              All {localSongs.length} Songs
            </h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {localSongs.map((song, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      setCurrentIndex(i)
                      setIsPlaying(true)
                    }}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                      i === currentIndex
                        ? 'border-brass/60 bg-brass/10 text-brass-bright'
                        : 'border-cream-dim/12 text-cream-dim hover:border-brass/30'
                    }`}
                  >
                    <span className="font-semibold">{song.title}</span>
                    <p className="text-xs opacity-70">{song.film}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={getLocalSongPath(current.title)} 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)}
        controls={false}
      />
    </section>
  )
}
