'use client'

import { useEffect, useState } from 'react'
import { songs } from '@/data/songs'
import { liveRotation, rotations } from '@/lib/rotations'
import { useRadio } from './RadioProvider'
import Player from './Player'

/**
 * The radio plus the band cards. The engine lives in RadioProvider, so tuning
 * from a card and tuning from the dial are the same action.
 */
export default function Station() {
  const { rotationKey, tune } = useRadio()
  const [liveKey, setLiveKey] = useState<string | null>(null)

  // The live band depends on the visitor's clock, so it can only be resolved
  // after mount without risking a hydration mismatch.
  useEffect(() => {
    const sync = () => setLiveKey(liveRotation().key)
    sync()
    const id = setInterval(sync, 60_000)
    return () => clearInterval(id)
  }, [])

  const counts = new Map(
    rotations.map((r) => [r.key, songs.filter((s) => s.rotation === r.key).length])
  )

  return (
    <>
      <section id="radio" className="scroll-mt-20 px-4 pb-16 sm:scroll-mt-24 sm:px-5 sm:pb-20">
        <Player />

        {/* Straight answer to "will it keep playing on my phone?" — better here,
            beside the player, than buried in a FAQ nobody opens. */}
        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-brass/20 bg-walnut/25 p-4 sm:mt-10 sm:p-5">
          <p className="font-mono text-[0.6rem] tracking-[0.18em] text-brass uppercase">
            फ़ोन पर · on your phone
          </p>
          <ul className="mt-3 space-y-2.5 text-[0.84rem] leading-relaxed text-cream-dim">
            <li>
              <span className="text-cream">स्क्रीन बंद न हो —</span> जब गाना चल रहा हो तो रेडियो
              फ़ोन की स्क्रीन को सोने नहीं देता. Toggle it off any time with{' '}
              <span className="text-cream">Screen stays on</span> under the dial.
            </li>
            <li>
              <span className="text-cream">Lock screen &amp; Bluetooth —</span> the song, the film
              and play / pause / skip show up on your lock screen, in the notification shade, and
              on headset, car and laptop media keys.
            </li>
            <li>
              <span className="text-cream">Wapas aao, wahin se chalega —</span> your band, queue,
              shuffle, volume and position are remembered, so a refresh or a trip to another app
              picks up where you left off.
            </li>
            <li>
              <span className="text-cream">Home screen par lagao —</span> browser menu →{' '}
              <em className="text-cream not-italic">Add to Home screen</em>. फिर ये app की तरह
              खुलेगा.
            </li>
            <li className="border-t border-cream-dim/10 pt-2.5 text-cream-dim/75">
              <span className="text-cream-dim">Honest bit:</span> audio comes from YouTube&apos;s
              player, and YouTube stops embedded playback once the phone truly locks or you leave
              the tab — that&apos;s their rule, not ours, and no website can legitimately get
              around it. So the radio keeps your screen awake instead, and restores your place
              when you come back.
            </li>
          </ul>
        </div>
      </section>

      <section
        id="rotations"
        className="scroll-mt-20 border-t border-brass/12 px-4 py-16 sm:scroll-mt-24 sm:px-5 sm:py-20"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="font-devanagari text-2xl text-cream sm:text-4xl">पाँच बैंड</h2>
          <p className="mt-2 text-[0.84rem] text-cream-dim sm:text-sm">
            Four on the clock, one on request. Every one of them hurts differently.
          </p>

          <div className="mt-7 grid gap-3.5 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {rotations.map((r) => {
              const live = r.key === liveKey
              const tuned = r.key === rotationKey
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    tune(r.key)
                    document.getElementById('radio')?.scrollIntoView({ block: 'center' })
                  }}
                  aria-pressed={tuned}
                  className={`group relative overflow-hidden rounded-xl border p-4 text-left transition active:scale-[0.99] sm:p-5 ${
                    live || tuned
                      ? 'border-brass/70 bg-brass/8 shadow-lg shadow-brass/10'
                      : 'border-cream-dim/12 bg-walnut/25 hover:border-brass/45 hover:bg-walnut/45'
                  }`}
                >
                  {live && (
                    <span className="absolute top-4 right-4 flex items-center gap-1.5">
                      <span className="on-air-dot h-1.5 w-1.5 rounded-full bg-red" />
                      <span className="font-mono text-[0.58rem] tracking-[0.16em] text-red uppercase">
                        live
                      </span>
                    </span>
                  )}

                  <p className="font-devanagari text-xl leading-tight text-brass-bright sm:text-2xl">
                    {r.hindi}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-cream">{r.english}</p>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-cream-dim sm:mt-2.5 sm:text-[0.82rem]">
                    {r.blurb}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-cream-dim/10 pt-3 font-mono text-[0.62rem] text-cream-dim/70">
                    <span className="tabular-nums">{r.label}</span>
                    <span className="tabular-nums">{counts.get(r.key) ?? 0} songs</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
