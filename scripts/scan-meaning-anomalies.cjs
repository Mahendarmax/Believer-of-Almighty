const fs = require('fs')
const path = require('path')

const root = process.cwd()
const dir = path.join(root, 'public', 'quran-support')

const anomalies = []
let totalVerses = 0

for (let s = 1; s <= 114; s += 1) {
  const file = path.join(dir, `${s}.json`)
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const v of data.verses || []) {
    totalVerses += 1
    const te = String(v.telugu || '')
    const en = String(v.translation || '')
    const k = `${s}:${v.number}`

    if (/^\s|\s$/.test(te) || /^\s|\s$/.test(en)) {
      anomalies.push({ key: k, type: 'trim-whitespace' })
    }
    if (/\s{2,}/.test(te) || /\s{2,}/.test(en)) {
      anomalies.push({ key: k, type: 'double-space' })
    }
    if (/["“”]$/.test(te) || /["“”]$/.test(en)) {
      anomalies.push({ key: k, type: 'trailing-quote' })
    }
    if (/\(అల్లాహ్ ను\)/.test(te)) {
      anomalies.push({ key: k, type: 'allah-spacing' })
    }
    if (/నశించి పోవు గాక/.test(te)) {
      anomalies.push({ key: k, type: 'typo-nashinchi-povu-gaka' })
    }
  }
}

const byType = anomalies.reduce((acc, a) => {
  acc[a.type] = (acc[a.type] || 0) + 1
  return acc
}, {})

console.log(JSON.stringify({
  totalVerses,
  anomalyCount: anomalies.length,
  byType,
  sample: anomalies.slice(0, 120)
}, null, 2))
