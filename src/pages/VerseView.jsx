import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getSurahVerses, surahs, getSurahByNumber, fetchBismillah, getSurahAudioUrl, fetchVerseTafsir, getVerseAudioUrl } from '../data/quranData'
import { useSettings } from '../context/SettingsContext'
import { romanToTelugu } from '../utils/teluguTransliteration'
import AudioPlayer from '../components/AudioPlayer'
import { toPng } from 'html-to-image'
import './VerseView.css'

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
  const [tafsir, setTafsir] = useState(null)
  const [tafsirLoading, setTafsirLoading] = useState(false)
  const [showTafsir, setShowTafsir] = useState(false)
  const [justBookmarked, setJustBookmarked] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef(null)

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    try {
      // Clone the card OFF-SCREEN so the visible UI doesn't flicker, and so we can
      // safely strip interactive controls (buttons / audio player / context toggle)
      // to produce a clean, text-only HD image.
      const original = cardRef.current
      const clone = original.cloneNode(true)

      // Remove interactive / non-content elements from the clone
      const removeSelectors = [
        '.vc-actions',         // bookmark / favorite / download / audio buttons row
        '.vc-context',         // "Show Revelation Context" button + tafsir area
        '.vc-context-btn',
        'button',              // any leftover buttons
        'audio',
      ]
      removeSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove())
      })

      // Reformat header so the verse number sits alone, centered-left, with a
      // small surah label on the right — no action buttons.
      const header = clone.querySelector('.vc-header')
      if (header) {
        header.style.justifyContent = 'space-between'
        header.style.alignItems = 'center'
        const label = document.createElement('div')
        label.textContent = `${surahName || `Surah ${surahNumber}`} • ${surahNumber}:${verse.number}`
        label.style.cssText = 'font-size:13px;opacity:0.7;font-weight:500;letter-spacing:0.3px;'
        header.appendChild(label)
      }

      // Off-screen host — fixed width gives consistent HD output regardless of viewport
      const host = document.createElement('div')
      host.style.cssText = [
        'position:fixed',
        'top:0',
        'left:-10000px',
        'width:900px',
        'padding:24px',
        'background:#0f1419',
        'z-index:-1',
        'pointer-events:none',
      ].join(';')
      clone.style.margin = '0'
      clone.style.width = '100%'
      host.appendChild(clone)
      document.body.appendChild(host)

      try {
        const bg = getComputedStyle(original).backgroundColor
        const safeBg = (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') ? '#0f1419' : bg

        const dataUrl = await toPng(clone, {
          cacheBust: true,
          pixelRatio: 3, // HD
          backgroundColor: safeBg,
        })

        const link = document.createElement('a')
        const safeName = (surahName || `surah-${surahNumber}`).replace(/[^\w\-]+/g, '_')
        link.download = `${safeName}_verse-${verse.number}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } finally {
        document.body.removeChild(host)
      }
    } catch (err) {
      console.error('Failed to download verse image:', err)
    } finally {
      setDownloading(false)
    }
  }, [downloading, surahName, surahNumber, verse.number])

  const handleBookmarkClick = useCallback(() => {
    onBookmark(verse.number)
    setJustBookmarked(true)
    setTimeout(() => setJustBookmarked(false), 1500)
  }, [onBookmark, verse.number])

  // Memoize Telugu transliteration to avoid recomputing on every render
  const teluguTranslit = useMemo(() => verse.roman ? romanToTelugu(verse.roman) : null, [verse.roman])

  const handleShowTafsir = useCallback(async () => {
    if (showTafsir) { setShowTafsir(false); return }
    if (tafsir) { setShowTafsir(true); return }
    setTafsirLoading(true)
    const text = await fetchVerseTafsir(surahNumber, verse.number)
    setTafsir(text)
    setTafsirLoading(false)
    setShowTafsir(true)
  }, [showTafsir, tafsir, surahNumber, verse.number])

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

      {/* Revelation Context / Tafsir */}
      <div className="vc-context">
        <button className="vc-context-btn" onClick={handleShowTafsir}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          {showTafsir ? 'Hide Context' : 'Show Revelation Context'}
        </button>
        {tafsirLoading && <p className="vc-context-loading">Loading...</p>}
        {showTafsir && tafsir && (
          <div className="vc-context-text">
            {tafsir.revelationType && (
              <div className="vc-revelation-badge">
                <span className={`vc-badge ${tafsir.revelationType === 'Meccan' ? 'meccan' : 'medinan'}`}>
                  {tafsir.revelationType === 'Meccan' ? '🕋' : '🕌'} Revealed in {tafsir.revelationType === 'Meccan' ? 'Makkah' : 'Madinah'}
                </span>
              </div>
            )}
            {tafsir.context && (
              <div className="vc-context-section">
                <span className="vc-label">📖 Revelation Context</span>
                <p style={{ fontSize: `${fontSize - 1}px` }}>{tafsir.context}</p>
              </div>
            )}
            {tafsir.historical && (
              <details className="vc-detailed-tafsir">
                <summary>📜 Historical Background (Ma'arif al-Qur'an)</summary>
                <p style={{ fontSize: `${fontSize - 1}px` }}>{tafsir.historical}</p>
              </details>
            )}
            {tafsir.detailed && (
              <details className="vc-detailed-tafsir">
                <summary>📚 Detailed Tafsir (Ibn Kathir)</summary>
                <p style={{ fontSize: `${fontSize - 1}px` }}>{tafsir.detailed}</p>
              </details>
            )}
          </div>
        )}
        {showTafsir && !tafsir && !tafsirLoading && (
          <p className="vc-context-none">No revelation context available for this verse</p>
        )}
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
      setBookmarkToast(`📌 Saved: ${surah.name}, Verse ${verseNum} — Use "Continue Reading" on Home page`)
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
