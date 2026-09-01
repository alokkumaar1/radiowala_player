// Downscales the 6.5 MB bazaar illustration into web-sized WebP backdrops and
// derives the favicon. The original stays untouched as the theme asset.
// Run with: npm run art

import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const pub = join(here, '..', 'public')

await mkdir(pub, { recursive: true })

const src = join(root, 'images', 'radio-wala-3440x1204.png')
const fallbackSrc = join(root, 'images', 'deluxe-saloon-3440x1204.png')

const { existsSync } = await import('node:fs')
const hero = existsSync(src) ? src : fallbackSrc

const jobs = [
  { out: 'hero-1920.webp', width: 1920, quality: 82 },
  { out: 'hero-1024.webp', width: 1024, quality: 78 },
]

for (const { out, width, quality } of jobs) {
  const info = await sharp(hero).resize({ width }).webp({ quality }).toFile(join(pub, out))
  console.log(`${out.padEnd(16)} ${width}px  ${(info.size / 1024).toFixed(0)} KB`)
}

const iconSrc = existsSync(join(root, 'icons', 'radio-wala-128.png'))
  ? join(root, 'icons', 'radio-wala-128.png')
  : join(root, 'icons', 'deluxe-saloon-128.png')

await sharp(iconSrc).resize(128, 128).png().toFile(join(pub, 'icon-128.png'))
console.log('icon-128.png     128px')

/* ── PWA + lock-screen art ───────────────────────────────────────────────────
   Installed-app icons, and the artwork the phone's lock screen shows next to
   the track title via the Media Session API. Android wants 192/512; the
   maskable variant is padded on an ink field so the launcher can crop it to a
   circle without eating the artwork. */
const pwa = [
  { out: 'icon-192.png', size: 192 },
  { out: 'icon-512.png', size: 512 },
]

for (const { out, size } of pwa) {
  await sharp(iconSrc).resize(size, size, { fit: 'cover' }).png().toFile(join(pub, out))
  console.log(`${out.padEnd(16)} ${size}px`)
}

// Maskable: the icon shrunk to the safe zone (~80%) over solid ink.
const inner = Math.round(512 * 0.78)
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#14100c' },
})
  .composite([
    { input: await sharp(iconSrc).resize(inner, inner, { fit: 'cover' }).png().toBuffer() },
  ])
  .png()
  .toFile(join(pub, 'icon-maskable-512.png'))
console.log('icon-maskable-512.png  512px')

// Square crop of the bazaar art — this is what shows on the lock screen.
await sharp(hero)
  .resize(512, 512, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 0.82 })
  .jpeg({ quality: 84 })
  .toFile(join(pub, 'artwork-512.jpg'))
console.log('artwork-512.jpg  512px  (lock screen)')

/* ── iOS startup images ──────────────────────────────────────────────────────
   Android builds its own splash from the manifest's name, icon and
   background_color. iOS does not — a standalone install flashes a blank screen
   unless an apple-touch-startup-image matches the device's exact pixel size, so
   each one has to be rendered. They're the icon centred on flat ink, which
   compresses to a few KB apiece. Portrait only: the installed app is locked to
   portrait in the manifest. */
const splashes = [
  [1320, 2868], // iPhone 16 Pro Max
  [1206, 2622], // iPhone 16 Pro
  [1290, 2796], // iPhone 14/15 Pro Max, 15/16 Plus
  [1179, 2556], // iPhone 14/15 Pro, 15/16
  [1284, 2778], // iPhone 11 Pro Max, 12/13 Pro Max
  [1170, 2532], // iPhone 12/13/14
  [1125, 2436], // iPhone X/XS, 11 Pro
  [1242, 2688], // iPhone XS Max
  [828, 1792], // iPhone XR, 11
  [750, 1334], // iPhone SE 2/3, 8
  [1536, 2048], // iPad 9.7"
  [1668, 2388], // iPad Pro 11"
  [2048, 2732], // iPad Pro 12.9"
]

for (const [w, h] of splashes) {
  const mark = Math.round(Math.min(w, h) * 0.32)
  await sharp({ create: { width: w, height: h, channels: 4, background: '#14100c' } })
    .composite([
      {
        input: await sharp(iconSrc).resize(mark, mark, { fit: 'cover' }).png().toBuffer(),
        gravity: 'centre',
      },
    ])
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(pub, `splash-${w}x${h}.png`))
}
console.log(`splash-*.png     ${splashes.length} iOS startup images`)

