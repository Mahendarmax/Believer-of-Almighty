import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const reportPath = path.resolve(__dirname, '../reports/quran-roman-anomalies.json')
const outPath = path.resolve(__dirname, '../reports/quran-roman-anomalies-high-confidence.json')

const raw = await readFile(reportPath, 'utf8')
const data = JSON.parse(raw)
const anomalies = Array.isArray(data?.anomalies) ? data.anomalies : []

function isLikelyAttachedChar(token, suggestion) {
  if (!token || !suggestion) return false
  if (token.length !== suggestion.length + 1) return false
  return token.startsWith(suggestion) || token.endsWith(suggestion)
}

function hasEdgeApostrophe(token) {
  return token.startsWith("'") || token.endsWith("'")
}

function isHighConfidence(a) {
  const token = a?.token || ''
  const suggested = a?.suggestedToken || ''
  const freq = Number(a?.frequency || 0)
  const sFreq = Number(a?.suggestedFrequency || 0)

  if (freq > 2 || sFreq < 30) return false

  if (hasEdgeApostrophe(token)) return true
  if (isLikelyAttachedChar(token, suggested)) return true

  return false
}

const filtered = anomalies.filter(isHighConfidence)

await writeFile(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceReport: 'reports/quran-roman-anomalies.json',
      anomaliesFound: anomalies.length,
      highConfidenceCount: filtered.length,
      highConfidence: filtered,
    },
    null,
    2,
  ),
  'utf8',
)

console.log(`High-confidence candidates: ${filtered.length}`)
console.log(`Report: ${outPath}`)
for (const a of filtered.slice(0, 30)) {
  const first = Array.isArray(a.locations) ? a.locations[0] : null
  const loc = first ? `${first.surah}:${first.ayah}` : 'n/a'
  console.log(`- ${loc} | ${a.token} -> ${a.suggestedToken} (freq ${a.frequency} vs ${a.suggestedFrequency})`)
}
