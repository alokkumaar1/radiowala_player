'use client'

import { useEffect, useRef } from 'react'
import { useRadio } from './RadioProvider'

/**
 * The up-next list. Rendered inside the full-screen mobile sheet and as a
 * dropdown on desktop.
 */
export default function QueuePanel({ onPick }: { onPick?: () => void }) {
  const { queue, index, jumpTo, rotation } = useRadio()
  const activeRef = useRef<HTMLButtonElement>(null)

  // Open the list on the song that's playing, not on track 1.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' })
  }, [index])

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-baseline justify-between gap-2 px-1 pb-2">
        <p className="font-mono text-[0.6rem] tracking-[0.18em] text-brass uppercase">
          Up next
        </p>
        <p className="font-mono text-[0.6rem] text-cream-dim/50 tabular-nums">
          {index + 1} / {queue.length} · {rotation?.freq ?? '—'} FM
        </p>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {queue.map((s, i) => {
          const active = i === index
          return (
            <li key={s.slug}>
              <button
                ref={active ? activeRef : undefined}
                onClick={() => {
                  jumpTo(i)
                  onPick?.()
                }}
                aria-current={active ? 'true' : undefined}
                className={`flex w-full items-baseline gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition ${
                  active ? 'bg-brass/12' : 'hover:bg-cream-dim/6'
                }`}
              >
                <span
                  className={`w-5 shrink-0 font-mono text-[0.62rem] tabular-nums ${
                    active ? 'text-brass-bright' : 'text-cream-dim/40'
                  }`}
                >
                  {active ? '▶' : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[0.88rem] ${
                      active ? 'font-medium text-brass-bright' : 'text-cream'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="block truncate text-[0.74rem] text-cream-dim/70">
                    {s.film} · {s.year}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
