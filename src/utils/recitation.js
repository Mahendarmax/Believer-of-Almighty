// "As recited" variant of the Roman English transliteration.
//
// The stored roman text shows each word as written in the mushaf. In connected
// recitation a word-final noon-sakinah or tanween changes depending on the next
// word's first letter (tajweed):
//   idghām into w y m l r — hudan wa → hudaw wa, man ya → may ya, min maa → mim maa
//   iqlāb before b        — min ba'di → mim ba'di
// The API already writes most m/l/r/b cases phonetically ("mim ba'di", "mir
// Rabbihim"), but keeps the underlying n before w and y as a trailing-glide
// hint ("hudanw wa", "liqawminy yattaqoon"). All rules apply only across a word
// boundary (space or hyphen), so word-internal n (dunyaa, sinwaan) is untouched.
// Ikhfā and ghunnah have no letter-level representation and are left alone.
//
// The Telugu counterpart (romanToTeluguRecited) applies the same rules on the
// Telugu output; keep the two in sync — scripts/verify-roman-telugu.mjs tests both.

// Private markers wrapped around every letter a rule changed, so the UI can
// colour them. Stripped from the plain-string output.
const HL = '\u0001'
const HE = '\u0002'

function recitedMarked(text) {
  return text
    // Trailing-glide hint: "hudanw wa" → "hudaw wa", "liqawminy ya" → "liqawmiy ya"
    .replace(/n([wy])\b([ -])(?=[wy])/gi, `${HL}$1${HE}$2`)
    // Plain word-final n before w y m l r: take on that letter
    .replace(/n\b([ -])([wymlr])/gi, (_, sep, next) => `${HL}${next.toLowerCase()}${HE}${sep}${next}`)
    // Iqlāb: word-final n before b → m
    .replace(/n\b([ -])(b)/gi, `${HL}m${HE}$1$2`)
}

export function romanToRecited(text) {
  if (!text) return ''
  return recitedMarked(text).replace(/[\u0001\u0002]/g, '')
}

// Split a transliteration line into word / separator tokens. Hyphens count as
// word breaks ("In-yamsaskum" is two Arabic words) so the word index can be
// matched against audio word timings. Each word token gets `idx` (0-based).
export function splitWordTokens(text) {
  if (!text) return []
  let idx = 0
  const out = []
  text.split(/([ -]+)/).forEach((seg, i) => {
    if (i % 2 === 1) out.push({ text: seg, sep: true })
    else if (seg) out.push({ text: seg, sep: false, idx: idx++ })
  })
  return out
}

// Same as splitWordTokens on the recited form, but each word also carries
// `parts`: [{ t, hl }] where hl marks a letter that tajweed changed.
export function romanToRecitedTokens(text) {
  if (!text) return []
  return splitWordTokens(recitedMarked(text)).map(tok => {
    if (tok.sep) return tok
    const parts = []
    tok.text.split(/(\u0001[^\u0002]*\u0002)/).forEach(p => {
      if (!p) return
      if (p[0] === HL) parts.push({ t: p.slice(1, -1), hl: true })
      else parts.push({ t: p, hl: false })
    })
    return { ...tok, text: tok.text.replace(/[\u0001\u0002]/g, ''), parts }
  })
}
