// Word-level audio timings for the "follow along" highlight.
//
// everyayah.com (our default audio source) has no timing data, so for reciters
// that quran.com also hosts we fetch their verse audio + word segments and play
// THAT file, so the highlight lines up with the sound. Reciters not listed here
// simply play from everyayah with no word highlight.

// app reciter id → quran.com recitation id
const QDC_RECITER = {
  'ar.abdulsamad': 1,          // Abdul Basit (Mujawwad)
  'ar.abdulbasitmurattal': 2,  // Abdul Basit (Murattal)
  'ar.abdurrahmaansudais': 3,
  'ar.shaatree': 4,
  'ar.hanirifai': 5,
  'ar.husary': 6,
  'ar.alafasy': 7,
  'ar.minshawi': 9,
  'ar.minshawimujawwad': 10,
  'ar.saoodshuraym': 11,
  'ar.husarymuallim': 12,
}

const cache = new Map()

export function hasWordTimings(reciterId) {
  return QDC_RECITER[reciterId] != null
}

// Rows come as [segmentIndex, wordPosition, startMs, endMs] (current API) or the
// older [wordPosition, startMs, endMs]. wordPosition is 1-based.
function normalizeSegments(rows) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 3) continue
    const [word, start, end] = r.length >= 4 ? [r[1], r[2], r[3]] : [r[0], r[1], r[2]]
    if (Number.isFinite(word) && Number.isFinite(start) && Number.isFinite(end) && end > start) {
      out.push({ word, start, end })
    }
  }
  return out
}

// Resolves to { url, segments, wordCount } or null when unavailable.
export function fetchVerseTimings(surahNumber, ayahNumber, reciterId) {
  const rid = QDC_RECITER[reciterId]
  if (!rid) return Promise.resolve(null)
  const key = `${rid}:${surahNumber}:${ayahNumber}`
  if (cache.has(key)) return cache.get(key)

  const p = (async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    try {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?audio=${rid}&words=true&word_fields=text_uthmani`,
        { signal: controller.signal }
      )
      if (!res.ok) return null
      const data = await res.json()
      const v = data?.verse
      const raw = v?.audio?.url
      if (!raw) return null
      const url = /^https?:\/\//.test(raw) ? raw : `https://verses.quran.com/${raw.replace(/^\/+/, '')}`
      const segments = normalizeSegments(v.audio.segments)
      if (segments.length === 0) return null
      const wordCount = (v.words || []).filter(w => w.char_type_name === 'word').length
        || Math.max(...segments.map(s => s.word))
      return { url, segments, wordCount }
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  })()

  cache.set(key, p)
  p.then(r => { if (!r) cache.delete(key) })
  return p
}

// 0-based index of the word being recited at `timeSec`, or -1.
export function activeWordAt(segments, timeSec) {
  if (!segments || segments.length === 0) return -1
  const ms = timeSec * 1000
  for (const s of segments) {
    if (ms >= s.start && ms < s.end) return s.word - 1
  }
  return -1
}
