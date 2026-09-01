import RadioProvider from '@/components/RadioProvider'
import Station from '@/components/Station'
import SongIndex from '@/components/SongIndex'
import LocalPlayer from '@/components/LocalPlayer'
import MiniPlayer from '@/components/MiniPlayer'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { songs } from '@/data/songs'
import { rotations } from '@/lib/rotations'

export default function Home() {
  return (
    <RadioProvider>
      {/* The bottom padding is room for the docked mobile player, so it never
          covers the last line of the footer. */}
      <main className="pb-[4.75rem] sm:pb-0">
        {/* ── nav ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-brass/12 bg-ink/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5">
            <a href="#top" className="flex items-baseline gap-2">
              <span className="font-devanagari text-lg leading-none text-brass-bright sm:text-xl">
                रेडियो वाला
              </span>
              <span className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-cream-dim/60 uppercase sm:inline">
                Radio Wala
              </span>
            </a>

            <div className="flex items-center gap-3.5 font-mono text-[0.64rem] tracking-wide text-cream-dim uppercase sm:gap-5 sm:text-[0.68rem]">
              <a href="#rotations" className="transition hover:text-brass-bright">
                Bands
              </a>
              <a href="#songs" className="transition hover:text-brass-bright">
                Songs
              </a>
              <a
                href="#radio"
                className="brass-edge rounded-full px-3 py-1.5 font-bold text-ink transition hover:brightness-110 sm:py-1"
              >
                Listen
              </a>
            </div>
          </nav>
        </header>

        {/* ── hero ────────────────────────────────────────────────────────── */}
        <section
          id="top"
          className="relative overflow-hidden px-4 pt-12 pb-12 sm:px-5 sm:pt-24 sm:pb-14"
        >
          {/* the bazaar illustration, dimmed right down to atmosphere */}
          <div aria-hidden className="absolute inset-0 -z-20">
            <picture>
              <source media="(min-width: 1024px)" srcSet="/hero-1920.webp" />
              <img
                src="/hero-1024.webp"
                alt=""
                className="h-full w-full object-cover object-center opacity-25"
              />
            </picture>
          </div>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/75 via-ink/88 to-ink"
          />

          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[0.6rem] tracking-[0.22em] text-brass uppercase sm:text-[0.65rem] sm:tracking-[0.28em]">
              सिर्फ़ ग़म के गाने · sad songs only
            </p>

            <h1 className="font-devanagari mt-4 text-[2.75rem] leading-[1.05] text-cream sm:mt-5 sm:text-7xl">
              रेडियो वाला
            </h1>

            <p className="mt-4 text-lg text-balance text-cream-dim sm:text-xl">
              वो आवाज़ जो सीधे दिल तक पहुँचे
            </p>
            <p className="mt-1.5 text-[0.82rem] tracking-wide text-cream-dim/70 sm:text-sm">
              The voice that goes straight to the heart
            </p>

            <div className="mx-auto mt-8 max-w-xl space-y-4 text-left text-[0.9rem] leading-relaxed text-cream-dim sm:mt-9 sm:text-[0.94rem]">
              <p>
                This station plays one thing and one thing only —{' '}
                <span className="text-cream">the sad ones</span>. No party numbers, no wedding
                songs, nothing to dance to.{' '}
                <span className="text-cream">{songs.length} songs</span> across{' '}
                <span className="text-cream">{rotations.length} bands</span>, and every last one
                of them is meant to land somewhere behind your ribs.
              </p>
              <p>
                कुमार सानू का दर्द, उदित नारायण की तड़प, और मुस्तफ़ा ज़ाहिद का{' '}
                <span className="text-cream">तो फिर आओ</span> — the Awarapan ache that never
                really left. पुराने ज़ख्म sits off the dial for when you want Rafi and Kishore
                instead. Which band is on air depends on the hour in India, because 2am asks for
                a different kind of sad than the morning does.
              </p>
            </div>

            <a
              href="#radio"
              className="brass-edge mt-8 inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-bold text-ink shadow-lg shadow-black/40 transition hover:brightness-110 active:scale-95 sm:mt-9 sm:py-3"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5l12 7-12 7z" />
              </svg>
              रेडियो चालू करो
            </a>
          </div>
        </section>

        {/* ── the radio + bands ───────────────────────────────────────────── */}
        <Station />

        {/* ── song index ──────────────────────────────────────────────────── */}
        <SongIndex />

        {/* ── local player ────────────────────────────────────────────────── */}
        <LocalPlayer />

        {/* ── footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-brass/12 bg-walnut/20 px-4 py-12 sm:px-5 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div className="max-w-sm">
                <p className="font-devanagari text-2xl text-brass-bright">रेडियो वाला</p>
                <p className="mt-1 text-sm text-cream">Radio Wala</p>
                <p className="mt-2.5 text-[0.82rem] leading-relaxed text-cream-dim">
                  सिर्फ़ ग़म के गाने. Free, and it stays free — there is nothing to buy here.
                </p>
              </div>

              <div>
                <p className="font-mono text-[0.62rem] tracking-[0.18em] text-cream-dim/55 uppercase">
                  Bands
                </p>
                <ul className="mt-3 space-y-1.5 text-[0.84rem]">
                  {rotations.map((r) => (
                    <li key={r.key}>
                      <a
                        href="#rotations"
                        className="text-cream-dim transition hover:text-brass-bright"
                      >
                        <span className="font-devanagari mr-1.5">{r.hindi}</span>
                        <span className="font-mono text-[0.62rem] opacity-60 tabular-nums">
                          {r.freq}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="max-w-xs">
                <p className="font-mono text-[0.62rem] tracking-[0.18em] text-cream-dim/55 uppercase">
                  Rights
                </p>
                <p className="mt-3 text-[0.78rem] leading-relaxed text-cream-dim/80">
                  Audio plays through YouTube&apos;s embedded player. Nothing is hosted here, and
                  rights holders are paid through YouTube as normal. Song credits are compiled
                  from film soundtrack listings.
                </p>
                <p className="mt-3 text-[0.78rem] leading-relaxed text-cream-dim/80">
                  If you hold rights to something here and want it gone, say so and it goes.
                </p>
              </div>
            </div>

            <p className="mt-12 border-t border-cream-dim/10 pt-6 font-mono text-[0.65rem] text-cream-dim/45">
              रेडियो वाला · sad Hindi songs, on air around the clock · tuned to Asia/Kolkata
            </p>
          </div>
        </footer>
      </main>

      {/* Phone-only docked transport. Inside the provider, so it drives the same
          session as the cabinet rather than a second one. */}
      <MiniPlayer />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </RadioProvider>
  )
}
