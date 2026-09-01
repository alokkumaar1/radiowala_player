import type { MetadataRoute } from 'next'

// The manifest is a route handler under the hood, so a static export needs it
// pinned to build time or `next build` refuses to collect it.
export const dynamic = 'force-static'

/**
 * Installable-app manifest. "Add to Home Screen" gives the station its own
 * launcher icon and a chrome-less window, which is the closest a web player
 * gets to feeling like a real radio in your pocket.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'रेडियो वाला · Radio Wala — सिर्फ़ ग़म के गाने',
    short_name: 'रेडियो वाला',
    description:
      'Sad Hindi songs only. Kumar Sanu, Udit Narayan, Mustafa Zahid and the older wounds, on five bands tuned to the hour in India.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    // Not locked to portrait — turning the phone sideways is a normal thing to
    // do with a player, and the layout handles it.
    orientation: 'any',
    background_color: '#14100c',
    theme_color: '#14100c',
    lang: 'hi-IN',
    categories: ['music', 'entertainment'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
