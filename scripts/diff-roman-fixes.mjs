// Word-level view of what fixRomanText would change in public/quran-support/*.json.
// Prints one line per verse: only the tokens that differ, as "old → new".
// Read-only.
//
//   node scripts/diff-roman-fixes.mjs
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fixRomanText } from '../src/data/quranData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const supportDir = path.resolve(__dirname, '../public/quran-support')

const files = (await readdir(supportDir))
  .filter((name) => /^\d+\.json$/i.test(name))
  .sort((a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')))

// Minimal LCS-based token diff; groups adjacent changes into one "old → new" chunk.
function tokenDiff(a, b) {
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const chunks = []
  let i = 0, j = 0, oldBuf = [], newBuf = []
  const flush = () => {
    if (oldBuf.length || newBuf.length) chunks.push(`${oldBuf.join(' ') || '∅'} → ${newBuf.join(' ') || '∅'}`)
    oldBuf = []; newBuf = []
  }
  while (i < n && j < m) {
    if (a[i] === b[j]) { flush(); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) oldBuf.push(a[i++])
    else newBuf.push(b[j++])
  }
  while (i < n) oldBuf.push(a[i++])
  while (j < m) newBuf.push(b[j++])
  flush()
  return chunks
}

const tally = new Map()
let count = 0

for (const file of files) {
  const data = JSON.parse(await readFile(path.join(supportDir, file), 'utf8'))
  for (const verse of data.verses || []) {
    const original = String(verse.roman || '')
    const corrected = fixRomanText(original)
    if (original === corrected) continue
    count++
    const chunks = tokenDiff(original.split(/\s+/), corrected.split(/\s+/))
    for (const c of chunks) tally.set(c, (tally.get(c) || 0) + 1)
    console.log(`${String(data.surahNumber).padStart(3)}:${String(verse.number).padEnd(4)} ${chunks.join('  |  ')}`)
  }
}

console.log(`\n${count} verses change.\n\n=== Distinct changes, most frequent first ===`)
for (const [chunk, n] of [...tally.entries()].sort((x, y) => y[1] - x[1])) {
  console.log(`${String(n).padStart(4)}  ${chunk}`)
}
