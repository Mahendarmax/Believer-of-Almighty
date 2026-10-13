// HadeethEnc (hadeethenc.com) — Encyclopedia of Translated Prophetic Hadiths.
// Authentic hadiths from Bukhari, Muslim, Abu Dawud, Tirmidhi etc. with
// translation + explanation in 70+ languages, including Telugu ('te').
// Free, no key, CORS-enabled. Responses are cached in memory for the session.

const BASE = 'https://hadeethenc.com/api/v1'
const cache = new Map()

function getJson(url) {
  if (cache.has(url)) return cache.get(url)
  const p = fetch(url).then(res => {
    if (!res.ok) throw new Error(`HadeethEnc ${res.status}`)
    return res.json()
  })
  cache.set(url, p)
  p.catch(() => cache.delete(url))
  return p
}

// [{ id, title, hadeeths_count, parent_id }] — top-level topics
export const fetchHadithRoots = (lang) =>
  getJson(`${BASE}/categories/roots/?language=${lang}`)

// Every category incl. sub-topics; filter by parent_id to build the tree
export const fetchHadithCategories = (lang) =>
  getJson(`${BASE}/categories/list/?language=${lang}`)

// { data: [{ id, title }], meta: { current_page, last_page, total_items } }
export const fetchHadithList = (lang, categoryId, page = 1, perPage = 20) =>
  getJson(`${BASE}/hadeeths/list/?language=${lang}&category_id=${categoryId}&page=${page}&per_page=${perPage}`)

// Full hadith: title, hadeeth, hadeeth_intro, attribution, grade, explanation,
// hints[], hadeeth_ar, hadeeth_intro_ar, categories[], translations[]
export const fetchHadith = (lang, id) =>
  getJson(`${BASE}/hadeeths/one/?language=${lang}&id=${id}`)
