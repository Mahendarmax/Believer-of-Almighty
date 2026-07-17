import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const supportDir = path.resolve(__dirname, '../public/quran-support')
const reportDir = path.resolve(__dirname, '../reports')
const reportPath = path.join(reportDir, 'quran-roman-anomalies.json')

const isJsonFile = (name) => /^\d+\.json$/i.test(name)
const tokenRegex = /[a-z']+/gi

function tokenize(text) {
  const matches = String(text || '').match(tokenRegex) || []
  return matches
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 4)
}

function editDistanceLeq1(a, b) {
  if (a === b) return true
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > 1) return false

  let i = 0
  let j = 0
  let edits = 0

  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i += 1
      j += 1
      continue
    }

    edits += 1
    if (edits > 1) return false

    if (la > lb) {
      i += 1
    } else if (lb > la) {
      j += 1
    } else {
      i += 1
      j += 1
    }
  }

  if (i < la || j < lb) edits += 1
  return edits <= 1
}

const files = (await readdir(supportDir))
  .filter(isJsonFile)
  .sort((a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')))

const tokenFreq = new Map()
const tokenLocations = new Map()
let totalVerses = 0

for (const file of files) {
  const surahNumber = Number(file.replace('.json', ''))
  const raw = await readFile(path.join(supportDir, file), 'utf8')
  const data = JSON.parse(raw)
  const verses = Array.isArray(data?.verses) ? data.verses : []

  for (const verse of verses) {
    totalVerses += 1
    const ayah = Number(verse?.number || 0)
    const roman = String(verse?.roman || '')
    const tokens = tokenize(roman)

    for (const token of tokens) {
      tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1)
      if (!tokenLocations.has(token)) tokenLocations.set(token, [])
      if (tokenLocations.get(token).length < 5) {
        tokenLocations.get(token).push({ surah: surahNumber, ayah, roman })
      }
    }
  }
}

const rareThreshold = 2
const commonThreshold = 8
const maxLen = 24

const allTokens = [...tokenFreq.keys()].filter((t) => t.length <= maxLen)
const rareTokens = allTokens.filter((t) => (tokenFreq.get(t) || 0) <= rareThreshold)
const commonTokens = allTokens.filter((t) => (tokenFreq.get(t) || 0) >= commonThreshold)

const anomalies = []

for (const rare of rareTokens) {
  let best = null

  for (const common of commonTokens) {
    if (Math.abs(rare.length - common.length) > 1) continue
    if (!editDistanceLeq1(rare, common)) continue

    const score = (tokenFreq.get(common) || 0) - (tokenFreq.get(rare) || 0)
    if (!best || score > best.score) {
      best = {
        token: rare,
        frequency: tokenFreq.get(rare) || 0,
        suggestedToken: common,
        suggestedFrequency: tokenFreq.get(common) || 0,
        score,
      }
    }
  }

  if (best) {
    anomalies.push({
      ...best,
      locations: tokenLocations.get(rare) || [],
    })
  }
}

anomalies.sort((a, b) => b.score - a.score)

await mkdir(reportDir, { recursive: true })
await writeFile(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      supportFilesScanned: files.length,
      totalVerses,
      rareThreshold,
      commonThreshold,
      anomaliesFound: anomalies.length,
      anomalies: anomalies.slice(0, 200),
    },
    null,
    2,
  ),
  'utf8',
)

console.log(`Scanned ${files.length} surah files and ${totalVerses} verses.`)
console.log(`Potential anomalies found: ${anomalies.length}`)
console.log(`Report: ${reportPath}`)
if (anomalies.length > 0) {
  console.log('Top 15 candidates:')
  for (const a of anomalies.slice(0, 15)) {
    const first = a.locations[0]
    const loc = first ? `${first.surah}:${first.ayah}` : 'n/a'
    console.log(`- ${a.token} -> ${a.suggestedToken} (freq ${a.frequency} vs ${a.suggestedFrequency}) @ ${loc}`)
  }
}
