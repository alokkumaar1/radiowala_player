// Checks that every shipped youtubeId is actually EMBEDDABLE, not just that the
// video exists. oEmbed (used by build-songs.mjs) returns 200 for videos whose
// owners have disabled embedding, which would surface as IFrame error 101/150
// at runtime. This closes that gap.
//
// Run with: node scripts/check-embeddable.mjs

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const src = await readFile(join(here, '..', 'data', 'songs.ts'), 'utf8')

const entries = [...src.matchAll(/"title":\s*"([^"]+)"[\s\S]*?"youtubeId":\s*"([A-Za-z0-9_-]{11})"/g)].map(
  (m) => ({ title: m[1], id: m[2] })
)

console.log(`checking ${entries.length} ids for embeddability…\n`)

const bad = []
const good = []

for (const { title, id } of entries) {
  let verdict = 'unknown'
  try {
    const res = await fetch(`https://www.youtube-nocookie.com/embed/${id}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      },
    })
    const html = await res.text()
    if (!res.ok) verdict = `http ${res.status}`
    // The embed page ships a playabilityStatus; UNPLAYABLE / ERROR means no.
    else if (/"status":"(UNPLAYABLE|ERROR|LOGIN_REQUIRED)"/.test(html)) verdict = 'unplayable'
    else if (/playableInEmbed"?:\s*false/.test(html)) verdict = 'embedding disabled'
    else verdict = 'ok'
  } catch (err) {
    verdict = `fetch failed: ${err.message}`
  }

  if (verdict === 'ok') {
    good.push(id)
  } else {
    bad.push({ title, id, verdict })
    console.log(`  BAD  ${title} (${id}) — ${verdict}`)
  }
  await new Promise((r) => setTimeout(r, 120))
}

console.log(`\n──────────────────────────────────────────`)
console.log(`embeddable   : ${good.length}/${entries.length}`)
console.log(`not playable : ${bad.length}`)
for (const b of bad) console.log(`   - ${b.title} (${b.id}) ${b.verdict}`)
