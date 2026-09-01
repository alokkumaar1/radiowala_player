// Generates data/songs.ts from the seed list below.
// Discovers a YouTube ID per song via search, then validates it through oEmbed.
// Run with: npm run songs
//
// Nothing here executes at runtime. If a song can't be verified it is dropped
// from the output and reported, so coverage is always explicit.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'songs.ts')

// rotation keys: udit | sanu | mustafa | raat | purane
// Sad songs only — this station has one mood.
const SEED = [
  // ── कुमार सानू का दर्द — the 90s heartbreak canon ──────────────────────
  ['Ab Tere Bin Jee Lenge Hum', 'Aashiqui', 1990, 'sanu'],
  ['Dheere Dheere Se Meri Zindagi', 'Aashiqui', 1990, 'sanu'],
  ['Main Duniya Bhula Doonga', 'Aashiqui', 1990, 'sanu'],
  ['Nazar Ke Saamne', 'Aashiqui', 1990, 'sanu'],
  ['Ek Sanam Chahiye', 'Aashiqui', 1990, 'sanu'],
  ['Jab Koi Baat Bigad Jaye', 'Jurm', 1990, 'sanu'],
  ['Sochenge Tumhe Pyar Kare Na Kare', 'Deewana', 1992, 'sanu'],
  ['Teri Umeed Tera Intezar', 'Deewana', 1992, 'sanu'],
  ['Mera Dil Bhi Kitna Pagal Hai', 'Saajan', 1991, 'sanu'],
  ['Tumse Milne Ki Tamanna', 'Saajan', 1991, 'sanu'],
  ['Sanam Bewafa', 'Sanam Bewafa', 1991, 'sanu'],
  ['Tere Dar Par Sanam', 'Phir Teri Kahani Yaad Aayi', 1993, 'sanu'],
  ['Is Tarah Aashiqui Ka', 'Imtihan', 1994, 'sanu'],
  ['Ae Kaash Ke Hum', 'Kabhi Haan Kabhi Naa', 1994, 'sanu'],
  ['Aisa Zakhm Diya Hai', 'Akele Hum Akele Tum', 1995, 'sanu'],
  ['Achha Sila Diya', 'Bewafa Sanam', 1995, 'sanu'],
  ['Dil Ne Yeh Kaha Hai Dil Se', 'Dhadkan', 2000, 'sanu'],

  // ── उदित नारायण — longing, the softer ache ────────────────────────────
  ['Papa Kehte Hain', 'Qayamat Se Qayamat Tak', 1988, 'udit'],
  ['Mujhe Neend Na Aaye', 'Dil', 1990, 'udit'],
  ['Jaadu Teri Nazar', 'Darr', 1993, 'udit'],
  ['Tu Mere Samne', 'Darr', 1993, 'udit'],
  ['Tujhe Dekha To Ye Jaana Sanam', 'Dilwale Dulhania Le Jayenge', 1995, 'udit'],
  ['Pardesi Pardesi Jana Nahi', 'Raja Hindustani', 1996, 'udit'],
  ['Do Dil Mil Rahe Hain', 'Pardes', 1997, 'udit'],
  ['Meri Mehbooba', 'Pardes', 1997, 'udit'],
  ['Chand Chhupa Badal Mein', 'Hum Dil De Chuke Sanam', 1999, 'udit'],
  ['Aankhon Ki Gustakhiyan', 'Hum Dil De Chuke Sanam', 1999, 'udit'],
  ['Sunta Hai Mera Khuda', 'Pukar', 2000, 'udit'],
  ['Hum Tumhare Hain Sanam', 'Hum Tumhare Hain Sanam', 2002, 'udit'],
  ['Dil Laga Liya', 'Dil Hai Tumhaara', 2002, 'udit'],
  ['Main Yahaan Hoon', 'Veer-Zaara', 2004, 'udit'],

  // ── मुस्तफ़ा ज़ाहिद — the Awarapan ache ────────────────────────────────
  ['Toh Phir Aao', 'Awarapan', 2007, 'mustafa'],
  ['Tera Mera Rishta', 'Awarapan', 2007, 'mustafa'],
  ['Mahiya', 'Awarapan', 2007, 'mustafa'],
  ['Awarapan Banjaara', 'Awarapan', 2007, 'mustafa'],
  ['Bhula Dena', 'Aashiqui 2', 2013, 'mustafa'],
  ['Zaroorat', 'Ek Villain', 2014, 'mustafa'],

  // ── रात के दो बजे — the heaviest hour ─────────────────────────────────
  ['Tadap Tadap Ke Is Dil Se', 'Hum Dil De Chuke Sanam', 1999, 'raat'],
  ['Woh Lamhe Woh Baatein', 'Zeher', 2005, 'raat'],
  ['Tujhe Bhula Diya', 'Anjaana Anjaani', 2010, 'raat'],
  ['Phir Le Aya Dil', 'Barfi', 2012, 'raat'],
  ['Humdard', 'Ek Villain', 2014, 'raat'],
  ['Judaai', 'Badlapur', 2015, 'raat'],
  ['Hamari Adhuri Kahani', 'Hamari Adhuri Kahani', 2015, 'raat'],
  ['Agar Tum Saath Ho', 'Tamasha', 2015, 'raat'],
  ['Channa Mereya', 'Ae Dil Hai Mushkil', 2016, 'raat'],
  ['Bekhayali', 'Kabir Singh', 2019, 'raat'],

  // ── पुराने ज़ख्म — the older wounds, on request ───────────────────────
  ['Jaane Woh Kaise Log The', 'Pyaasa', 1957, 'purane'],
  ['Chal Ud Ja Re Panchhi', 'Bhabhi', 1957, 'purane'],
  ['Dost Dost Na Raha', 'Sangam', 1964, 'purane'],
  ['Lag Ja Gale', 'Woh Kaun Thi', 1964, 'purane'],
  ['Zindagi Ka Safar', 'Safar', 1970, 'purane'],
  ['Tere Bina Zindagi Se', 'Aandhi', 1975, 'purane'],
  ['Kya Hua Tera Wada', 'Hum Kisise Kum Naheen', 1977, 'purane'],
  ['O Saathi Re', 'Muqaddar Ka Sikandar', 1978, 'purane'],
  ['Chhukar Mere Man Ko', 'Yaarana', 1981, 'purane'],
  ['Chitthi Aayi Hai', 'Naam', 1986, 'purane'],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function searchIds(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
    },
  })
  if (!res.ok) return []
  const html = await res.text()
  const ids = [...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1])
  return [...new Set(ids)]
}

// oEmbed: 200 => the video exists and is publicly viewable. Does not guarantee
// it is embeddable, which the client player handles by skipping on error.
async function verify(id) {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
  )
  if (!res.ok) return null
  const j = await res.json()
  return { ytTitle: j.title, ytAuthor: j.author_name }
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const ok = []
const failed = []

for (const [title, film, year, rotation] of SEED) {
  const query = `${title} ${film} ${year} song`
  let resolved = null
  try {
    const ids = await searchIds(query)
    for (const id of ids.slice(0, 4)) {
      const meta = await verify(id)
      if (meta) {
        resolved = { id, ...meta }
        break
      }
      await sleep(80)
    }
  } catch (err) {
    console.error(`  ! ${title} — ${err.message}`)
  }

  if (resolved) {
    ok.push({ slug: slug(`${title}-${year}`), title, film, year, rotation, youtubeId: resolved.id, ytTitle: resolved.ytTitle })
    console.log(`  ok  ${title} → ${resolved.id}  (${resolved.ytTitle.slice(0, 55)})`)
  } else {
    failed.push({ title, film, year })
    console.log(`  FAIL ${title} — no verifiable id`)
  }
  await sleep(220)
}

const body = `// GENERATED by scripts/build-songs.mjs — do not edit by hand.
// Every youtubeId below was verified against YouTube's oEmbed endpoint.
// Verified ${ok.length}/${SEED.length} seeded songs.

export type RotationKey = 'udit' | 'sanu' | 'mustafa' | 'raat' | 'purane'

export type Song = {
  slug: string
  title: string
  film: string
  year: number
  rotation: RotationKey
  youtubeId: string
}

export const songs: Song[] = ${JSON.stringify(
  ok.map(({ ytTitle, ...s }) => s),
  null,
  2
)}

export const songsByRotation = (key: RotationKey): Song[] =>
  songs.filter((s) => s.rotation === key)
`

await writeFile(OUT, body, 'utf8')

console.log(`\n──────────────────────────────────────────`)
console.log(`verified : ${ok.length}/${SEED.length}`)
console.log(`failed   : ${failed.length}`)
if (failed.length) for (const f of failed) console.log(`   - ${f.title} (${f.film}, ${f.year})`)
for (const key of ['udit', 'sanu', 'mustafa', 'raat', 'purane']) {
  console.log(`${key.padEnd(9)}: ${ok.filter((s) => s.rotation === key).length}`)
}
console.log(`wrote ${OUT}`)
