import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fixRomanText } from '../src/data/quranData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const supportDir = path.resolve(__dirname, '../public/quran-support')
const reportDir = path.resolve(__dirname, '../reports')
const reportPath = path.join(reportDir, 'quran-text-issues.json')

const isJsonFile = (name) => /^\d+\.json$/i.test(name)

const files = (await readdir(supportDir))
  .filter(isJsonFile)
  .sort((a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')))

const issues = []
let totalVerses = 0

for (const file of files) {
  const surahNumber = Number(file.replace('.json', ''))
  const raw = await readFile(path.join(supportDir, file), 'utf8')
  const data = JSON.parse(raw)
  const verses = Array.isArray(data?.verses) ? data.verses : []

  for (const verse of verses) {
    totalVerses += 1
    const original = String(verse?.roman || '')
    const corrected = fixRomanText(original)
    if (original !== corrected) {
      issues.push({
        surah: surahNumber,
        ayah: Number(verse?.number || 0),
        original,
        suggested: corrected,
      })
    }
  }
}

await mkdir(reportDir, { recursive: true })
await writeFile(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      supportFilesScanned: files.length,
      totalVerses,
      issuesFound: issues.length,
      issues,
    },
    null,
    2,
  ),
  'utf8',
)

console.log(`Scanned ${files.length} surah files and ${totalVerses} verses.`)
console.log(`Detected ${issues.length} potential Roman text issues.`)
console.log(`Report: ${reportPath}`)

const previewCount = Math.min(30, issues.length)
if (previewCount > 0) {
  console.log('Preview:')
  for (const issue of issues.slice(0, previewCount)) {
    console.log(`- ${issue.surah}:${issue.ayah}`)
    console.log(`  from: ${issue.original}`)
    console.log(`  to:   ${issue.suggested}`)
  }
}
