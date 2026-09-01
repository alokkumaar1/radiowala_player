import type { Metadata, Viewport } from 'next'
import { Inter, Rozha_One } from 'next/font/google'
import ServiceWorker from '@/components/ServiceWorker'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const rozha = Rozha_One({
  subsets: ['devanagari', 'latin'],
  weight: '400',
  variable: '--font-rozha',
  display: 'swap',
})

const title = 'Radio Wala — सिर्फ़ ग़म के गाने, playing live'
const description =
  'रेडियो वाला — sad Hindi songs only. Kumar Sanu, Udit Narayan, Mustafa Zahid and the older wounds, on five bands, tuned to the hour it actually is in India.'

/* iOS only shows a launch screen for an installed app if a startup image
   matches the device exactly, so each one is declared by CSS size and pixel
   ratio. [logical width, logical height, DPR] — the file is named in device
   pixels. Portrait only: launching straight into landscape is rare enough that
   thirteen more files aren't worth it, and iOS simply skips the splash when
   nothing matches. */
const startupImage = (
  [
    [440, 956, 3], // iPhone 16 Pro Max
    [402, 874, 3], // iPhone 16 Pro
    [430, 932, 3], // iPhone 14/15 Pro Max, 15/16 Plus
    [393, 852, 3], // iPhone 14/15 Pro, 15/16
    [428, 926, 3], // iPhone 11 Pro Max, 12/13 Pro Max, 14 Plus
    [390, 844, 3], // iPhone 12/13/14
    [375, 812, 3], // iPhone X/XS, 11 Pro
    [414, 896, 3], // iPhone XS Max
    [414, 896, 2], // iPhone XR, 11
    [375, 667, 2], // iPhone SE 2/3, 8
    [768, 1024, 2], // iPad 9.7"
    [834, 1194, 2], // iPad Pro 11"
    [1024, 1366, 2], // iPad Pro 12.9"
  ] as const
).map(([w, h, dpr]) => ({
  url: `/splash-${w * dpr}x${h * dpr}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}))

export const metadata: Metadata = {
  title,
  description,
  applicationName: 'Radio Wala',
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image', title, description },
  icons: {
    icon: '/icon-128.png',
    apple: '/icon-192.png',
  },
  // Lets iOS run the station chrome-less from the home screen, with our own
  // status bar treatment instead of Safari's.
  appleWebApp: {
    capable: true,
    title: 'रेडियो वाला',
    statusBarStyle: 'black-translucent',
    startupImage,
  },
  formatDetection: { telephone: false },
  other: {
    // Next emits the modern, unprefixed `mobile-web-app-capable`. iOS below
    // 15.4 only understands the Apple-prefixed spelling, and an older iPhone is
    // exactly the sort of device that ends up as a bedside radio.
    'apple-mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The dial and the range sliders are small; pinch-zoom stays available.
  maximumScale: 5,
  themeColor: '#14100c',
  // Paint the walnut background into the notch/home-bar area on phones.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${rozha.variable}`}>
      <body className="grain font-sans antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  )
}
