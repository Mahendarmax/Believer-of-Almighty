import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const QURAN_SUPPORT_DIR = path.join(ROOT, 'public', 'quran-support')
const TAFSIR_SUPPORT_DIR = path.join(ROOT, 'public', 'tafsir-support')
const PRIMARY_TAFSIR_ID = 169 // Ibn Kathir (Abridged) - English
const SECONDARY_TAFSIR_ID = 16 // Tafsir Muyassar
const MAX_LEN = 2200

const decodeNamed = (text) => text
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")

const decodeNumeric = (text) => text
  .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return _ }
  })
  .replace(/&#(\d+);/g, (_, dec) => {
    try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return _ }
  })

const normalizeTafsirText = (html) => {
  if (!html) return ''
  const noTags = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  const decoded = decodeNumeric(decodeNamed(noTags))
  const collapsed = decoded.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= MAX_LEN) return collapsed
  return `${collapsed.slice(0, MAX_LEN).trimEnd()}...`
}

const isReadableEnglish = (text) => {
  if (!text) return false
  const latinCount = (text.match(/[A-Za-z]/g) || []).length
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length
  return latinCount >= 30 && latinCount >= arabicCount
}

const normalizeLocalTelugu = (value) => {
  const raw = String(value || '').replace(/\s+/g, ' ').trim()
  return raw || 'ఈ ఆయత్‌కు స్థానిక అర్థం అందుబాటులో లేదు.'
}

const fetchJsonWithRetry = async (url, attempts = 4) => {
  let lastError
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Believer-of-Almighty-offline-tafsir-generator/1.0'
        }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      lastError = err
      if (i < attempts) {
        const delayMs = 450 * i
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  throw lastError
}

const toSections = (payload, surah) => (payload?.tafsirs || [])
  .map((item) => {
    const key = String(item?.verse_key || '')
    const [s, v] = key.split(':').map((n) => Number.parseInt(n, 10))
    if (s !== surah || Number.isNaN(v)) return null
    return {
      startVerse: v,
      text: normalizeTafsirText(item?.text || '')
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.startVerse - b.startVerse)

const pickFromSections = (sections, verseNumber) => {
  if (!sections.length) return ''
  let idx = 0
  while (idx + 1 < sections.length && sections[idx + 1].startVerse <= verseNumber) idx += 1
  return sections[idx]?.text || ''
}

const buildOfflineTafsir = async () => {
  await fs.mkdir(TAFSIR_SUPPORT_DIR, { recursive: true })

  let totalVerses = 0
  let missingTafsir = 0

  for (let surah = 1; surah <= 114; surah += 1) {
    const supportPath = path.join(QURAN_SUPPORT_DIR, `${surah}.json`)
    const support = JSON.parse(await fs.readFile(supportPath, 'utf8'))

    const primaryUrl = `https://api.quran.com/api/v4/tafsirs/${PRIMARY_TAFSIR_ID}/by_chapter/${surah}?language=en`
    const secondaryUrl = `https://api.quran.com/api/v4/tafsirs/${SECONDARY_TAFSIR_ID}/by_chapter/${surah}?language=en`

    const [primaryPayload, secondaryPayload] = await Promise.all([
      fetchJsonWithRetry(primaryUrl),
      fetchJsonWithRetry(secondaryUrl)
    ])

    const primarySections = toSections(primaryPayload, surah)
    const secondarySections = toSections(secondaryPayload, surah)

    const verses = (support.verses || []).map((v) => {
      const verseKey = `${surah}:${v.number}`
      const primaryText = pickFromSections(primarySections, v.number)
      const secondaryText = pickFromSections(secondarySections, v.number)
      const usablePrimary = isReadableEnglish(primaryText)
      const usableSecondary = isReadableEnglish(secondaryText)

      let sourceType = 'local-meaning-summary'
      let sourcedText = ''
      if (usablePrimary) {
        sourceType = 'ibn-kathir-section'
        sourcedText = primaryText
      } else if (usableSecondary) {
        sourceType = 'tafsir-muyassar-section'
        sourcedText = secondaryText
      }

      const englishMeaning = String(v.translation || '').trim()
      const tafsirEnglish = sourcedText || `Meaning-based local note: ${englishMeaning}`

      const teluguMeaning = normalizeLocalTelugu(v.telugu)
      const tafsirTelugu = sourcedText
        ? `సరళ తఫ్సీర్ భావం: ${teluguMeaning}`
        : `స్థానిక అర్థ సారాంశం: ${teluguMeaning}`

      totalVerses += 1
      if (!tafsirEnglish) missingTafsir += 1
      return {
        number: v.number,
        verseKey,
        sourceType,
        tafsirEnglish,
        tafsirTelugu
      }
    })

    const out = {
      surahNumber: surah,
      source: {
        primaryTafsirId: PRIMARY_TAFSIR_ID,
        primarySourceName: 'Ibn Kathir (Abridged)',
        secondaryTafsirId: SECONDARY_TAFSIR_ID,
        secondarySourceName: 'Tafsir Muyassar',
        language: 'english',
        endpoint: 'quran.com v4 tafsirs/by_chapter'
      },
      verses
    }

    const outPath = path.join(TAFSIR_SUPPORT_DIR, `${surah}.json`)
    await fs.writeFile(outPath, JSON.stringify(out), 'utf8')
    console.log(`generated surah ${surah} (${verses.length} verses)`)
  }

  console.log(JSON.stringify({ totalVerses, missingTafsir }, null, 2))
}

buildOfflineTafsir().catch((err) => {
  console.error('Failed to generate offline tafsir support:', err)
  process.exitCode = 1
})
