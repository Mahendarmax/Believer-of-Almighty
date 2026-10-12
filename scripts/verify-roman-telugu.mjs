// Prints fixRomanText and romanToTelugu output for the cases fixed in the
// Roman/Telugu review, with the expected result beside each. Read-only.
//
//   node scripts/verify-roman-telugu.mjs
import { fixRomanText } from '../src/data/quranData.js'
import { romanToTelugu } from '../src/utils/teluguTransliteration.js'

// Written as an escape so the invisible character survives copy/paste.
const ZWNJ = '‌'

const romanCases = [
  ['10:5 manaaz zila / illa', "dhaalika illa bilhaqq; manaaz zila", "dhaalika illaa bilhaqq; manaazila"],
  ['3:184 waz Zuburi stays z', "bilbaiyinaati waz Zuburi wal", "bilbaiyinaati waz Zuburi wal"],
  ['99:1 zul zilatil stays z', "Idhaa zul zilatil ardu zil zaalaha", "Idhaa zul zilatil ardu zil zaalaha"],
  ['26:148 zuroo stays z', "Wa zuroo inw wa nakhlin", "Wa zuroo inw wa nakhlin"],
  ['8:48 idh zaiyana untouched', "Wa idh zaiyana lahumush", "Wa idh zaiyana lahumush"],
  ['12:4 ra aytu', "innee ra aytu ahada 'ashara kawkabanw walqamara ra aytuhum lee", "innee ra'aytu ahada 'ashara kawkabanw walqamara ra'aytuhum lee"],
  ['3:35 qaalatim ra atu', "Idh qaalatim ra atu 'Imraana", "Idh qaalatimra'atu 'Imraana"],
  ['12:80 doubled lam', "wa huwa khairul lhaakimeen", "wa huwa khairul haakimeen"],
  ['42:7 llaika', "awhainaaa llaika", "awhainaaa ilaika"],
  ['37:165 llanahnu', "Wa innaa llanahnus saaaffoon", "Wa innaa lanahnus saaaffoon"],
  ['62:7 bix', "'aleemum bix dhaalimeen", "'aleemum bidh dhaalimeen"],
  ['25:34 section junk', "wa adallu sabeelaa )section 3)", "wa adallu sabeelaa"],
  ['10:96 yu minoon', "laa yu 'minoon", "laa yu'minoon"],
  ['10:4 jamee anw', "marji'ukum jamee 'anw wa'dal", "marji'ukum jamee'anw wa'dal"],
  ['as-haab / Is-haaq / fat-h', "Ashaabun naari wa Ishaaqa walfath", "As-haabun naari wa Is-haaqa walfat-h"],
  ['12:31 splits', "wa qaala tikh ruj 'alaihinna muttaka anw", "wa qaalatikhruj 'alaihinna muttaka'anw"],
  ['104:4 layum ba dhanna', "Kalla layum ba dhanna fil", "Kalla layumbadhanna fil"],
  ['2:282', "bidinin ilaa ajalimmusamman faktubooh 'alaihil lhaqqu", "bidainin ilaa ajalim musamman faktubooh 'alaihil haqqu"],
  ['10:88 Mosaa / liyudillo', "Wa qaala Mosaa Rabbanaa liyudillo", "Wa qaala Moosaa Rabbanaa liyudilloo"],
  ["2:120 ba'da / taba'ta untouched", "wa la'init taba'ta ahwaaa'ahum ba'dal ladhee ba'da idh hadaitanaa ba'da eemaanihim yurdi'na awlaada", "wa la'init taba'ta ahwaaa'ahum ba'dal ladhee ba'da idh hadaitanaa ba'da eemaanihim yurdi'na awlaada"],
  ['2:38 / 2:233 / 2:282 joins', "Qulnah bitoo; Walwaa lidaatu; wastash hidoo; wamra ataani; fa ulaaa 'ika; malaaa 'ikata; shai anw; walyu minoo; tabarra al ladheenat", "Qulnahbitoo; Walwaalidaatu; wastash-hidoo; wamra'ataani; fa ulaaa'ika; malaaa'ikata; shai'anw; walyu'minoo; tabarra'al ladheenat"],
  ['5:20 / 7:107 Qa typo', "Qa idh qaala Moosaa", "Wa idh qaala Moosaa"],
  ['7:107 Qa alqaa', "Qa alqaa 'asaahu", "Fa alqaa 'asaahu"],
  ['7:150 / 30:6 -nna splits', "Qaalab na umma; wa laakin na aksaran naasi", "Qaalabna umma; wa laakinna aksaran naasi"],
  ['second-pass leftovers', "ulaaa'ika As haabun Naari; as haabul; filma deenatim ra atul; lanah nus saaffoon; ka'al alm yaghnaw; nas rullahi walfath; Qaalabna umma", "ulaaa'ika As-haabun Naari; as-haabul; fil madeenatimra'atul; lanahnus saaffoon; ka'al lam yaghnaw; nasrul laahi walfat-h; Qaalabna umma"],
  ['case kept: Wamra / qulnah', "Wamra atuhoo; qulnah bitoo", "Wamra'atuhoo; qulnahbitoo"],
  ["imra'at after -tum/-mum/-rum", "wajattum ra atan; doonihimum ra ataini; kafarum ra ata", "wajattumra'atan; doonihimumra'ataini; kafarumra'ata"],
  ['controls untouched', "wa aatat fa in kaana yaa Moosaa laa ilaaha maa sa yubtiluhoo minadh dhaalimeen lidh dhaakireen", "wa aatat fa in kaana yaa Moosaa laa ilaaha maa sa yubtiluhoo minadh dhaalimeen lidh dhaakireen"],
  ["6:71 huda'tinaa", "ilal huda' tinaa; qul inna", "ilal huda'tinaa; qul inna"],
  ["5:41 Aakhirati 'adhaabun", "fil Aakhirati'adhaabun 'adheem", "fil Aakhirati 'adhaabun 'adheem"],
  ['2:166 ladheenattubi\'oo', "tabarra'al ladheenat tubi'oo minal ladheenattaba'oo", "tabarra'al ladheenattubi'oo minal ladheenattaba'oo"],
  // Review follow-ups
  ["7:77 Saalihu' tinaa", "yaa Saalihu' tinaa bimaa ta'idunaaa", "yaa Saalihu'tinaa bimaa ta'idunaaa"],
  ["29:29 qaalu' tinaaa", "an qaalu' tinaaa bi'adhaabil laahi", "an qaalu'tinaaa bi'adhaabil laahi"],
  ["13:37 ahwaaa 'ahum", "wa la'init taba'ta ahwaaa 'ahum", "wa la'init taba'ta ahwaaa'ahum"],
  ['19:5 kaana tim ra atee', "wa kaana tim ra atee 'aaqiran", "wa kaanatimra'atee 'aaqiran"],
  ["8:41 / 17:74 shai'", "min sha in; sha an qaleelaa", "min shai'in; shai'an qaleelaa"],
]

// Expectations follow the no-anusvara design: ن/م before another consonant are
// rendered as halant + ZWNJ (antum → అన్‌తుమ్), never collapsed to ం.
const teluguCases = [
  ['A1 tanween', 'nooranw wa', 'నూరన్ వ'],
  ['A1 tanween', "diyaaa'anw", 'దియాఅన్'],
  ['A1 tanween', 'qaleelanw', 'ఖలీలన్'],
  ['A2 word-initial ay', 'aydeehim', 'ఐదీహిమ్'],
  ['A2 word-initial aw', 'awliyaaa', 'ఔలియా'],
  ['A2 standalone aw', 'aw', 'ఔ'],
  ['A2 geminate ayy kept', 'ayyuhal', 'అయ్యుహల్'],
  ['A2 geminate aww kept', 'awwal', 'అవ్వల్'],
  ["A3 'aw", "Fir'awna", 'ఫిర్ఔన'],
  ["A3 'ay still ok", "ara'aytum", 'అరఐతుమ్'],
  ["A3 'ay still ok", "Shu'ayb", 'షుఐబ్'],
  ['A4 hyphen → ZWNJ', 'As-haabun', `అస్${ZWNJ}హాబున్`],
  ['A4 hyphen → ZWNJ', 'Is-haaq', `ఇస్${ZWNJ}హాఖ్`],
  ['A5 hyphen → ZWNJ', 'walfat-h', `వల్${ZWNJ}ఫత్${ZWNJ}హ్`],
  ['A5 sh-h → ZWNJ', 'wastash-hidoo', `వస్${ZWNJ}తష్${ZWNJ}హిదూ`],
  // Hyphens that are real separators must stay visible (99 Names, muqatta'at, 1:3, 1:6)
  ['hyphen kept: Ar-Rahmaan', 'Ar-Rahmaan', `అర్-రహ్${ZWNJ}మాన్`],
  ['hyphen kept: muqatta\'at', 'Alif-Laaam-Meeem', 'అలిఫ్-లామ్-మీమ్'],
  ['hyphen kept: Wal-Fajr', 'Wal-Fajr', `వల్-ఫజ్${ZWNJ}ర్`],
  ['regression: bayaan', 'bayaan', 'బయాన్'],
  ['regression: bayna', 'bayna', 'బైన'],
  ['regression: Yawmid', 'Yawmid', 'యౌమిద్'],
  ['regression: Hayy Qayyoom', 'Hayy Qayyoom', 'హయ్య్ ఖయ్యూమ్'],
  ['regression: antum', 'antum', `అన్${ZWNJ}తుమ్`],
  ['regression: Bismillaah', 'Bismillaahir Rahmaanir Raheem', `బిస్${ZWNJ}మిల్లాహిర్ రహ్${ZWNJ}మానిర్ రహీమ్`],
]

let fail = 0
const show = (s) => s.replace(/‌/g, '⁞')

console.log('=== fixRomanText ===')
for (const [name, input, expected] of romanCases) {
  const got = fixRomanText(input)
  const ok = got === expected
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`      got:      ${got}\n      expected: ${expected}`)
}

console.log('\n=== romanToTelugu  (⁞ = zero-width non-joiner) ===')
for (const [name, input, expected] of teluguCases) {
  const got = romanToTelugu(input)
  const ok = got === expected
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(26)} ${input.padEnd(30)} → ${show(got)}`)
  if (!ok) console.log(`      expected: ${show(expected)}`)
}

console.log(`\n${fail === 0 ? 'All checks passed.' : `${fail} check(s) FAILED.`}`)
process.exit(fail === 0 ? 0 : 1)
