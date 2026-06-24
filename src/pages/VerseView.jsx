import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getSurahVerses, surahs, getSurahByNumber, fetchBismillah, getVerseAudioUrl } from '../data/quranData'
import { useSettings } from '../context/SettingsContext'
import { romanToTelugu } from '../utils/teluguTransliteration'
import AudioPlayer from '../components/AudioPlayer'
import './VerseView.css'

// ===================== Canvas verse-image renderer =====================
// Generates a clean HD PNG of a single verse from the raw text data — no DOM
// cloning, so no flicker and no font/layout race conditions.
function wrapLines(ctx, text, maxWidth) {
  if (!text) return []
  const words = String(text).split(/\s+/)
  const lines = []
  let current = ''
  for (const w of words) {
    const test = current ? current + ' ' + w : w
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      // Hard-break very long words
      if (ctx.measureText(w).width > maxWidth) {
        let chunk = ''
        for (const ch of w) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            lines.push(chunk)
            chunk = ch
          } else {
            chunk += ch
          }
        }
        current = chunk
      } else {
        current = w
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

async function renderVerseImage({ surahNumber, surahName, verseNumber, arabic, roman, teluguRoman, telugu, english, opts = {} }) {
  // Wait for any web fonts so measurements are accurate
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready } catch { /* ignore */ }
  }

  // Design canvas at "logical" CSS px, then upscale via dpr for HD output
  const DPR = opts.dpr || 3
  const W = opts.width || 1080
  const S = W / 1080 // scale factor for fonts/padding relative to 1080 base
  const isPdf = !!opts.pdf
  const PADDING_X = Math.round((isPdf ? 48 : 60) * S)
  const PADDING_TOP = Math.round((isPdf ? 30 : 60) * S)
  const PADDING_BOTTOM = Math.round((isPdf ? 32 : 60) * S)
  const contentW = W - PADDING_X * 2
  const SECTION_GAP = Math.round((isPdf ? 16 : 28) * S)

  // Theme — light mode for exported images
  const BG_TOP = '#e8f5e9'
  const BG_BOTTOM = '#dcedc8'
  const CARD_BG = '#fffdf7'
  const BORDER = 'rgba(26,16,5,0.35)'
  const ACCENT = '#8b6508'
  const TEXT = '#1a1005'
  const LABEL_CLR = '#b8860b'

  // Font stacks
  const ARABIC_FONT = "'Amiri', 'Scheherazade New', 'Traditional Arabic', serif"
  const TELUGU_FONT = "'Noto Sans Telugu', 'Mallanna', system-ui, sans-serif"
  const UI_FONT = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"

  // Sections (built first to measure total height)
  const measure = document.createElement('canvas').getContext('2d')
  const sections = []

  const sz = (v) => Math.round(v * S)

  // Header — surah name centered at top
  sections.push({ type: 'header', h: sz(isPdf ? 44 : 50) })
  sections.push({ type: 'gap', h: sz(isPdf ? 22 : 60) })

  if (arabic) {
    const fs = sz(56)
    measure.font = `${fs}px ${ARABIC_FONT}`
    const lines = wrapLines(measure, arabic, contentW)
    const lh = sz(140)
    sections.push({ type: 'arabic', lines, lineHeight: lh, h: lines.length * lh + sz(40), fontSize: fs })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (roman) {
    const fs = sz(26)
    sections.push({ type: 'label', text: 'Transliteration', h: sz(30) })
    measure.font = `italic ${fs}px ${UI_FONT}`
    const lines = wrapLines(measure, roman, contentW)
    const lh = sz(40)
    sections.push({ type: 'body', lines, lineHeight: lh, font: `italic ${fs}px ${UI_FONT}`, color: TEXT, h: lines.length * lh + sz(16) })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (teluguRoman) {
    const fs = sz(26)
    sections.push({ type: 'label', text: 'తెలుగు లిప్యంతరీకరణ', h: sz(30), font: TELUGU_FONT })
    measure.font = `${fs}px ${TELUGU_FONT}`
    const lines = wrapLines(measure, teluguRoman, contentW)
    const lh = sz(42)
    sections.push({ type: 'body', lines, lineHeight: lh, font: `${fs}px ${TELUGU_FONT}`, color: TEXT, h: lines.length * lh + sz(16) })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (telugu) {
    const fs = sz(28)
    sections.push({ type: 'label', text: 'తెలుగు', h: sz(30), font: TELUGU_FONT })
    measure.font = `${fs}px ${TELUGU_FONT}`
    const lines = wrapLines(measure, telugu, contentW)
    const lh = sz(44)
    sections.push({ type: 'body', lines, lineHeight: lh, font: `${fs}px ${TELUGU_FONT}`, color: TEXT, h: lines.length * lh + sz(16) })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (english) {
    const fs = sz(26)
    sections.push({ type: 'label', text: 'English', h: sz(30) })
    measure.font = `${fs}px ${UI_FONT}`
    const lines = wrapLines(measure, english, contentW)
    const lh = sz(40)
    sections.push({ type: 'body', lines, lineHeight: lh, font: `${fs}px ${UI_FONT}`, color: TEXT, h: lines.length * lh + sz(16) })
  }

  const contentH = sections.reduce((s, sec) => s + sec.h, 0)
  const H = PADDING_TOP + contentH + PADDING_BOTTOM

  // Create the real HD canvas
  const canvas = document.createElement('canvas')
  canvas.width = W * DPR
  canvas.height = H * DPR
  const ctx = canvas.getContext('2d')
  ctx.scale(DPR, DPR)
    ctx.textBaseline = 'middle'

  if (isPdf) {
    // Compact card that fills the whole image — tight box for packing in PDF
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    const m = Math.max(1, sz(4))
    const cardX = m, cardY = m
    const cardW = W - m * 2, cardH = H - m * 2
    const radius = sz(16)
    ctx.fillStyle = CARD_BG
    roundRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.fill()
    // Accent strip down the left edge
    ctx.save()
    roundRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.clip()
    ctx.fillStyle = ACCENT
    ctx.fillRect(cardX, cardY, sz(6), cardH)
    ctx.restore()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = BORDER
    roundRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.stroke()
  } else {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, BG_TOP)
    grad.addColorStop(1, BG_BOTTOM)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Inner "card" with subtle border — equal margin all sides
    const CARD_MARGIN = sz(30)
    const cardX = CARD_MARGIN
    const cardY = CARD_MARGIN
    const cardW = W - CARD_MARGIN * 2
    const cardH = H - CARD_MARGIN * 2
    const radius = sz(20)
    ctx.fillStyle = CARD_BG
    roundRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = BORDER
    roundRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.stroke()
  }

  // Render sections
  let y = PADDING_TOP
  for (const sec of sections) {
    if (sec.type === 'gap') {
      // just spacing
    } else if (sec.type === 'header') {
      // Surah name centered — vertically middle of header height
      // Use Telugu font if name contains Telugu characters
      const hasTelugu = /[\u0C00-\u0C7F]/.test(surahName)
      if (isPdf) {
        const cy = y + sec.h / 2
        const r = sz(15)
        const cx = PADDING_X + r
        ctx.fillStyle = ACCENT
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = `700 ${sz(15)}px ${UI_FONT}`
        ctx.textAlign = 'center'
        ctx.fillText(String(verseNumber), cx, cy + sz(1))
        ctx.fillStyle = ACCENT
        ctx.font = hasTelugu ? `600 ${sz(18)}px ${TELUGU_FONT}` : `600 ${sz(17)}px ${UI_FONT}`
        ctx.textAlign = 'left'
        ctx.fillText(`${surahName || `Surah ${surahNumber}`}   ${surahNumber}:${verseNumber}`, cx + r + sz(14), cy)
        ctx.strokeStyle = 'rgba(184,134,11,0.25)'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(PADDING_X, y + sec.h - sz(2)); ctx.lineTo(W - PADDING_X, y + sec.h - sz(2)); ctx.stroke()
        ctx.textAlign = 'left'
      } else {
      ctx.fillStyle = ACCENT
      ctx.font = hasTelugu ? `600 ${sz(26)}px ${TELUGU_FONT}` : `600 ${sz(24)}px ${UI_FONT}`
      ctx.textAlign = 'center'
      ctx.fillText(`${surahName || `Surah ${surahNumber}`} • ${surahNumber}:${verseNumber}`, W / 2, y + sec.h / 2)
      }
      ctx.textAlign = 'left'
    } else if (sec.type === 'arabic') {
      ctx.fillStyle = TEXT
      ctx.font = `${sec.fontSize}px ${ARABIC_FONT}`
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      // Center each line in its slot — prevents diacritics sinking/clipping
      let ly = y + sec.lineHeight / 2
      for (const line of sec.lines) {
        ctx.fillText(line, W - PADDING_X, ly)
        ly += sec.lineHeight
      }
      ctx.direction = 'ltr'
      ctx.textAlign = 'left'
    } else if (sec.type === 'label') {
      ctx.fillStyle = LABEL_CLR
      ctx.font = `600 ${sz(15)}px ${sec.font || UI_FONT}`
      ctx.textAlign = 'left'
      ctx.fillText(sec.text, PADDING_X, y + sec.h / 2)
    } else if (sec.type === 'body') {
      ctx.fillStyle = sec.color
      ctx.font = sec.font
      ctx.textAlign = 'left'
      // Center each line vertically in its lineHeight slot
      let ly = y + sec.lineHeight / 2
      for (const line of sec.lines) {
        ctx.fillText(line, PADDING_X, ly)
        ly += sec.lineHeight
      }
    }
    y += sec.h
  }

  if (opts.format === 'jpeg') return canvas.toDataURL('image/jpeg', opts.quality || 0.85)
  return canvas.toDataURL('image/png')
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
// ===================== Surah PDF download (zero-dependency) =====================
// Packs multiple verse cards per A4 page.
// images: [{ jpegBytes, width, height }]  — shared image pool
// pages:  [[{ imgIndex, x, y, w, h }]]    — placements per page (PDF coords, origin bottom-left)
function buildMinimalPDF(images, pages) {
  const enc = new TextEncoder()
  const parts = []
  const offsets = []
  let pos = 0

  function write(str) {
    const bytes = enc.encode(str)
    parts.push(bytes)
    pos += bytes.length
  }
  function writeRaw(arr) {
    parts.push(arr)
    pos += arr.length
  }
  function objStart(id) { offsets[id] = pos; write(`${id} 0 obj\n`) }
  function objEnd() { write('endobj\n') }

  const PAGE_W = 595
  const PAGE_H = 842
  const imgCount = images.length
  const pageCount = pages.length
  const firstImgObj = 4
  const firstContentObj = firstImgObj + imgCount
  const firstPageObj = firstContentObj + pageCount

  write('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')

  // 1: Catalog
  objStart(1); write(`<< /Type /Catalog /Pages 2 0 R >>\n`); objEnd()

  // 2: Pages
  objStart(2)
  const kids = Array.from({ length: pageCount }, (_, i) => `${firstPageObj + i} 0 R`).join(' ')
  write(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] >>\n`)
  objEnd()

  // 3: Resources (shared) — every image registered as /ImgN
  objStart(3)
  const xobjs = images.map((_, i) => `/Img${i} ${firstImgObj + i} 0 R`).join(' ')
  write(`<< /XObject << ${xobjs} >> >>\n`)
  objEnd()

  // Image XObjects
  for (let i = 0; i < imgCount; i++) {
    const { jpegBytes, width, height } = images[i]
    objStart(firstImgObj + i)
    write(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\n`)
    write('stream\n')
    writeRaw(jpegBytes)
    write('\nendstream\n')
    objEnd()
  }

  // Page content streams — one per page, drawing all placed images
  for (let p = 0; p < pageCount; p++) {
    const ops = pages[p].map(pl =>
      `q ${pl.w.toFixed(2)} 0 0 ${pl.h.toFixed(2)} ${pl.x.toFixed(2)} ${pl.y.toFixed(2)} cm /Img${pl.imgIndex} Do Q`
    ).join('\n')
    objStart(firstContentObj + p)
    write(`<< /Length ${ops.length} >>\nstream\n${ops}\nendstream\n`)
    objEnd()
  }

  // Page objects
  for (let p = 0; p < pageCount; p++) {
    objStart(firstPageObj + p)
    write(`<< /Type /Page /Parent 2 0 R /Resources 3 0 R /Contents ${firstContentObj + p} 0 R >>\n`)
    objEnd()
  }

  // Xref
  const xrefPos = pos
  const totalObjs = firstPageObj + pageCount
  write(`xref\n0 ${totalObjs}\n0000000000 65535 f \n`)
  for (let i = 1; i < totalObjs; i++) {
    write(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }
  write(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`)

  const totalLen = parts.reduce((s, p) => s + p.length, 0)
  const result = new Uint8Array(totalLen)
  let off = 0
  for (const p of parts) { result.set(p, off); off += p.length }
  return result
}

// Title banner image for the first PDF page
async function renderSurahBanner({ title, subtitle, count, width, quality }) {
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready } catch { /* ignore */ } }
  const W = width
  const H = Math.round(width * 0.30)
  const TELUGU_FONT = "'Noto Sans Telugu', 'Mallanna', system-ui, sans-serif"
  const UI_FONT = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  // Accent gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#8b6508')
  grad.addColorStop(1, '#b8860b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Subtitle (top)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `600 ${Math.round(W * 0.030)}px ${UI_FONT}`
  ctx.fillText(subtitle, W / 2, H * 0.28)
  // Title (surah name)
  const hasTelugu = /[ఀ-౿]/.test(title)
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${Math.round(W * (hasTelugu ? 0.064 : 0.060))}px ${hasTelugu ? TELUGU_FONT : UI_FONT}`
  ctx.fillText(title, W / 2, H * 0.52)
  // Count
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = `500 ${Math.round(W * 0.028)}px ${UI_FONT}`
  ctx.fillText(count, W / 2, H * 0.76)
  const jpegBytes = await canvasToJpegBytes(canvas, quality)
  return { jpegBytes, width: W, height: H }
}

async function canvasToJpegBytes(canvas, quality) {
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality))
  return new Uint8Array(await blob.arrayBuffer())
}

async function dataUrlToJpegBytes(dataUrl, quality) {
  const img = new Image()
  img.src = dataUrl
  await new Promise(r => { img.onload = r })
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = img.width
  tempCanvas.height = img.height
  tempCanvas.getContext('2d').drawImage(img, 0, 0)
  const jpegBytes = await canvasToJpegBytes(tempCanvas, quality)
  return { jpegBytes, width: img.width, height: img.height }
}

async function downloadSurahPDF({ surahNumber, surahName, surahNameTelugu, verses, transliteration, onProgress }) {
  const displayName = transliteration === 'telugu' ? (surahNameTelugu || surahName) : surahName
  const pdfOpts = { dpr: 1, format: 'jpeg', quality: 0.62, width: 560, pdf: true }
  const QUALITY = pdfOpts.quality

  // Build shared image pool — banner first, then one compact card per verse
  const images = []
  const banner = await renderSurahBanner({
    title: displayName || `Surah ${surahNumber}`,
    subtitle: 'Holy Quran',
    count: `${verses.length} ${verses.length === 1 ? 'Verse' : 'Verses'}`,
    width: pdfOpts.width,
    quality: QUALITY,
  })
  images.push(banner) // imgIndex 0

  for (let i = 0; i < verses.length; i++) {
    if (onProgress) onProgress(i + 1, verses.length)
    const v = verses[i]
    const teluguRoman = v.roman ? romanToTelugu(v.roman) : ''
    const dataUrl = await renderVerseImage({
      surahNumber,
      surahName: displayName,
      verseNumber: v.number,
      arabic: v.arabic || '',
      roman: (transliteration === 'english' || transliteration === 'both') ? (v.roman || '') : '',
      teluguRoman: (transliteration === 'telugu' || transliteration === 'both') ? teluguRoman : '',
      telugu: (transliteration === 'telugu' || transliteration === 'both') ? (v.telugu || '') : '',
      english: (transliteration === 'english' || transliteration === 'both') ? (v.translation || '') : '',
      opts: pdfOpts,
    })
    images.push(await dataUrlToJpegBytes(dataUrl, QUALITY))
  }

  // Layout: flow images down each A4 page with a small gap; break to a new page when full
  const PAGE_W = 595, PAGE_H = 842
  const MARGIN = 32, GAP = 12
  const usableW = PAGE_W - MARGIN * 2
  const usableH = PAGE_H - MARGIN * 2
  const pages = []
  let current = []
  let cursorTop = MARGIN

  for (let idx = 0; idx < images.length; idx++) {
    const im = images[idx]
    let dispW = usableW
    let scale = usableW / im.width
    let dispH = im.height * scale
    if (dispH > usableH) {
      scale = Math.min(usableW / im.width, usableH / im.height)
      dispW = im.width * scale
      dispH = im.height * scale
    }
    // New page if this box would overflow (but always keep at least one per page)
    if (current.length > 0 && cursorTop + dispH > PAGE_H - MARGIN) {
      pages.push(current)
      current = []
      cursorTop = MARGIN
    }
    const x = MARGIN + (usableW - dispW) / 2
    const y = PAGE_H - cursorTop - dispH
    current.push({ imgIndex: idx, x, y, w: dispW, h: dispH })
    cursorTop += dispH + GAP
  }
  if (current.length > 0) pages.push(current)

  const pdfBytes = buildMinimalPDF(images, pages)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = (surahName || `surah-${surahNumber}`).replace(/[^\w\-]+/g, '_')
  link.download = `${safeName}_${surahNumber}.pdf`
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// =======================================================================

// Scroll to top button — throttled scroll handler to reduce layout thrashing
const ScrollToTop = memo(() => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setShow(window.scrollY > 400)
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null
  return (
    <button
      className="scroll-top-btn"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  )
})
ScrollToTop.displayName = 'ScrollToTop'

// Single verse card
const VerseCard = memo(({ verse, surahNumber, surahName, surahNameTelugu, showArabic, fontSize, playingVerse, isActive, isSurahPlaying, onPlay, onBookmark, isFav, onToggleFav, transliteration, isBookmarked, reciter }) => {
  const [justBookmarked, setJustBookmarked] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [shareToast, setShareToast] = useState(null)
  const cardRef = useRef(null)

  const handleDownload = useCallback(async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const teluguRoman = verse.roman ? romanToTelugu(verse.roman) : ''
      const dataUrl = await renderVerseImage({
        surahNumber,
        surahName: transliteration === 'telugu' ? (surahNameTelugu || surahName) : surahName,
        verseNumber: verse.number,
        arabic: verse.arabic || '',
        roman: (transliteration === 'english' || transliteration === 'both') ? (verse.roman || '') : '',
        teluguRoman: (transliteration === 'telugu' || transliteration === 'both') ? teluguRoman : '',
        telugu: (transliteration === 'telugu' || transliteration === 'both') ? (verse.telugu || '') : '',
        english: (transliteration === 'english' || transliteration === 'both') ? (verse.translation || '') : '',
      })
      const link = document.createElement('a')
      const safeName = (surahName || `surah-${surahNumber}`).replace(/[^\w\-]+/g, '_')
      link.download = `${safeName}_verse-${verse.number}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to download verse image:', err)
    } finally {
      setDownloading(false)
    }
  }, [downloading, surahName, surahNumber, verse, transliteration])

  const handleBookmarkClick = useCallback(() => {
    onBookmark(verse.number)
    setJustBookmarked(true)
    setTimeout(() => setJustBookmarked(false), 1500)
  }, [onBookmark, verse.number])

  const handleShare = useCallback(async () => {
    const lines = []
    const surahLabel = transliteration === 'telugu' ? (surahNameTelugu || surahName) : (surahName || 'Surah ' + surahNumber)
    const verseLbl = transliteration === 'telugu' ? 'ఆయత్' : 'Verse'

    // Header
    lines.push(`══════════════════════`)
    lines.push(`  ${surahLabel} — ${verseLbl} ${verse.number}`)
    lines.push(`══════════════════════`)

    // Arabic
    if (verse.arabic) {
      lines.push('')
      lines.push(`  ${verse.arabic}`)
    }

    // Transliteration
    if (verse.roman) {
      if (transliteration === 'telugu' || transliteration === 'both') {
        lines.push('')
        if (transliteration === 'both') lines.push(`- తెలుగు లిప్యంతరీకరణ:`)
        lines.push(romanToTelugu(verse.roman))
      }
      if (transliteration === 'english' || transliteration === 'both') {
        lines.push('')
        if (transliteration === 'both') lines.push(`- Transliteration:`)
        lines.push(verse.roman)
      }
    }

    // Meaning
    if (transliteration === 'telugu' || transliteration === 'both') {
      if (verse.telugu) {
        lines.push('')
        lines.push(`── ${transliteration === 'both' ? 'అర్థం (Telugu)' : 'అర్థం'} ──`)
        lines.push('')
        lines.push(verse.telugu)
      }
    }
    if (transliteration === 'english' || transliteration === 'both') {
      if (verse.translation) {
        lines.push('')
        lines.push(`── ${transliteration === 'both' ? 'Meaning (English)' : 'Meaning'} ──`)
        lines.push('')
        lines.push(verse.translation)
      }
    }

    lines.push('')
    lines.push(`══════════════════════`)

    const text = lines.join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: `${surahLabel} — Verse ${verse.number}`, text })
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Share failed:', e)
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setShareToast('Copied!')
        setTimeout(() => setShareToast(null), 1500)
      } catch {
        // fallback for older browsers
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setShareToast('Copied!')
        setTimeout(() => setShareToast(null), 1500)
      }
    }
  }, [surahName, surahNumber, verse, transliteration])

  // Memoize Telugu transliteration to avoid recomputing on every render
  const teluguTranslit = useMemo(() => verse.roman ? romanToTelugu(verse.roman) : null, [verse.roman])

  return (
    <div ref={cardRef} className={`verse-card ${justBookmarked ? 'verse-bookmarked' : ''} ${isActive ? 'vv-verse-active' : ''} ${isSurahPlaying && !isActive ? 'vv-verse-dimmed' : ''}`} id={`verse-${verse.number}`}>
      {/* Verse header with number, bookmark, favorite, and audio */}
      <div className="vc-header">
        <div className="vc-number">
          <span>{verse.number}</span>
        </div>
        <div className="vc-actions">
          <button
            className={`vc-action-btn bookmark-btn ${isBookmarked ? 'active' : ''}`}
            onClick={handleBookmarkClick}
            title={isBookmarked ? 'Reading position saved' : 'Save reading position'}
            aria-label={`Bookmark verse ${verse.number}`}
          >
            <svg viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button
            className={`vc-action-btn fav-btn ${isFav ? 'active' : ''}`}
            onClick={() => onToggleFav(verse.number, verse.arabic, verse.translation)}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button
            className={`vc-action-btn download-btn ${downloading ? 'loading' : ''}`}
            onClick={handleDownload}
            disabled={downloading}
            title={downloading ? 'Generating image...' : 'Download verse as image'}
            aria-label="Download verse as image"
          >
            {downloading ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="download-spinner">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            )}
          </button>
          <button
            className="vc-action-btn share-btn"
            onClick={handleShare}
            title="Share verse"
            aria-label="Share verse"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
          <AudioPlayer
            audioUrl={getVerseAudioUrl(surahNumber, verse.number, reciter)}
            verseNumber={verse.number}
            isGlobalPlaying={playingVerse}
            onPlay={onPlay}
          />
        </div>
        {shareToast && <span className="vc-share-toast">{shareToast}</span>}
      </div>

      {/* Arabic text */}
      {showArabic && verse.arabic && (
        <div className="vc-arabic">
          <p dir="rtl">{verse.arabic}</p>
        </div>
      )}

      {/* Transliteration columns based on preference */}
      <div className="vc-columns">
        {(transliteration === 'english' || transliteration === 'both') && (
          <div className="vc-col">
            <span className="vc-label">Transliteration</span>
            <p className="vc-roman" style={{ fontSize: `${fontSize}px` }}>
              {verse.roman || '\u2014'}
            </p>
          </div>
        )}
        {(transliteration === 'telugu' || transliteration === 'both') && (
          <div className="vc-col">
            <span className="vc-label">{transliteration === 'both' ? 'తెలుగు లిప్యంతరీకరణ' : 'Telugu Transliteration'}</span>
            <p className="vc-telugu" style={{ fontSize: `${fontSize}px` }}>
              {teluguTranslit || '\u2014'}
            </p>
          </div>
        )}
      </div>

      {/* Telugu meaning */}
      {(transliteration === 'telugu' || transliteration === 'both') && (
        <div className="vc-columns">
          <div className="vc-col">
            <span className="vc-label">తెలుగు</span>
            <p className="vc-telugu" style={{ fontSize: `${fontSize}px` }}>
              {verse.telugu || '—'}
            </p>
          </div>
        </div>
      )}

      {/* English translation */}
      {(transliteration === 'english' || transliteration === 'both') && (
        <div className="vc-translation">
          <span className="vc-label">English</span>
          <p style={{ fontSize: `${fontSize - 1}px` }}>
            {verse.translation || '—'}
          </p>
        </div>
      )}


    </div>
  )
})
VerseCard.displayName = 'VerseCard'

function VerseView() {
  const { number } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showArabic, fontSize, updateLastRead, clearLastRead, lastRead, favorites, isFavorite, toggleFavorite, transliteration, reciter } = useSettings()

  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [bismillah, setBismillah] = useState(null)
  const [playingVerse, setPlayingVerse] = useState(null)
  const [isSurahPlaying, setIsSurahPlaying] = useState(false)
  const [bookmarkToast, setBookmarkToast] = useState(null)
  const [visibleCount, setVisibleCount] = useState(30)
  const [pdfProgress, setPdfProgress] = useState(null)
  const surahAudioRef = useRef(null)
  const versePlaylistRef = useRef(null)
  const scrolledToVerse = useRef(false)
  const sentinelRef = useRef(null)
  const lastVisibleVerseRef = useRef(null)

  const surahNumber = parseInt(number)
  const surah = useMemo(() => getSurahByNumber(surahNumber), [surahNumber])

  // O(1) favorites lookup — avoids calling isFavorite(n) per verse in render loop
  const favSet = useMemo(() => {
    const set = new Set()
    for (const f of favorites) set.add(f.key)
    return set
  }, [favorites])

  // Progressive rendering: load more verses as user scrolls
  useEffect(() => {
    if (verses.length <= 30) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 30, verses.length))
        }
      },
      { rootMargin: '300px' }
    )
    const el = sentinelRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [verses.length, visibleCount])

  // Auto-scroll to the currently playing verse during surah auto-play
  useEffect(() => {
    if (!isSurahPlaying || !playingVerse) return
    // Expand visible window if the playing verse isn't rendered yet
    if (playingVerse > visibleCount) {
      setVisibleCount(playingVerse + 10)
      return // wait for re-render
    }
    const el = document.getElementById(`verse-${playingVerse}`)
    if (el) {
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const scrollTop = window.pageYOffset + rect.top - 100
        window.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
      })
    }
  }, [playingVerse, isSurahPlaying, visibleCount])

  // Reset scroll flag + expand visibleCount when verse param changes (even for same surah)
  useEffect(() => {
    scrolledToVerse.current = false
    const targetVerse = parseInt(searchParams.get('verse'))
    if (targetVerse > 1 && verses.length > 0) {
      if (targetVerse > visibleCount) {
        setVisibleCount(targetVerse + 10)
      }
    }
  }, [searchParams, verses.length, visibleCount])

  // Load verses with AbortController
  useEffect(() => {
    const controller = new AbortController()
    scrolledToVerse.current = false
    setVisibleCount(30)
    const load = async () => {
      setLoading(true)
      setError(false)
      setPlayingVerse(null)

      // Stop any playing surah audio
      if (surahAudioRef.current) {
        surahAudioRef.current.pause()
        surahAudioRef.current.src = ''
        surahAudioRef.current = null
      }
      if (versePlaylistRef.current) {
        versePlaylistRef.current.stopped = true
        versePlaylistRef.current.audio?.pause()
        versePlaylistRef.current = null
      }
      setIsSurahPlaying(false)

      try {
        // Fetch verses + Bismillah in parallel (non-blocking)
        const needsBismillah = surahNumber !== 1 && surahNumber !== 9
        const [data, bData] = await Promise.all([
          getSurahVerses(surahNumber, controller.signal),
          needsBismillah ? fetchBismillah() : Promise.resolve(null),
        ])
        if (!controller.signal.aborted) setBismillah(bData)
        if (!controller.signal.aborted) {
          setVerses(data)
          // If navigating to a specific verse, ensure enough are visible
          const targetVerse = parseInt(searchParams.get('verse'))
          if (targetVerse > 30) setVisibleCount(targetVerse + 10)
          setLoading(false)

          // Prefetch adjacent surahs in background for instant navigation
          if (surahNumber < 114) getSurahVerses(surahNumber + 1).catch(() => {})
          if (surahNumber > 1) getSurahVerses(surahNumber - 1).catch(() => {})
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (!controller.signal.aborted) { setError(true); setLoading(false) }
      }
    }
    load()
    return () => { controller.abort() }
  }, [surahNumber])

  // Scroll to specific verse after loading
  useEffect(() => {
    if (loading || verses.length === 0 || scrolledToVerse.current) return
    const targetVerse = parseInt(searchParams.get('verse'))
    if (!targetVerse || targetVerse <= 1) {
      scrolledToVerse.current = true
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    // Expand visible window first if needed
    if (targetVerse > visibleCount) {
      setVisibleCount(targetVerse + 10)
      return // wait for re-render with more verses
    }
    const el = document.getElementById(`verse-${targetVerse}`)
    if (el) {
      scrolledToVerse.current = true
      // Manual offset scroll — scrollIntoView doesn't reliably account for sticky header
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect()
          const scrollTop = window.pageYOffset + rect.top - 100
          window.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
        })
      })
    }
  }, [loading, verses, searchParams, visibleCount])

  // Track reading position — observe which verse is at the top of the viewport
  useEffect(() => {
    if (loading || verses.length === 0) return

    const visibleVerses = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const num = parseInt(entry.target.id.replace('verse-', ''))
          if (isNaN(num)) continue
          if (entry.isIntersecting) visibleVerses.add(num)
          else visibleVerses.delete(num)
        }
        if (visibleVerses.size > 0) {
          // Pick the smallest fully visible verse (not the one hidden behind header)
          const sorted = [...visibleVerses].sort((a, b) => a - b)
          lastVisibleVerseRef.current = sorted.length > 1 ? sorted[1] : sorted[0]
        }
      },
      { threshold: 0.5 }
    )

    document.querySelectorAll('.verse-card[id^="verse-"]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [loading, verses.length, visibleCount])

  // Cleanup surah audio on unmount
  useEffect(() => {
    return () => {
      if (surahAudioRef.current) {
        surahAudioRef.current.pause()
        surahAudioRef.current.src = ''
        surahAudioRef.current = null
      }
      if (versePlaylistRef.current) {
        versePlaylistRef.current.stopped = true
        versePlaylistRef.current.audio?.pause()
        versePlaylistRef.current = null
      }
    }
  }, [])

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const handlePrev = useCallback(() => {
    if (surahNumber > 1) navigate(`/surah/${surahNumber - 1}`)
  }, [surahNumber, navigate])
  const handleNext = useCallback(() => {
    if (surahNumber < 114) navigate(`/surah/${surahNumber + 1}`)
  }, [surahNumber, navigate])

  const handleVersePlay = useCallback((verseNum) => {
    // Stop surah audio when individual verse plays
    if (surahAudioRef.current) {
      surahAudioRef.current.pause()
      setIsSurahPlaying(false)
    }
    if (versePlaylistRef.current) {
      versePlaylistRef.current.stopped = true
      versePlaylistRef.current.audio?.pause()
      versePlaylistRef.current = null
      setIsSurahPlaying(false)
    }
    setPlayingVerse(verseNum)
  }, [])

  const handleBookmark = useCallback((verseNum) => {
    if (surah) {
      const isCurrentlyBookmarked = lastRead?.surahNumber === surahNumber && lastRead?.verseNumber === verseNum
      if (isCurrentlyBookmarked) {
        clearLastRead()
        setBookmarkToast('Bookmark removed')
      } else {
        updateLastRead(surahNumber, surah.name, verseNum)
        setBookmarkToast(`Saved: ${surah.name}, Verse ${verseNum} — Use "Continue Reading" on Home page`)
      }
      setTimeout(() => setBookmarkToast(null), 3000)
    }
  }, [surah, surahNumber, updateLastRead, clearLastRead, lastRead])

  const handleToggleFav = useCallback((verseNum, arabic, translation) => {
    if (surah) toggleFavorite(surahNumber, surah.name, verseNum, arabic, translation)
  }, [surah, surahNumber, toggleFavorite])

  const handleSurahPlay = useCallback(async () => {
    if (isSurahPlaying) {
      surahAudioRef.current?.pause()
      if (versePlaylistRef.current) {
        versePlaylistRef.current.stopped = true
        versePlaylistRef.current.audio?.pause()
        versePlaylistRef.current = null
      }
      setIsSurahPlaying(false)
      setPlayingVerse(null)
      return
    }

    setPlayingVerse(null) // Stop any individual verse audio

    const totalAyahs = surah?.ayahs || 0
    if (totalAyahs <= 0) return

    // Stop any previous CDN surah audio
    if (surahAudioRef.current) {
      surahAudioRef.current.pause()
      surahAudioRef.current.src = ''
      surahAudioRef.current = null
    }

    setIsSurahPlaying(true)
    const playlist = { stopped: false, audio: null }
    versePlaylistRef.current = playlist

    const playNextVerse = (ayahNum) => {
      if (playlist.stopped || ayahNum > totalAyahs) {
        setIsSurahPlaying(false)
        setPlayingVerse(null)
        versePlaylistRef.current = null
        return
      }
      setPlayingVerse(ayahNum)
      const url = getVerseAudioUrl(surahNumber, ayahNum, reciter)
      const audio = new Audio(url)
      playlist.audio = audio
      audio.addEventListener('ended', () => playNextVerse(ayahNum + 1))
      audio.addEventListener('error', () => {
        // Skip to next verse on error
        playNextVerse(ayahNum + 1)
      })
      audio.play().catch(() => {
        setIsSurahPlaying(false)
        setPlayingVerse(null)
        versePlaylistRef.current = null
      })
    }

    playNextVerse(1)
  }, [isSurahPlaying, surahNumber, reciter, surah])

  const handleDownloadPDF = useCallback(async () => {
    if (pdfProgress) return
    setPdfProgress({ current: 0, total: verses.length })
    try {
      await downloadSurahPDF({
        surahNumber,
        surahName: surah.name,
        surahNameTelugu: surah.nameTelugu,
        verses,
        transliteration,
        onProgress: (current, total) => setPdfProgress({ current, total }),
      })
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setPdfProgress(null)
    }
  }, [pdfProgress, verses, surahNumber, surah, transliteration])

  if (loading) {
    return (
      <div className="vv-loading">
        <div className="vv-spinner" />
        <p>Loading verses...</p>
      </div>
    )
  }

  if (error || !surah) {
    return (
      <div className="vv-error">
        <p>Failed to load surah. Please check your connection.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <div className="verse-view">
      {/* Fixed header */}
      <header className="vv-header">
        <button className="vv-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="vv-title-group">
          <h1 className="vv-surah-name">{surah.name}</h1>
          <p className="vv-surah-sub">{surah.nameEnglish} • {surah.nameTelugu} • {surah.ayahs} Ayahs</p>
        </div>
        <button
          className={`vv-play-surah ${isSurahPlaying ? 'active' : ''}`}
          onClick={handleSurahPlay}
          title={isSurahPlaying ? 'Pause surah' : 'Play full surah'}
          aria-label={isSurahPlaying ? 'Pause surah' : 'Play full surah'}
        >
          {isSurahPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <polygon points="6,3 20,12 6,21"/>
            </svg>
          )}
        </button>
        <button
          className={`vv-download-pdf ${pdfProgress ? 'active' : ''}`}
          onClick={handleDownloadPDF}
          disabled={!!pdfProgress}
          title={pdfProgress ? `Generating PDF... ${pdfProgress.current}/${pdfProgress.total}` : 'Download surah as PDF'}
          aria-label="Download surah as PDF"
        >
          {pdfProgress ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="pdf-spinner">
              <circle cx="12" cy="12" r="10" strokeDasharray="50" strokeDashoffset="15"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          )}
        </button>
      </header>

      {/* PDF progress toast */}
      {pdfProgress && (
        <div className="vv-pdf-toast">
          Generating PDF... {pdfProgress.current}/{pdfProgress.total} verses
        </div>
      )}

      {/* Surah nav */}
      <div className="vv-nav">
        <button className="vv-nav-btn" onClick={handlePrev} disabled={surahNumber <= 1}>
          ← Previous
        </button>
        <span className="vv-nav-label">Surah {surahNumber} of 114</span>
        <button className="vv-nav-btn" onClick={handleNext} disabled={surahNumber >= 114}>
          Next →
        </button>
      </div>

      {/* Bismillah */}
      {bismillah && (
        <div className="vv-bismillah">
          {showArabic && (
            <p className="vv-bismillah-arabic" dir="rtl">{bismillah.arabic}</p>
          )}
          <p className="vv-bismillah-roman">{bismillah.roman}</p>
        </div>
      )}

      {/* Verses — progressively rendered */}
      <div className={`vv-verses ${isSurahPlaying && playingVerse ? 'vv-playing-mode' : ''}`}>
        {verses.length === 0 ? (
          <div className="vv-empty">
            <p>Unable to load verses. Please check your internet connection.</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            {verses.slice(0, visibleCount).map((verse) => (
              <VerseCard
                key={verse.number}
                verse={verse}
                surahNumber={surahNumber}
                surahName={surah?.name}
                surahNameTelugu={surah?.nameTelugu}
                showArabic={showArabic}
                fontSize={fontSize}
                playingVerse={playingVerse}
                isActive={isSurahPlaying && playingVerse === verse.number}
                isSurahPlaying={isSurahPlaying}
                onPlay={handleVersePlay}
                onBookmark={handleBookmark}
                isFav={favSet.has(`${surahNumber}:${verse.number}`)}
                isBookmarked={lastRead?.surahNumber === surahNumber && lastRead?.verseNumber === verse.number}
                onToggleFav={handleToggleFav}
                transliteration={transliteration}
                reciter={reciter}
              />
            ))}
            {visibleCount < verses.length && (
              <div ref={sentinelRef} className="vv-loading-more">
                <div className="vv-spinner" style={{ width: 28, height: 28 }} />
                <span>{visibleCount} of {verses.length} verses</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div className="vv-bottom-nav">
        <button className="vv-nav-btn" onClick={handlePrev} disabled={surahNumber <= 1}>
          ← Previous Surah
        </button>
        <button className="vv-nav-btn" onClick={handleNext} disabled={surahNumber >= 114}>
          Next Surah →
        </button>
      </div>

      {/* Bookmark toast */}
      {bookmarkToast && (
        <div className="vv-toast">{bookmarkToast}</div>
      )}

      <ScrollToTop />
    </div>
  )
}

export default VerseView
