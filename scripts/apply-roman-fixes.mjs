// Apply fixRomanText to the `roman` field of every public/quran-support/N.json
// in place. Telugu and English fields are left untouched.
//
// Run diff-roman-fixes.mjs first for a dry-run preview, and review `git diff`
// afterwards so manual JSON corrections are not lost (see CLAUDE.md).
//
//   node scripts/apply-roman-fixes.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fixRomanText } from '../src/data/quranData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const supportDir = path.resolve(__dirname, '../public/quran-support')

const isJsonFile = (name) => /^\d+\.json$/i.test(name)

const files = (await readdir(supportDir))
  .filter(isJsonFile)
  .sort((a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')))

let changedVerses = 0
let changedFiles = 0

for (const file of files) {
  const filePath = path.join(supportDir, file)
  const data = JSON.parse(await readFile(filePath, 'utf8'))
  const verses = Array.isArray(data?.verses) ? data.verses : []
  let fileChanged = false

  for (const verse of verses) {
    const original = String(verse?.roman || '')
    const corrected = fixRomanText(original)
    if (original !== corrected) {
      console.log(`- ${data.surahNumber}:${verse.number}`)
      console.log(`  from: ${original}`)
      console.log(`  to:   ${corrected}`)
      verse.roman = corrected
      changedVerses += 1
      fileChanged = true
    }
  }

  if (fileChanged) {
    // Same compact format generate-quran-support.mjs writes
    await writeFile(filePath, JSON.stringify(data), 'utf8')
    changedFiles += 1
  }
}

console.log(`Updated ${changedVerses} verses across ${changedFiles} files.`)
