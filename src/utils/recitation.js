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

export function romanToRecited(text) {
  if (!text) return ''
  return text
    // Trailing-glide hint: "hudanw wa" → "hudaw wa", "liqawminy ya" → "liqawmiy ya"
    .replace(/n([wy])\b([ -])(?=[wy])/gi, '$1$2')
    // Plain word-final n before w y m l r: take on that letter
    .replace(/n\b([ -])([wymlr])/gi, (_, sep, next) => `${next.toLowerCase()}${sep}${next}`)
    // Iqlāb: word-final n before b → m
    .replace(/n\b([ -])(b)/gi, 'm$1$2')
}
