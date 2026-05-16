import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getSurahVerses, surahs, getSurahByNumber, fetchBismillah, getSurahAudioUrl, getVerseAudioUrl } from '../data/quranData'
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

async function renderVerseImage({ surahNumber, surahName, verseNumber, arabic, roman, teluguRoman, telugu, english }) {
  // Wait for any web fonts so measurements are accurate
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready } catch { /* ignore */ }
  }

  // Design canvas at "logical" CSS px, then upscale via dpr for HD output
  const DPR = 3
  const W = 1080
  const PADDING_X = 60
  const PADDING_TOP = 60
  const PADDING_BOTTOM = 60
  const contentW = W - PADDING_X * 2
  const SECTION_GAP = 28 // uniform gap between sections

  // Theme
  const BG_TOP = '#0b1117'
  const BG_BOTTOM = '#131c25'
  const CARD_BG = '#0f1721'
  const BORDER = 'rgba(212,164,74,0.25)'
  const ACCENT = '#d4a44a'
  const TEXT = '#e6e6e6'
  const LABEL_CLR = '#d4a44a'

  // Font stacks
  const ARABIC_FONT = "'Amiri', 'Scheherazade New', 'Traditional Arabic', serif"
  const TELUGU_FONT = "'Noto Sans Telugu', 'Mallanna', system-ui, sans-serif"
  const UI_FONT = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"

  // Sections (built first to measure total height)
  const measure = document.createElement('canvas').getContext('2d')
  const sections = []

  // Header — surah name centered at top
  sections.push({ type: 'header', h: 50 })
  sections.push({ type: 'gap', h: 60 })

  if (arabic) {
    measure.font = `56px ${ARABIC_FONT}`
    const lines = wrapLines(measure, arabic, contentW)
    sections.push({ type: 'arabic', lines, lineHeight: 140, h: lines.length * 140 + 40 })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (roman) {
    sections.push({ type: 'label', text: 'Transliteration', h: 30 })
    measure.font = `italic 26px ${UI_FONT}`
    const lines = wrapLines(measure, roman, contentW)
    sections.push({ type: 'body', lines, lineHeight: 40, font: `italic 26px ${UI_FONT}`, color: TEXT, h: lines.length * 40 + 16 })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (teluguRoman) {
    sections.push({ type: 'label', text: 'తెలుగు లిప్యంతరీకరణ', h: 30, font: TELUGU_FONT })
    measure.font = `26px ${TELUGU_FONT}`
    const lines = wrapLines(measure, teluguRoman, contentW)
    sections.push({ type: 'body', lines, lineHeight: 42, font: `26px ${TELUGU_FONT}`, color: TEXT, h: lines.length * 42 + 16 })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (telugu) {
    sections.push({ type: 'label', text: 'తెలుగు', h: 30, font: TELUGU_FONT })
    measure.font = `28px ${TELUGU_FONT}`
    const lines = wrapLines(measure, telugu, contentW)
    sections.push({ type: 'body', lines, lineHeight: 44, font: `28px ${TELUGU_FONT}`, color: TEXT, h: lines.length * 44 + 16 })
    sections.push({ type: 'gap', h: SECTION_GAP })
  }

  if (english) {
    sections.push({ type: 'label', text: 'English', h: 30 })
    measure.font = `26px ${UI_FONT}`
    const lines = wrapLines(measure, english, contentW)
    sections.push({ type: 'body', lines, lineHeight: 40, font: `26px ${UI_FONT}`, color: TEXT, h: lines.length * 40 + 16 })
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

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, BG_TOP)
  grad.addColorStop(1, BG_BOTTOM)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Inner "card" with subtle border — equal margin all sides
  const CARD_MARGIN = 30
  const cardX = CARD_MARGIN
  const cardY = CARD_MARGIN
  const cardW = W - CARD_MARGIN * 2
  const cardH = H - CARD_MARGIN * 2
  const radius = 20
  ctx.fillStyle = CARD_BG
  roundRect(ctx, cardX, cardY, cardW, cardH, radius)
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = BORDER
  roundRect(ctx, cardX, cardY, cardW, cardH, radius)
  ctx.stroke()

  // Render sections
  let y = PADDING_TOP
  for (const sec of sections) {
    if (sec.type === 'gap') {
      // just spacing
    } else if (sec.type === 'header') {
      // Surah name centered — vertically middle of header height
      ctx.fillStyle = ACCENT
      ctx.font = `600 24px ${UI_FONT}`
      ctx.textAlign = 'center'
      ctx.fillText(`${surahName || `Surah ${surahNumber}`} • ${surahNumber}:${verseNumber}`, W / 2, y + sec.h / 2)
      ctx.textAlign = 'left'
    } else if (sec.type === 'arabic') {
      ctx.fillStyle = TEXT
      ctx.font = `56px ${ARABIC_FONT}`
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
      ctx.font = `600 15px ${sec.font || UI_FONT}`
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
const VerseCard = memo(({ verse, surahNumber, surahName, showArabic, fontSize, playingVerse, onPlay, onBookmark, isFav, onToggleFav, transliteration, isBookmarked, reciter }) => {
  const [justBookmarked, setJustBookmarked] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef(null)

  const handleDownload = useCallback(async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const teluguRoman = verse.roman ? romanToTelugu(verse.roman) : ''
      const dataUrl = await renderVerseImage({
        surahNumber,
        surahName,
        verseNumber: verse.number,
        arabic: verse.arabic || '',
        roman: verse.roman || '',
        teluguRoman,
        telugu: verse.telugu || '',
        english: verse.translation || '',
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
  }, [downloading, surahName, surahNumber, verse])

  const handleBookmarkClick = useCallback(() => {
    onBookmark(verse.number)
    setJustBookmarked(true)
    setTimeout(() => setJustBookmarked(false), 1500)
  }, [onBookmark, verse.number])

  // Memoize Telugu transliteration to avoid recomputing on every render
  const teluguTranslit = useMemo(() => verse.roman ? romanToTelugu(verse.roman) : null, [verse.roman])

  return (
    <div ref={cardRef} className={`verse-card ${justBookmarked ? 'verse-bookmarked' : ''}`} id={`verse-${verse.number}`}>
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
          <AudioPlayer
            audioUrl={getVerseAudioUrl(surahNumber, verse.number, reciter)}
            verseNumber={verse.number}
            isGlobalPlaying={playingVerse}
            onPlay={onPlay}
          />
        </div>
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
      <div className="vc-columns">
        <div className="vc-col">
          <span className="vc-label">తెలుగు</span>
          <p className="vc-telugu" style={{ fontSize: `${fontSize}px` }}>
            {verse.telugu || '—'}
          </p>
        </div>
      </div>

      {/* English translation */}
      <div className="vc-translation">
        <span className="vc-label">English</span>
        <p style={{ fontSize: `${fontSize - 1}px` }}>
          {verse.translation || '—'}
        </p>
      </div>


    </div>
  )
})
VerseCard.displayName = 'VerseCard'

function VerseView() {
  const { number } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showArabic, fontSize, updateLastRead, lastRead, favorites, isFavorite, toggleFavorite, transliteration, reciter } = useSettings()

  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [bismillah, setBismillah] = useState(null)
  const [playingVerse, setPlayingVerse] = useState(null)
  const [isSurahPlaying, setIsSurahPlaying] = useState(false)
  const [bookmarkToast, setBookmarkToast] = useState(null)
  const [visibleCount, setVisibleCount] = useState(30)
  const surahAudioRef = useRef(null)
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
    }
  }, [])

  const handleBack = useCallback(() => navigate('/surahs'), [navigate])
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
    setPlayingVerse(verseNum)
  }, [])

  const handleBookmark = useCallback((verseNum) => {
    if (surah) {
      updateLastRead(surahNumber, surah.name, verseNum)
      setBookmarkToast(`Saved: ${surah.name}, Verse ${verseNum} — Use "Continue Reading" on Home page`)
      setTimeout(() => setBookmarkToast(null), 3000)
    }
  }, [surah, surahNumber, updateLastRead])

  const handleToggleFav = useCallback((verseNum, arabic, translation) => {
    if (surah) toggleFavorite(surahNumber, surah.name, verseNum, arabic, translation)
  }, [surah, surahNumber, toggleFavorite])

  const handleSurahPlay = useCallback(async () => {
    if (isSurahPlaying) {
      surahAudioRef.current?.pause()
      setIsSurahPlaying(false)
      return
    }

    setPlayingVerse(null) // Stop any verse audio

    if (!surahAudioRef.current || surahAudioRef.current._reciter !== reciter) {
      if (surahAudioRef.current) {
        surahAudioRef.current.pause()
        surahAudioRef.current.src = ''
      }
      surahAudioRef.current = new Audio(getSurahAudioUrl(surahNumber, reciter))
      surahAudioRef.current._reciter = reciter
      surahAudioRef.current.addEventListener('ended', () => setIsSurahPlaying(false))
      surahAudioRef.current.addEventListener('error', () => setIsSurahPlaying(false))
    }

    try {
      await surahAudioRef.current.play()
      setIsSurahPlaying(true)
    } catch {
      setIsSurahPlaying(false)
    }
  }, [isSurahPlaying, surahNumber, reciter])



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
      </header>

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
      <div className="vv-verses">
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
                showArabic={showArabic}
                fontSize={fontSize}
                playingVerse={playingVerse}
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
