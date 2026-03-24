import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSurahVerses, surahs, fetchBismillah, getSurahAudioUrl } from '../data/quranData'
import { useSettings } from '../context/SettingsContext'
import AudioPlayer from '../components/AudioPlayer'
import './VerseView.css'

// Scroll to top button
const ScrollToTop = memo(() => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
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
const VerseCard = memo(({ verse, showArabic, fontSize, playingVerse, onPlay }) => {
  return (
    <div className="verse-card" id={`verse-${verse.number}`}>
      {/* Verse header with number and audio */}
      <div className="vc-header">
        <div className="vc-number">
          <span>{verse.number}</span>
        </div>
        <AudioPlayer
          audioUrl={verse.audioUrl}
          verseNumber={verse.number}
          isGlobalPlaying={playingVerse}
          onPlay={onPlay}
        />
      </div>

      {/* Arabic text */}
      {showArabic && verse.arabic && (
        <div className="vc-arabic">
          <p dir="rtl">{verse.arabic}</p>
        </div>
      )}

      {/* Transliteration + Telugu side by side */}
      <div className="vc-columns">
        <div className="vc-col">
          <span className="vc-label">Transliteration</span>
          <p className="vc-roman" style={{ fontSize: `${fontSize}px` }}>
            {verse.roman || '—'}
          </p>
        </div>
        <div className="vc-col">
          <span className="vc-label">తెలుగు</span>
          <p className="vc-telugu" style={{ fontSize: `${fontSize}px` }}>
            {verse.telugu || '—'}
          </p>
        </div>
      </div>

      {/* English translation */}
      <div className="vc-translation">
        <span className="vc-label">English — Sahih International</span>
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
  const navigate = useNavigate()
  const { showArabic, fontSize, updateLastRead } = useSettings()

  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [bismillah, setBismillah] = useState(null)
  const [playingVerse, setPlayingVerse] = useState(null)
  const [isSurahPlaying, setIsSurahPlaying] = useState(false)
  const surahAudioRef = useRef(null)

  const surahNumber = parseInt(number)
  const surah = useMemo(() => surahs.find(s => s.number === surahNumber), [surahNumber])

  // Load verses
  useEffect(() => {
    let cancelled = false
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
        // Fetch Bismillah for non-Fatiha, non-Tawbah surahs
        if (surahNumber !== 1 && surahNumber !== 9) {
          const bData = await fetchBismillah()
          if (!cancelled) setBismillah(bData)
        } else {
          if (!cancelled) setBismillah(null)
        }

        const data = await getSurahVerses(surahNumber)
        if (!cancelled) {
          setVerses(data)
          setLoading(false)
          if (surah) updateLastRead(surahNumber, surah.name)
        }
      } catch {
        if (!cancelled) { setError(true); setLoading(false) }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    load()
    return () => { cancelled = true }
  }, [surahNumber, surah, updateLastRead])

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

  const handleSurahPlay = useCallback(async () => {
    if (isSurahPlaying) {
      surahAudioRef.current?.pause()
      setIsSurahPlaying(false)
      return
    }

    setPlayingVerse(null) // Stop any verse audio

    if (!surahAudioRef.current) {
      surahAudioRef.current = new Audio(getSurahAudioUrl(surahNumber))
      surahAudioRef.current.addEventListener('ended', () => setIsSurahPlaying(false))
      surahAudioRef.current.addEventListener('error', () => setIsSurahPlaying(false))
    }

    try {
      await surahAudioRef.current.play()
      setIsSurahPlaying(true)
    } catch {
      setIsSurahPlaying(false)
    }
  }, [isSurahPlaying, surahNumber])

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

      {/* Verses */}
      <div className="vv-verses">
        {verses.length === 0 ? (
          <div className="vv-empty">
            <p>Unable to load verses. Please check your internet connection.</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          verses.map((verse, i) => (
            <VerseCard
              key={verse.number}
              verse={verse}
              showArabic={showArabic}
              fontSize={fontSize}
              playingVerse={playingVerse}
              onPlay={handleVersePlay}
            />
          ))
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

      <ScrollToTop />
    </div>
  )
}

export default VerseView
