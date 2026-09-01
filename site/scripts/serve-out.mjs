// Serves the static export on localhost so the production build can be checked
// the way a browser will actually see it — including the service worker, which
// only registers in a production bundle and needs a secure origin (localhost
// counts). Not part of the site; `next dev` is still the way to develop.
// Run with: npm run serve
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = join(import.meta.dirname, '..', 'out')
const port = Number(process.env.PORT ?? 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

if (!existsSync(root)) {
  console.error('No out/ directory. Run `npm run build` first.')
  process.exit(1)
}

createServer((req, res) => {
  // Strip the query and refuse to climb out of out/.
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  let file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''))

  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`

  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('404')
    return
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    // The worker must never be served from a stale cache, or a shipped fix can
    // never reach a browser that already has the old one.
    'cache-control': file.endsWith('sw.js') ? 'no-cache' : 'no-store',
  })
  createReadStream(file).pipe(res)
}).listen(port, () => console.log(`out/ on http://localhost:${port}`))
