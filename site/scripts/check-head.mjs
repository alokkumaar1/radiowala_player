// One-off head audit for the exported HTML: confirms the PWA / iOS tags Next
// actually emitted, and that every asset they point at exists on disk.
// Run with: node scripts/check-head.mjs
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const out = join(import.meta.dirname, '..', 'out')
const html = readFileSync(join(out, 'index.html'), 'utf8')

const startup = html.match(/<link[^>]*apple-touch-startup-image[^>]*>/g) ?? []
console.log(`apple-touch-startup-image  ${startup.length} link tags`)

let missing = 0
for (const tag of startup) {
  const href = tag.match(/href="([^"]+)"/)?.[1]
  if (!href || !existsSync(join(out, href))) {
    console.log(`  MISSING FILE  ${href}`)
    missing++
  }
}
console.log(`  files on disk: ${startup.length - missing}/${startup.length}`)

const expect = [
  'mobile-web-app-capable',
  'apple-mobile-web-app-capable',
  'apple-mobile-web-app-title',
  'apple-mobile-web-app-status-bar-style',
  'manifest.webmanifest',
  'theme-color',
  'viewport',
  'format-detection',
  'icon-128.png',
  'icon-192.png',
]
for (const needle of expect) {
  const re = new RegExp(`<(?:meta|link)[^>]*${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`)
  const hit = html.match(re)
  console.log(hit ? `  ok        ${needle}` : `  MISSING   ${needle}`)
}

const files = [
  'sw.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'artwork-512.jpg',
  'hero-1024.webp',
  'hero-1920.webp',
]
console.log('\nexported assets')
for (const f of files) {
  console.log(existsSync(join(out, f)) ? `  ok        ${f}` : `  MISSING   ${f}`)
}
