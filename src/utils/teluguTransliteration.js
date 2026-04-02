// Roman English → Telugu script transliteration for Quranic text
// Converts phonetic Roman text (e.g. "Bismillaahir Rahmaanir Raheem")
// into Telugu script (e.g. "బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్")

const VIRAMA = '\u0C4D' // Telugu halant (్)
const ANUSVARA = '\u0C02' // Telugu anusvara (ం)

// Consonant mappings — longest match first
const CONSONANTS = [
  ['shh', 'ష'], ['sh', 'ష'], ['zh', 'జ'],
  ['kh', 'ఖ'], ['gh', 'ఘ'], ['ch', 'చ'], ['jh', 'జ\u0C4Dహ'],
  ['th', 'థ'], ['dh', 'ధ'], ['ph', 'ఫ'], ['bh', 'బ\u0C4Dహ'],
  ['nh', 'న\u0C4Dహ'],
  ['k', 'క'], ['g', 'గ'], ['c', 'చ'], ['j', 'జ'],
  ['t', 'త'], ['d', 'ద'], ['n', 'న'],
  ['p', 'ప'], ['f', 'ఫ'], ['b', 'బ'], ['m', 'మ'],
  ['y', 'య'], ['r', 'ర'], ['l', 'ల'],
  ['v', 'వ'], ['w', 'వ'],
  ['s', 'స'], ['h', 'హ'], ['z', 'జ'], ['q', 'ఖ'],
  ['x', 'క\u0C4Dస'],
]

// Word-level overrides for cases where automatic transliteration is inaccurate
// (e.g. the API Roman English doesn't fully capture the Arabic phonetics)
const WORD_OVERRIDES = {
  'walmunfiqeena': 'వల్‌మున్ఫిఖీనా',
  // API uses 'z' for Arabic ذ (dhaal) — correct Telugu is ధ not జ
  'allazeena': 'అల్లధీన',
  'allazee': 'అల్లధీ',
  'wallazeena': 'వల్లధీన',
  'lazeena': 'లధీన',
}

// Nasals that use anusvara (ం) before a different consonant in natural Telugu.
// Maps nasal letter → set of following consonants where anusvara is used.
// n before: t, d, th, dh, s, k, j, b, p, f, g, ch, kh, gh, sh
// m before: d, t, th, dh, b, h, p, s, k, j, f, g, ch, kh, gh, sh
// NOT when the same consonant follows (nn→న్న, mm→మ్మ stay halant for geminate)
// NOT for 'nf' — Arabic nun+fa should stay halant న్ఫ (e.g. munfiqeena → మున్ఫిఖీన)
// NOT before 'y' — Telugu uses halant న్య/మ్య not anusvara ంయ (e.g. dunyaa → దున్యా)
const ANUSVARA_N_BEFORE = new Set(['t', 'd', 's', 'k', 'j', 'b', 'p', 'g', 'c', 'q', 'z', 'v', 'w', 'h', 'l', 'r', 'm'])
const ANUSVARA_M_BEFORE = new Set(['d', 't', 'b', 'h', 'p', 's', 'k', 'j', 'f', 'g', 'c', 'q', 'z', 'v', 'w', 'l', 'r', 'n'])

// Vowel mappings — [roman, standalone, matra (after consonant)]
// Longest match first to avoid partial matches.
// null standalone = only valid as a matra after a consonant (not word-initial).
const VOWELS = [
  ['aaa', 'ఆ', '\u0C3E'],    // Extended triple-a → long ā (e.g. "daaalleen")
  ['eee', 'ఈ', '\u0C40'],    // Extended triple-e → long ī
  ['ooo', 'ఊ', '\u0C42'],    // Extended triple-o → long ū
  ['aa', 'ఆ', '\u0C3E'],     // ా  long aa
  ['ee', 'ఈ', '\u0C40'],     // ీ  long ee
  ['oo', 'ఊ', '\u0C42'],     // ూ  long oo
  ['ai', 'ఐ', '\u0C48'],     // ై  diphthong
  ['ay', null, '\u0C48'],     // ై  diphthong after consonant (e.g. "bayn"→బైన్, "layl"→లైల్)
  ['au', 'ఔ', '\u0C4C'],     // ౌ  diphthong
  ['aw', null, '\u0C4C'],     // ౌ  diphthong after consonant (e.g. "yawm"→యౌమ్, "tawba"→తౌబ)
  ['ou', 'ఔ', '\u0C4C'],     // ౌ  diphthong
  ['a', 'అ', ''],             // inherent vowel (no matra needed)
  ['i', 'ఇ', '\u0C3F'],      // ి
  ['u', 'ఉ', '\u0C41'],      // ు
  ['e', 'ఎ', '\u0C46'],      // ె
  ['o', 'ఓ', '\u0C4B'],      // ో
]

const isLetter = (ch) => /[a-z]/i.test(ch)
const isApostrophe = (ch) => ch === "'" || ch === '\u2018' || ch === '\u2019' || ch === '\u02BB' || ch === '\u02BC'

/**
 * Convert Roman English transliteration to Telugu script
 * @param {string} text - Roman English text (e.g. "Bismillaahir Rahmaanir Raheem")
 * @returns {string} Telugu script text (e.g. "బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్")
 */
export function romanToTelugu(text) {
  if (!text) return ''

  // Split into words and whitespace, check overrides per word
  return text.split(/(\s+)/).map(segment => {
    if (!segment || /^\s+$/.test(segment)) return segment
    const override = WORD_OVERRIDES[segment.toLowerCase()]
    if (override) return override
    return transliterateSegment(segment)
  }).join('')
}

function transliterateSegment(text) {
  const lower = text.toLowerCase()
  let result = ''
  let i = 0

  while (i < lower.length) {
    // Skip non-letter characters (spaces, punctuation, numbers)
    if (!isLetter(lower[i])) {
      // Apostrophe/ain (') before 'ay'/'a' vowels — check for diphthong first
      if (isApostrophe(lower[i]) && i + 1 < lower.length) {
        // 'ay after apostrophe → treat as standalone ఐ diphthong (e.g. "'ayni" → ఐని)
        if (lower.startsWith('ay', i + 1)) {
          result += 'ఐ'
          i += 3 // skip apostrophe + 'ay'
          continue
        }
        // Apostrophe before other vowels — skip it
        if (isLetter(lower[i + 1])) {
          i++
          continue
        }
      }
      result += text[i]
      i++
      continue
    }

    // Try matching a consonant (longest first)
    let matched = false
    for (const [roman, telugu] of CONSONANTS) {
      if (lower.startsWith(roman, i)) {
        i += roman.length

        // Try matching a following vowel (all vowels valid as matras)
        let vowelMatched = false
        for (const [vRoman, , vMatra] of VOWELS) {
          if (lower.startsWith(vRoman, i)) {
            // 'ay'/'aw' is a diphthong ONLY when the y/w is NOT followed by a vowel.
            // If y/w is followed by a vowel, it's a consonant with its own vowel —
            // use inherent 'a' instead. e.g. "bayaan" → బయాన్ (not బైఆన్),
            // "hayaata" → హయాత (not హైఆత), but "bayna" → బైన ✓
            if ((vRoman === 'ay' || vRoman === 'aw') && i + vRoman.length < lower.length) {
              const afterDiphthong = lower[i + vRoman.length]
              if ('aeiou'.includes(afterDiphthong)) {
                continue // skip diphthong, fall through to 'a' (inherent vowel)
              }
            }
            result += telugu + vMatra
            i += vRoman.length
            vowelMatched = true
            break
          }
        }

        // No vowel follows
        if (!vowelMatched) {
          // Decide: anusvara (ం) or halant (్)?
          const nextChar = i < lower.length ? lower[i] : ''
          const useAnusvara = (
            roman === 'n' && nextChar && isLetter(nextChar) && nextChar !== 'n' && nextChar !== 'f' && ANUSVARA_N_BEFORE.has(nextChar)
          ) || (
            roman === 'm' && nextChar && isLetter(nextChar) && nextChar !== 'm' && ANUSVARA_M_BEFORE.has(nextChar)
          )

          if (useAnusvara) {
            result += ANUSVARA
          } else {
            result += telugu + VIRAMA
            // Handle tanween: 'nw' at word boundary (e.g. "qaleelanw", "shai'anw")
            if (roman === 'n' && i < lower.length && lower[i] === 'w' && (i + 1 >= lower.length || !isLetter(lower[i + 1]))) {
              i++ // skip the silent trailing 'w'
            }
          }
        }

        matched = true
        break
      }
    }
    if (matched) continue

    // Try matching a standalone vowel (skip entries with null standalone — those are consonant-only matras)
    let vowelMatched = false
    for (const [vRoman, vStandalone] of VOWELS) {
      if (vStandalone !== null && lower.startsWith(vRoman, i)) {
        result += vStandalone
        i += vRoman.length
        vowelMatched = true
        break
      }
    }
    if (vowelMatched) continue

    // Fallback: keep character as-is
    result += text[i]
    i++
  }

  return result
}
