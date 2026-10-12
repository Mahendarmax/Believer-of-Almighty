// Roman English → Telugu script transliteration for Quranic text
// Converts phonetic Roman text (e.g. "Bismillaahir Rahmaanir Raheem")
// into Telugu script (e.g. "బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్")

const VIRAMA = '\u0C4D' // Telugu halant (్)
// Note: Telugu anusvara (ం) is intentionally NOT used. Arabic ن and م are
// distinct letters and must survive transliteration as base consonants (halant
// + ZWNJ) rather than collapse into anusvara — e.g. antum → అన్‌తుమ్.
const ZWNJ = '\u200C'    // Zero-width non-joiner — prevents conjunct formation

// Consonant mappings — longest match first.
// h-digraphs sh, zh, kh, gh, ch, th, dh, ph represent single Arabic phonemes
// (ش, ذ, خ, غ, چ, ث/ط, ذ/ظ, ف). 'bh' maps to the aspirated Telugu letter భ per
// traditional Telugu Islamic convention (e.g. Subhaana → సుభాన). 'nh' is NOT
// a digraph — Telugu has no aspirated nha letter, so ن+ه must render as
// separate base letters via halant + ZWNJ — e.g. anhu → అన్‌హు.
const CONSONANTS = [
  ['shh', 'ష'], ['sh', 'ష'], ['zh', 'జ'],
  ['kh', 'ఖ'], ['gh', 'ఘ'], ['ch', 'చ'], ['jh', 'ఝ'],
  ['th', 'థ'], ['dh', 'ధ'], ['ph', 'ఫ'], ['bh', 'భ'],
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
  // API typo: lowercase 'l' instead of 'I' in Surah Fatiha verse 5
  'lyyaaka': 'ఇయ్యాక',
  'liyahkuma': 'లియహ్‌కుమ',
  // 3:26 — tu'izzu (تُعِزُّ)
  "tu'izzu": 'తుఇజ్జు',
  // 3:26 — kulli (كُلِّ)
  'kulli': 'కుల్లి',
  // 3:104 — yanhawna (يَنْهَوْنَ): final long ā matches pronunciation (auto path yields
  // యన్‌హౌన with short 'a'; override adds ా).
  'yanhawna': 'యన్‌హౌనా',
  // Subhaana family (سُبْحَان) — final ā matches natural pronunciation.
  'subhaana': 'సుభానా',
}

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
const isVowel = (ch) => !!ch && 'aeiou'.includes(ch)

// 'ay'/'aw' is a diphthong (\u0C10/\u0C14) only when the glide is NOT followed by a vowel
// (bayaan \u2192 \u0C2C\u0C2F\u0C3E\u0C28\u0C4D) and NOT doubled (ayy/aww geminate \u2192 \u0C39\u0C2F\u0C4D\u0C2F\u0C4D, \u0C24\u0C35\u0C4D\u0C35\u0C3E\u0C2C\u0C4D).
const isDiphthongAt = (lower, i, vRoman) => {
  const after = lower[i + vRoman.length]
  if (after === undefined || !isLetter(after)) return true
  const glide = vRoman === 'ay' ? 'y' : 'w'
  return !isVowel(after) && after !== glide
}

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
    const normalizedKey = segment.toLowerCase().replace(/[\u2018\u2019\u02BB\u02BC]/g, "'")
    const override = WORD_OVERRIDES[normalizedKey]
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
      // Hyphen that only exists to stop an h-digraph from firing (as-haab ≠ ashaab,
      // Is-haaq, walfat-h, wastash-hidoo): emit ZWNJ and drop it. Every other hyphen
      // (Ar-Rahmaan, Alif-Laaam-Meeem, Wal-Fajr) is a real separator and stays visible.
      if (text[i] === '-' && i > 0 && 'szkgcjtdpbh'.includes(lower[i - 1]) && lower[i + 1] === 'h') {
        result += ZWNJ
        i++
        continue
      }
      // Apostrophe/ain (') before 'ay'/'aw' vowels — check for diphthong first
      if (isApostrophe(lower[i])) {
        // Trailing apostrophe at end of word — skip it (e.g. "Baari'" → బారి)
        if (i + 1 >= lower.length || !isLetter(lower[i + 1])) {
          i++
          continue
        }
        // 'ay / 'aw after apostrophe → standalone diphthong (e.g. "'ayni" → ఐని, "Fir'awna" → ఫిర్ఔన)
        const dip = ['ay', 'aw'].find(d => lower.startsWith(d, i + 1) && isDiphthongAt(lower, i + 1, d))
        if (dip) {
          result += dip === 'ay' ? 'ఐ' : 'ఔ'
          i += 3 // skip apostrophe + diphthong
          continue
        }
        // Apostrophe before other letters — skip it
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
            // 'ay'/'aw' is a diphthong ONLY when the y/w is NOT followed by a vowel
            // AND NOT followed by the same consonant (geminate).
            // If y/w is followed by a vowel, it's a consonant with its own vowel —
            // use inherent 'a' instead. e.g. "bayaan" → బయాన్ (not బైఆన్),
            // "hayaata" → హయాత (not హైఆత), but "bayna" → బైన ✓
            // If followed by same letter (ayy/aww), it's a geminate — not a diphthong.
            // e.g. "Hayy" → హయ్య్, "Qayyoom" → ఖయ్యూమ్, "Tawwaab" → తవ్వాబ్
            if ((vRoman === 'ay' || vRoman === 'aw') && !isDiphthongAt(lower, i, vRoman)) {
              continue // not a diphthong — fall through to 'a' (inherent vowel)
            }
            result += telugu + vMatra
            i += vRoman.length
            vowelMatched = true
            break
          }
        }

        // No vowel follows — render as halant, preserving each Arabic consonant
        // as a distinct Telugu base letter (including ن and م, which must NEVER
        // collapse to anusvara — see file header). Insert ZWNJ after the halant
        // when a DIFFERENT consonant follows to block unwanted font ligatures;
        // skip ZWNJ for geminates (nn, ll, dd, mm, …) so they form proper
        // conjuncts (e.g. కుల్లి, అన్న, తవద్దు, ఉమ్మీ).
        if (!vowelMatched) {
          const nextChar = i < lower.length ? lower[i] : ''
          // Tanween written as a silent trailing 'w' (qaleelanw, shai'anw, nooranw):
          // render న్ and drop the w.
          if (roman === 'n' && nextChar === 'w' && (i + 1 >= lower.length || !isLetter(lower[i + 1]))) {
            result += telugu + VIRAMA
            i++
            matched = true
            break
          }
          result += telugu + VIRAMA
          if (i < lower.length && isLetter(lower[i]) && !lower.startsWith(roman, i)) {
            result += ZWNJ
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
      if (!lower.startsWith(vRoman, i)) continue
      if (vStandalone !== null) {
        result += vStandalone
        i += vRoman.length
        vowelMatched = true
        break
      }
      // Word-initial 'ay'/'aw' + consonant is a diphthong (aydeehim → ఐదీహిమ్, awliyaaa → ఔలియా,
      // aw → ఔ). Otherwise (ayyuhaa, awwal, ayaa) fall through to 'a' + consonant.
      if (isDiphthongAt(lower, i, vRoman)) {
        result += vRoman === 'ay' ? 'ఐ' : 'ఔ'
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
