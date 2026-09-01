'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if iOS
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Hide prompt after app is installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  // Show for Android or if manually triggered
  if (!showPrompt && !isIOS) return null

  if (isIOS) {
    return (
      <div className="border-t border-brass/12 bg-brass/10 px-4 py-4 sm:px-5">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border border-brass/30 bg-ink/60 p-4">
            <p className="mb-2 font-mono text-[0.75rem] tracking-wide text-brass-bright uppercase">
              🎵 For best experience
            </p>
            <p className="text-sm text-cream-dim">
              Add Radio Wala to your home screen for offline access and background music playback:
            </p>
            <ol className="mt-3 space-y-2 text-[0.85rem] text-cream-dim/80">
              <li className="flex gap-2">
                <span className="text-brass-bright">1.</span>
                <span>Tap the share icon (↗️)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brass-bright">2.</span>
                <span>Scroll and tap "Add to Home Screen"</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brass-bright">3.</span>
                <span>Tap "Add" to confirm</span>
              </li>
            </ol>
            <p className="mt-3 text-[0.75rem] text-brass-bright/70">
              Music will keep playing even when you close Safari!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-brass/12 bg-brass/10 px-4 py-4 sm:px-5">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-brass/30 bg-ink/60 p-4">
          <p className="mb-3 font-mono text-[0.75rem] tracking-wide text-brass-bright uppercase">
            🎵 Install for better listening
          </p>
          <p className="mb-3 text-sm text-cream-dim">
            Install Radio Wala as an app for background music playback and offline access:
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              className="brass-edge inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Install App
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="rounded-full border border-cream-dim/20 px-4 py-2 text-sm text-cream-dim transition hover:border-brass/40"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
