// Roman English → Telugu script transliteration for Quranic text
// Converts phonetic Roman text (e.g. "Bismillaahir Rahmaanir Raheem")
// into Telugu script (e.g. "బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్")

const VIRAMA = '\u0C4D' // Telugu halant (్)
const ANUSVARA = '\u0C02' // Telugu anusvara (ం) — natural nasal before consonants

// Consonant mappings — longest match first
const CONSONANTS = [
  ['shh', 'ష'], ['sh', 'ష'], ['zh', 'జ'],
  ['kh', 'ఖ'], ['gh', 'ఘ'], ['ch', 'చ'], ['jh', 'ఝ'],
  ['th', 'థ'], ['dh', 'ధ'], ['ph', 'ఫ'], ['bh', 'భ'],
  ['nh', 'న\u0C4Dహ'],
  ['k', 'క'], ['g', 'గ'], ['c', 'చ'], ['j', 'జ'],
  ['t', 'త'], ['d', 'ద'], ['n', 'న'],
  ['p', 'ప'], ['f', 'ఫ'], ['b', 'బ'], ['m', 'మ'],
  ['y', 'య'], ['r', 'ర'], ['l', 'ల'],
  ['v', 'వ'], ['w', 'వ'],
  ['s', 'స'], ['h', 'హ'], ['z', 'జ'], ['q', 'ఖ'],
  ['x', 'క\u0C4Dస'],
]

// Single-char nasals that become anusvara (ం) before a different consonant
const NASALS = new Set(['n', 'm'])

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

/**
 * Convert Roman English transliteration to Telugu script
 * @param {string} text - Roman English text (e.g. "Bismillaahir Rahmaanir Raheem")
 * @returns {string} Telugu script text (e.g. "బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్")
 */
export function romanToTelugu(text) {
  if (!text) return ''

  const lower = text.toLowerCase()
  let result = ''
  let i = 0

  while (i < lower.length) {
    // Skip non-letter characters (spaces, punctuation, numbers)
    if (!isLetter(lower[i])) {
      // Apostrophe/ain (') before a vowel — skip it, the vowel handles it
      if ((lower[i] === "'" || lower[i] === '\u2018' || lower[i] === '\u2019' || lower[i] === '\u02BB' || lower[i] === '\u02BC') && i + 1 < lower.length && isLetter(lower[i + 1])) {
        i++
        continue
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
            result += telugu + vMatra
            i += vRoman.length
            vowelMatched = true
            break
          }
        }

        // No vowel follows
        if (!vowelMatched) {
          // Nasal before a different consonant → use anusvara (ం) for natural Telugu flow
          // e.g. "Anfal"→అంఫాల్, "ambiya"→అంబియ  (but "anna"→అన్న stays halant)
          if (NASALS.has(roman) && i < lower.length && isLetter(lower[i]) && lower[i] !== roman[0]) {
            result += ANUSVARA
          } else {
            result += telugu + VIRAMA
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
