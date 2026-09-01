'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { songs, type RotationKey, type Song } from '@/data/songs'
import { liveRotation, rotationByKey, istClock, type Rotation } from '@/lib/rotations'
import { FATAL_YT_ERRORS, loadYouTubeApi, type YTPlayer } from '@/lib/youtube'
import { useMediaSession } from '@/lib/useMediaSession'
import { useWakeLock } from '@/lib/useWakeLock'
import { loadSession, saveSession } from '@/lib/session'

/**
 * One playback engine, shared. The cabinet player, the mobile bottom bar and
 * the band cards are all views onto this — so expanding the mini player or
 * scrolling away never restarts a song.
 */

interface RadioState {
  rotationKey: RotationKey | null
  rotation: Rotation | null
  queue: Song[]
  index: number
  current: Song | undefined
  playing: boolean
  ready: boolean
  /** True once the listener has started playback at least once this visit. */
  engaged: boolean
  elapsed: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  notice: string | null
  clock: string
  keepAwake: boolean
  wakeLockSupported: boolean
  wakeLockHeld: boolean

  tune(key: RotationKey): void
  play(): void
  pause(): void
  toggle(): void
  next(): void
  prev(): void
  jumpTo(index: number): void
  /** Play a specific song by slug, switching band and queue if needed. */
  playSong(slug: string): void
  seek(to: number): void
  setVolume(v: number): void
  toggleMute(): void
  toggleShuffle(): void
  setKeepAwake(on: boolean): void
}

const Ctx = createContext<RadioState | null>(null)

export function useRadio(): RadioState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRadio must be used inside <RadioProvider>')
  return ctx
}

const bySlug = new Map(songs.map((s) => [s.slug, s]))

const shuffleArr = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Play order for a band: shuffled, or chronological when shuffle is off. */
function orderFor(key: RotationKey, shuffle: boolean): Song[] {
  const pool = songs.filter((s) => s.rotation === key)
  return shuffle ? shuffleArr(pool) : [...pool].sort((a, b) => a.year - b.year)
}

export default function RadioProvider({ children }: { children: React.ReactNode }) {
  // Everything clock- or random-derived starts empty and is filled after mount;
  // rendering it during the static export would guarantee a hydration mismatch.
  const [rotationKey, setRotationKey] = useState<RotationKey | null>(null)
  const [queue, setQueue] = useState<Song[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(70)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [clock, setClock] = useState('')
  const [keepAwake, setKeepAwake] = useState(true)

  const playerRef = useRef<YTPlayer | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const startedRef = useRef(false)
  const bootedRef = useRef(false)
  const skipGuardRef = useRef(0)
  const restoredRef = useRef(false)
  // `new YT.Player()` returns synchronously but its methods are only bound once
  // the iframe handshake completes. Anything that can fire early — the
  // visibilitychange listener, lock-screen buttons, a Bluetooth remote — has to
  // go through api() or it throws "getPlayerState is not a function".
  const readyRef = useRef(false)
  // Position to resume at once the player is live, from a restored session.
  const resumeAtRef = useRef(0)

  const api = useCallback(() => (readyRef.current ? playerRef.current : null), [])

  const current = queue[index]
  const rotation = rotationKey ? rotationByKey(rotationKey) : null

  /* ── restore, or tune to whatever is live in India ───────────────────── */
  useEffect(() => {
    const saved = loadSession()

    if (saved?.volume !== undefined) setVolumeState(saved.volume)
    if (saved?.muted !== undefined) setMuted(saved.muted)
    if (saved?.keepAwake !== undefined) setKeepAwake(saved.keepAwake)
    const wantShuffle = saved?.shuffle ?? true
    setShuffle(wantShuffle)

    const key = saved?.rotation ?? liveRotation().key
    setRotationKey(key)

    // Rebuild the exact saved queue where we can, so "next" still goes where
    // the listener expects after a refresh.
    const restored = saved?.queue?.map((slug) => bySlug.get(slug)).filter((s): s is Song => !!s)
    const pool = restored?.length ? restored : orderFor(key, wantShuffle)
    setQueue(pool)

    const at = Math.min(Math.max(saved?.index ?? 0, 0), Math.max(pool.length - 1, 0))
    setIndex(at)
    resumeAtRef.current = saved?.elapsed ?? 0
    setElapsed(resumeAtRef.current)

    restoredRef.current = true
    setClock(istClock())
    const id = setInterval(() => setClock(istClock()), 30_000)
    return () => clearInterval(id)
  }, [])

  /* ── persist, cheaply ────────────────────────────────────────────────── */
  // Throttled to once a second — the progress ticker fires twice that fast and
  // localStorage writes are synchronous.
  const lastSaveRef = useRef(0)
  useEffect(() => {
    if (!restoredRef.current || !rotationKey || !queue.length) return
    const now = Date.now()
    if (playing && now - lastSaveRef.current < 1000) return
    lastSaveRef.current = now
    saveSession({
      rotation: rotationKey,
      queue: queue.map((s) => s.slug),
      index,
      elapsed,
      volume,
      muted,
      shuffle,
      keepAwake,
    })
  }, [rotationKey, queue, index, elapsed, volume, muted, shuffle, keepAwake, playing])

  // A backgrounded tab can be discarded without warning, so flush on the way out.
  useEffect(() => {
    const flush = () => {
      if (!restoredRef.current || !rotationKey || !queue.length) return
      lastSaveRef.current = 0
      saveSession({
        rotation: rotationKey,
        queue: queue.map((s) => s.slug),
        index,
        elapsed: api()?.getCurrentTime() ?? elapsed,
        volume,
        muted,
        shuffle,
        keepAwake,
      })
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
    }
  }, [rotationKey, queue, index, elapsed, volume, muted, shuffle, keepAwake, api])

  // advance() reads the queue length without depending on it, so its identity
  // stays stable for the IFrame event handlers registered once at boot.
  const queueLenRef = useRef(0)
  useEffect(() => {
    queueLenRef.current = queue.length
  }, [queue.length])

  const advance = useCallback((delta: number) => {
    setIndex((i) => {
      const len = queueLenRef.current
      return len ? (i + delta + len) % len : 0
    })
    resumeAtRef.current = 0
    setElapsed(0)
    setDuration(0)
  }, [])

  /* ── boot the player once the first track is known ───────────────────── */
  // It must be constructed WITH a videoId; building it empty yields an
  // "/embed/?" URL that never completes the handshake, so onReady never fires.
  useEffect(() => {
    if (bootedRef.current) return
    const first = queue[index] ?? queue[0]
    if (!first || !hostRef.current) return
    bootedRef.current = true

    loadYouTubeApi()
      .then((YT) => {
        const host = hostRef.current
        if (!host) return

        playerRef.current = new YT.Player(host, {
          // A 0x0 or display:none iframe is unreliable for playback; the
          // wrapper clips this out of view instead.
          height: '200',
          width: '200',
          videoId: first.youtubeId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            // Without playsinline, iOS yanks playback into its own fullscreen
            // native player the moment you hit play.
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              readyRef.current = true
              e.target.setVolume(volume)
              if (muted) e.target.mute()
              if (resumeAtRef.current > 0) {
                e.target.seekTo(resumeAtRef.current, true)
              }
              setReady(true)
            },
            onStateChange: (e) => {
              const YTS = window.YT!.PlayerState
              if (e.data === YTS.PLAYING) {
                skipGuardRef.current = 0
                setNotice(null)
                setPlaying(true)
                setDuration(e.target.getDuration())
              } else if (e.data === YTS.PAUSED) {
                setPlaying(false)
              } else if (e.data === YTS.ENDED) {
                advance(1)
              }
            },
            onError: (e) => {
              if (!FATAL_YT_ERRORS.has(e.data)) return
              skipGuardRef.current += 1
              // Don't chase a whole broken queue.
              if (skipGuardRef.current > 5) {
                setNotice("Couldn't reach YouTube for these tracks. Try another band.")
                setPlaying(false)
                return
              }
              setNotice('That track is unavailable here — skipping.')
              advance(1)
            },
          },
        })
      })
      .catch(() => setNotice('YouTube playback could not load. Check your connection.'))
    // volume/muted are read once for the initial sync; later changes go through
    // their own setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, index, advance])

  useEffect(
    () => () => {
      readyRef.current = false
      playerRef.current?.destroy()
      playerRef.current = null
    },
    []
  )

  /* ── feed the current track to the player ───────────────────────────── */
  useEffect(() => {
    const p = api()
    if (!p || !current) return
    const startSeconds = resumeAtRef.current > 0 ? resumeAtRef.current : undefined
    resumeAtRef.current = 0
    // Before the first gesture we only cue — autoplay with sound is blocked, and
    // load-then-blocked leaves the player in a confusing state.
    if (startedRef.current) p.loadVideoById({ videoId: current.youtubeId, startSeconds })
    else p.cueVideoById({ videoId: current.youtubeId, startSeconds })
  }, [ready, current, api])

  /* ── progress ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const p = api()
      if (!p) return
      setElapsed(p.getCurrentTime())
      const d = p.getDuration()
      if (d) setDuration(d)
    }, 500)
    return () => clearInterval(id)
  }, [playing, api])

  /* ── transport ───────────────────────────────────────────────────────── */
  const play = useCallback(() => {
    const p = api()
    if (!p) return
    setEngaged(true)
    if (!startedRef.current) {
      startedRef.current = true
      // The first play has to inherit the user gesture. loadVideoById does;
      // cue-then-play does not on mobile Safari.
      const song = queue[index]
      if (song) p.loadVideoById({ videoId: song.youtubeId, startSeconds: elapsed || undefined })
      return
    }
    p.playVideo()
  }, [api, queue, index, elapsed])

  const pause = useCallback(() => api()?.pauseVideo(), [api])

  const toggle = useCallback(() => {
    if (playing) pause()
    else play()
  }, [playing, play, pause])

  const next = useCallback(() => advance(1), [advance])
  const prev = useCallback(() => advance(-1), [advance])

  const jumpTo = useCallback((i: number) => {
    resumeAtRef.current = 0
    setElapsed(0)
    setDuration(0)
    setIndex(i)
  }, [])

  /** Picked from the song index — tune to its band if we're not already there. */
  const playSong = useCallback(
    (slug: string) => {
      const song = bySlug.get(slug)
      if (!song) return

      resumeAtRef.current = 0
      setElapsed(0)
      setDuration(0)
      skipGuardRef.current = 0

      const here = queue.findIndex((s) => s.slug === slug)
      if (here >= 0) {
        setIndex(here)
      } else {
        const q = orderFor(song.rotation, shuffle)
        setRotationKey(song.rotation)
        setQueue(q)
        setIndex(Math.max(q.findIndex((s) => s.slug === slug), 0))
      }

      // Tapping a song is a user gesture, so this is a legal moment to start.
      setEngaged(true)
      const p = api()
      if (p) {
        startedRef.current = true
        p.loadVideoById({ videoId: song.youtubeId })
      }
    },
    [queue, shuffle, api]
  )

  const seek = useCallback(
    (to: number) => {
      api()?.seekTo(to, true)
      setElapsed(to)
    },
    [api]
  )

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v)
      const p = api()
      if (!p) return
      p.setVolume(v)
      // Nudging the slider up off zero should audibly unmute.
      if (v > 0 && muted) {
        p.unMute()
        setMuted(false)
      }
    },
    [api, muted]
  )

  const toggleMute = useCallback(() => {
    const p = api()
    setMuted((m) => {
      if (m) p?.unMute()
      else p?.mute()
      return !m
    })
  }, [api])

  const tune = useCallback(
    (key: RotationKey) => {
      setRotationKey(key)
      setQueue(orderFor(key, shuffle))
      setIndex(0)
      resumeAtRef.current = 0
      setElapsed(0)
      setDuration(0)
      skipGuardRef.current = 0
    },
    [shuffle]
  )

  const toggleShuffle = useCallback(() => {
    setShuffle((on) => {
      const nextOn = !on
      if (rotationKey) {
        // Re-order around whatever is playing, so toggling never cuts the song.
        const keep = queue[index]?.slug
        const reordered = orderFor(rotationKey, nextOn)
        const at = keep ? reordered.findIndex((s) => s.slug === keep) : 0
        setQueue(reordered)
        setIndex(at < 0 ? 0 : at)
      }
      return nextOn
    })
  }, [rotationKey, queue, index])

  /* ── lock screen, headset and Bluetooth controls ─────────────────────── */
  const nowPlaying = useMemo(
    () =>
      current
        ? {
            title: current.title,
            artist: `${current.film} · ${current.year}`,
            album: rotation ? `${rotation.hindi} · ${rotation.freq} FM` : undefined,
          }
        : null,
    [current, rotation]
  )

  const mediaHandlers = useMemo(
    () => ({ play, pause, next, prev, seek }),
    [play, pause, next, prev, seek]
  )

  useMediaSession(nowPlaying, playing, { elapsed, duration }, mediaHandlers)

  const wake = useWakeLock(playing && keepAwake)

  /* ── reconcile after the tab comes back ──────────────────────────────── */
  // Mobile browsers suspend the embed when the phone locks or you leave the
  // tab, often without firing a state change, so trust the player over our own
  // last-known state.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const p = api()
      if (!p) return
      setPlaying(p.getPlayerState() === 1)
      const t = p.getCurrentTime()
      if (Number.isFinite(t)) setElapsed(t)
      const d = p.getDuration()
      if (d) setDuration(d)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [api])

  const value: RadioState = {
    rotationKey,
    rotation,
    queue,
    index,
    current,
    playing,
    ready,
    engaged,
    elapsed,
    duration,
    volume,
    muted,
    shuffle,
    notice,
    clock,
    keepAwake,
    wakeLockSupported: wake.supported,
    wakeLockHeld: wake.held,
    tune,
    play,
    pause,
    toggle,
    next,
    prev,
    jumpTo,
    playSong,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    setKeepAwake,
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* The real iframe. Audio only — kept at a usable size and clipped out of
          view rather than hidden, which browsers treat as inactive. */}
      <div
        aria-hidden
        className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
        style={{ left: -9999, top: 0 }}
      >
        <div ref={hostRef} />
      </div>
    </Ctx.Provider>
  )
}
