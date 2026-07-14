import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fixRomanText, stripHtml, surahs } from '../src/data/quranData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outDir = path.resolve(__dirname, '../public/quran-support')

const fetchJson = async (url, retries = 3) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (res.ok) return res.json()
    if (attempt === retries || res.status !== 429) {
      throw new Error(`Failed ${res.status} for ${url}`)
    }
    const retryAfter = Number(res.headers.get('retry-after'))
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 1000 * (attempt + 1)
    await new Promise(resolve => setTimeout(resolve, waitMs))
  }
}

const buildSupportForSurah = async (surahNumber) => {
  const [englishData, romanData, teluguData] = await Promise.all([
    fetchJson(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`),
    fetchJson(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.transliteration`),
    fetchJson(`https://api.quran.com/api/v4/quran/translations/227?chapter_number=${surahNumber}`),
  ])

  const englishAyahs = englishData.code === 200 ? englishData.data?.ayahs || [] : []
  const romanAyahs = romanData.code === 200 ? romanData.data?.ayahs || [] : []
  const teluguAyahs = teluguData?.translations || []

  const englishMap = Object.fromEntries(englishAyahs.map(v => [v.numberInSurah, v.text || '']))
  const romanMap = Object.fromEntries(romanAyahs.map(v => [v.numberInSurah, fixRomanText(v.text?.trim() || '')]))
  const teluguMap = Object.fromEntries(teluguAyahs.map((v, index) => [index + 1, stripHtml(v.text || '')]))

  const verseCount = surahs.find(s => s.number === surahNumber)?.ayahs || Math.max(
    englishAyahs.length,
    romanAyahs.length,
    teluguAyahs.length,
  )

  return {
    surahNumber,
    verses: Array.from({ length: verseCount }, (_, index) => {
      const number = index + 1
      return {
        number,
        roman: romanMap[number] || '',
        telugu: teluguMap[number] || '',
        translation: englishMap[number] || '',
      }
    })
  }
}

await mkdir(outDir, { recursive: true })

for (const surah of surahs) {
  const payload = await buildSupportForSurah(surah.number)
  const filePath = path.join(outDir, `${surah.number}.json`)
  await writeFile(filePath, JSON.stringify(payload), 'utf8')
  console.log(`Generated ${surah.number}.json`)
}
