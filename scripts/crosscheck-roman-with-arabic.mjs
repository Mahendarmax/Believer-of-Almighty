import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourcePath = path.resolve(__dirname, '../reports/quran-roman-anomalies-high-confidence.json')
const outPath = path.resolve(__dirname, '../reports/quran-roman-anomalies-arabic-crosscheck.json')

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i += 1) dp[i][0] = i
  for (let j = 0; j <= n; j += 1) dp[0][j] = j

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }

  return dp[m][n]
}

async function fetchVerseWords(surah, ayah) {
  const url = new URL('https://api.quran.com/api/v4/verses/by_key/' + `${surah}:${ayah}`)
  url.searchParams.set('words', 'true')
  url.searchParams.set('word_fields', 'text_uthmani,transliteration')

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${surah}:${ayah}`)
  }

  const json = await res.json()
  const verse = json?.verse
  const words = Array.isArray(verse?.words) ? verse.words : []

  return words
    .filter((w) => w?.char_type_name === 'word')
    .map((w) => ({
      arabic: String(w?.text_uthmani || w?.text || ''),
      translit: String(w?.transliteration?.text || ''),
      translitNorm: normalize(String(w?.transliteration?.text || '')),
    }))
}

const sourceRaw = await readFile(sourcePath, 'utf8')
const source = JSON.parse(sourceRaw)
const high = Array.isArray(source?.highConfidence) ? source.highConfidence : []

const tasks = []
for (const item of high) {
  const locs = Array.isArray(item?.locations) ? item.locations : []
  for (const loc of locs) {
    tasks.push({
      surah: Number(loc?.surah || 0),
      ayah: Number(loc?.ayah || 0),
      token: String(item?.token || ''),
      suggestedToken: String(item?.suggestedToken || ''),
      tokenFreq: Number(item?.frequency || 0),
      suggestedFreq: Number(item?.suggestedFrequency || 0),
      localRoman: String(loc?.roman || ''),
    })
  }
}

const uniqueKeys = [...new Set(tasks.map((t) => `${t.surah}:${t.ayah}`))]
const verseCache = new Map()

for (const key of uniqueKeys) {
  const [s, a] = key.split(':').map(Number)
  try {
    const words = await fetchVerseWords(s, a)
    verseCache.set(key, words)
  } catch (e) {
    verseCache.set(key, { error: String(e?.message || e) })
  }
}

const results = []
let confirmed = 0
let inconclusive = 0
let styleVariant = 0
let fetchErrors = 0

for (const task of tasks) {
  const key = `${task.surah}:${task.ayah}`
  const words = verseCache.get(key)

  if (!Array.isArray(words)) {
    fetchErrors += 1
    results.push({
      ...task,
      status: 'fetch_error',
      reason: words?.error || 'Unable to fetch verse data',
    })
    continue
  }

  const tokenNorm = normalize(task.token)
  const suggestedNorm = normalize(task.suggestedToken)
  const verseNormWords = words.map((w) => w.translitNorm).filter(Boolean)

  const tokenExact = verseNormWords.includes(tokenNorm)
  const suggestedExact = verseNormWords.includes(suggestedNorm)

  let tokenMin = Infinity
  let suggestedMin = Infinity
  let closestTokenWord = null
  let closestSuggestedWord = null

  for (const w of words) {
    const wn = w.translitNorm
    if (!wn) continue

    const dt = levenshtein(tokenNorm, wn)
    if (dt < tokenMin) {
      tokenMin = dt
      closestTokenWord = w
    }

    const ds = levenshtein(suggestedNorm, wn)
    if (ds < suggestedMin) {
      suggestedMin = ds
      closestSuggestedWord = w
    }
  }

  let status = 'inconclusive'
  let reason = 'No strong evidence either way from word-level transliteration'

  if (!tokenExact && suggestedExact) {
    status = 'confirmed_likely_error'
    reason = 'Suggested token matches word-level transliteration; original token does not'
    confirmed += 1
  } else if (!tokenExact && !suggestedExact && tokenMin - suggestedMin >= 2) {
    status = 'confirmed_likely_error'
    reason = 'Suggested token is significantly closer to Arabic word transliteration than original'
    confirmed += 1
  } else if (tokenExact && !suggestedExact) {
    status = 'likely_style_variant'
    reason = 'Original token already matches word-level transliteration better than suggested token'
    styleVariant += 1
  } else if (tokenExact && suggestedExact) {
    status = 'likely_style_variant'
    reason = 'Both forms appear compatible with transliteration conventions for this verse'
    styleVariant += 1
  } else {
    inconclusive += 1
  }

  results.push({
    ...task,
    status,
    reason,
    tokenExactInWordTranslit: tokenExact,
    suggestedExactInWordTranslit: suggestedExact,
    tokenMinDistance: Number.isFinite(tokenMin) ? tokenMin : null,
    suggestedMinDistance: Number.isFinite(suggestedMin) ? suggestedMin : null,
    closestForToken: closestTokenWord,
    closestForSuggested: closestSuggestedWord,
    arabicWords: words.map((w) => w.arabic),
    wordTransliteration: words.map((w) => w.translit),
  })
}

await mkdir(path.dirname(outPath), { recursive: true })
await writeFile(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceReport: 'reports/quran-roman-anomalies-high-confidence.json',
      totalChecked: results.length,
      confirmedLikelyErrors: confirmed,
      likelyStyleVariants: styleVariant,
      inconclusive,
      fetchErrors,
      results,
    },
    null,
    2,
  ),
  'utf8',
)

console.log(`Checked ${results.length} candidate locations.`)
console.log(`Confirmed likely errors: ${confirmed}`)
console.log(`Likely style variants: ${styleVariant}`)
console.log(`Inconclusive: ${inconclusive}`)
console.log(`Fetch errors: ${fetchErrors}`)
console.log(`Report: ${outPath}`)

const preview = results
  .filter((r) => r.status === 'confirmed_likely_error')
  .slice(0, 20)

if (preview.length > 0) {
  console.log('Top confirmed examples:')
  for (const r of preview) {
    console.log(`- ${r.surah}:${r.ayah} | ${r.token} -> ${r.suggestedToken}`)
  }
}
