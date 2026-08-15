import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { RECITERS, surahs, getSurahVerses, getVerseAudioUrl } from '../data/quranData'
import { romanToTelugu } from '../utils/teluguTransliteration'
import AudioPlayer from '../components/AudioPlayer'
import './Home.css'

// Static counts — avoid importing large data modules on the home page
const COUNTS = { namaz: 8, duas: 24, dosdonts: 45, asma: 99, adhkar: 14, isa: 60, seerah: 48 }

// Theme image URLs — JPG for all themes for universal compatibility
// (iPhone iOS < 16 can't decode AVIF). Version query strings bust cached
// copies on devices where a previous file at the same URL is still stored.
const THEME_URL = {
  'first-theme':  '/first-theme.jpg',
  'second-theme': '/second-theme.png',
  'third-theme':  '/third-theme.jpg',
  'fourth-theme': '/fourth-theme.jpg?v=kaba2',
}

// Memoized reciter picker for Home page
const ReciterPicker = memo(({ reciter, onSelect, transliteration }) => {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const barRef = useRef(null)
  const activeRef = useRef(null)

  const currentName = useMemo(() => RECITERS.find(r => r.id === reciter)?.name || 'Yasser Ad-Dussary', [reciter])

  const filtered = useMemo(() => {
    if (!filter) return RECITERS
    const q = filter.toLowerCase()
    return RECITERS.filter(r => r.name.toLowerCase().includes(q) || r.nameAr.includes(filter))
  }, [filter])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    // Passive: true tells the browser this touch handler will NEVER call
    // preventDefault, so scroll gestures inside the dropdown list don't get
    // held up waiting to see if we might cancel them.
    document.addEventListener('touchstart', handler, { passive: true })
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') { setOpen(false); setFilter('') } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (open && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [open])

  const handleSelect = useCallback((id) => {
    onSelect(id)
    setOpen(false)
    setFilter('')
  }, [onSelect])

  return (
    <div className="home-reciter-bar" ref={barRef}>
      <button className="home-reciter-toggle" onClick={() => { setOpen(p => !p); setFilter('') }} aria-label="Select reciter" aria-expanded={open}>
        <span className="home-reciter-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </span>
        <span className="home-reciter-info">
          <span className="home-reciter-label">{transliteration === 'telugu' ? 'ఖురాన్ రీసైటర్' : 'Quran Reciter'}</span>
          <span className="home-reciter-name">{currentName}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className={`home-reciter-chevron ${open ? 'rotated' : ''}`}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="home-reciter-dropdown" role="listbox" aria-label="Reciters">
          <div className="home-reciter-search">
            <input
              type="text"
              placeholder={transliteration === 'telugu' ? 'రీసైటర్ వెతకండి...' : 'Search reciter...'}
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label="Search reciters"
            />
          </div>
          <div className="home-reciter-list">
            {filtered.length === 0 && <div className="home-reciter-empty">{transliteration === 'telugu' ? 'రీసైటర్లు కనుగొనలేదు' : 'No reciters found'}</div>}
            {filtered.map(r => (
              <button
                key={r.id}
                ref={reciter === r.id ? activeRef : null}
                className={`home-reciter-option ${reciter === r.id ? 'active' : ''}`}
                onClick={() => handleSelect(r.id)}
                role="option"
                aria-selected={reciter === r.id}
              >
                <span className="home-reciter-option-name">{r.name}</span>
                <span className="home-reciter-option-ar" dir="rtl">{r.nameAr}</span>
                {reciter === r.id && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" className="home-reciter-check">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
ReciterPicker.displayName = 'ReciterPicker'

const Home = React.memo(function Home() {
  const navigate = useNavigate()
  const { lastRead, favorites, transliteration, setTransliteration, reciter, setReciter, showArabic, fontSize, bgImage, setBgImage, theme, setTheme } = useSettings()

  // Quick Verse Lookup state
  const [qvSurah, setQvSurah] = useState('')
  const [qvVerse, setQvVerse] = useState('')
  const [qvData, setQvData] = useState(null)
  const [qvLoading, setQvLoading] = useState(false)
  const [qvError, setQvError] = useState('')
  const [qvClosing, setQvClosing] = useState(false)
  const [qvPlaying, setQvPlaying] = useState(null)
  const [qvDropOpen, setQvDropOpen] = useState(false)
  const [qvFilter, setQvFilter] = useState('')
  const qvDropRef = useRef(null)

  // Contact / info modal — separate open + closing states so exit animation runs
  const [infoOpen, setInfoOpen] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const closeInfoModal = useCallback(() => {
    setInfoClosing(true)
    // Match the reverse-stagger exit (~360ms) + modal 3D-tilt out (320ms)
    setTimeout(() => { setInfoOpen(false); setInfoClosing(false) }, 380)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!qvDropOpen) return
    const handler = (e) => { if (qvDropRef.current && !qvDropRef.current.contains(e.target)) setQvDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [qvDropOpen])

  const qvFilteredSurahs = useMemo(() => {
    if (!qvFilter) return surahs
    const q = qvFilter.toLowerCase()
    return surahs.filter(s => s.name.toLowerCase().includes(q) || s.nameEnglish.toLowerCase().includes(q) || (s.nameTelugu && s.nameTelugu.includes(qvFilter)) || String(s.number).includes(q))
  }, [qvFilter])

  const handleQvPlay = useCallback((verseNum) => {
    setQvPlaying(verseNum)
  }, [])

  const qvSelectedSurah = useMemo(() => {
    if (!qvSurah) return null
    return surahs.find(s => s.number === parseInt(qvSurah))
  }, [qvSurah])

  const handleQvSearch = useCallback(async () => {
    const s = parseInt(qvSurah)
    const v = parseInt(qvVerse)
    if (!s || s < 1 || s > 114) { setQvError('Select a valid Surah'); return }
    if (!v || v < 1) { setQvError('Enter a valid verse number'); return }
    const surahInfo = surahs.find(su => su.number === s)
    if (v > surahInfo.ayahs) { setQvError(`Surah ${surahInfo.name} has only ${surahInfo.ayahs} verses`); return }
    setQvError('')
    setQvLoading(true)
    try {
      const verses = await getSurahVerses(s)
      const verse = verses.find(vr => vr.number === v)
      if (verse) {
        setQvData({ verse, surahName: surahInfo.name, surahNameTelugu: surahInfo.nameTelugu, surahNumber: s })
      } else {
        setQvError('Verse not found')
      }
    } catch {
      setQvError('Failed to load verse. Try again.')
    } finally {
      setQvLoading(false)
    }
  }, [qvSurah, qvVerse])

  const closeQvModal = useCallback(() => {
    setQvClosing(true)
    setQvPlaying(null)
    // Wait for the reverse-stagger children (~120ms) + modal 3D-tilt out (320ms)
    setTimeout(() => {
      setQvData(null)
      setQvClosing(false)
    }, 380)
  }, [])

  useEffect(() => {
    const themes = ['first-theme', 'second-theme', 'third-theme', 'fourth-theme']
    themes.forEach(t => {
      const img = new Image()
      img.src = THEME_URL[t]
    })
    // Migration: if a previously-selected theme is no longer valid, fall back
    if (bgImage && !themes.includes(bgImage)) setBgImage('first-theme')
  }, [bgImage, setBgImage, THEME_URL])

  // High-priority preload for the ACTIVE theme — tells the browser to fetch
  // it as part of the critical rendering path, so route-return re-mounts
  // paint the hero image without a visible gap.
  useEffect(() => {
    const url = THEME_URL[bgImage] || THEME_URL['first-theme']
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    if (url.endsWith('.avif')) link.type = 'image/avif'
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [bgImage, THEME_URL])

  // Gyroscope / parallax effect for hero
  const heroRef = useRef(null)
  const bgRef = useRef(null)
  const contentRef = useRef(null)
  const tilt = useRef({ x: 0, y: 0 })
  const rafId = useRef(null)

  const applyTilt = useCallback(() => {
    if (bgRef.current) {
      // Lightly zoom out — scale reduced from 1.04 → 1.0 so the image sits at
      // its natural cover size (more of the photo visible, less cropped).
      // Parallax translate also halved so edges never expose during tilt.
      bgRef.current.style.transform = `translate(${tilt.current.x * 5}px, ${tilt.current.y * 4}px) scale(1.0)`
    }
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${tilt.current.x * -6}px, ${tilt.current.y * -4}px)`
    }
  }, [])

  useEffect(() => {
    // Mouse parallax (desktop)
    const handleMouse = (e) => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      if (e.clientY > rect.bottom) return
      const cx = (e.clientX / window.innerWidth - 0.5) * 2
      const cy = (e.clientY / rect.height - 0.5) * 2
      tilt.current = { x: cx, y: cy }
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          applyTilt()
          rafId.current = null
        })
      }
    }

    // Gyroscope (mobile)
    const handleOrientation = (e) => {
      const x = Math.max(-1, Math.min(1, (e.gamma || 0) / 30))
      const y = Math.max(-1, Math.min(1, (e.beta || 0 - 45) / 30))
      tilt.current = { x, y }
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          applyTilt()
          rafId.current = null
        })
      }
    }

    window.addEventListener('mousemove', handleMouse, { passive: true })
    window.addEventListener('deviceorientation', handleOrientation, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('deviceorientation', handleOrientation)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [applyTilt])

  const handleReadQuran = useCallback(() => navigate('/surahs'), [navigate])
  const handleFavorites = useCallback(() => navigate('/favorites'), [navigate])
  const handleContinue = useCallback(() => {
    if (lastRead) {
      navigate(`/surah/${lastRead.surahNumber}?verse=${lastRead.verseNumber || 1}&t=${Date.now()}`)
    }
  }, [navigate, lastRead])

  return (
    <div className="home" data-bg={bgImage}>

      {/* Hero Section */}
      <header className="home-hero hero-no-blur" ref={heroRef}>
        <div className="hero-bg-img" ref={bgRef} style={{ backgroundImage: `url(${THEME_URL[bgImage] || THEME_URL['first-theme']})` }} />
        <div className="hero-pattern" />
        <div className="hero-content" ref={contentRef}>
          <div className="hero-icon">﷽</div>
          <h1 className="hero-title">The Holy Quran</h1>
          <h2 className="hero-subtitle">القرآن الكريم</h2>
          <p className="hero-telugu">పవిత్ర ఖురాన్</p>
          <div className="hero-divider">
            <span className="divider-ornament">✦</span>
          </div>
          <p className="hero-desc">
            {transliteration === 'telugu' ? 'అల్లాహ్ మాటలను చదవండి, వినండి & అర్థం చేసుకోండి' : 'Read, Listen & Understand the words of Allah'}
          </p>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-num">114</span>
          <span className="stat-label">{transliteration === 'telugu' ? 'సూరాలు' : 'Surahs'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">6236</span>
          <span className="stat-label">{transliteration === 'telugu' ? 'ఆయతులు' : 'Verses'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">30</span>
          <span className="stat-label">{transliteration === 'telugu' ? 'పారాలు' : 'Juz'}</span>
        </div>
      </section>

      {/* Continue Reading */}
      {lastRead && (
        <section className="continue-section">
          <button className="continue-card" onClick={handleContinue}>
            <div className="continue-icon"></div>
            <div className="continue-info">
              <span className="continue-label">{transliteration === 'telugu' ? 'చదవడం కొనసాగించు' : 'Continue Reading'}</span>
              <span className="continue-surah">{lastRead.surahName}</span>
              <span className="continue-verse">{transliteration === 'telugu' ? 'ఆయత్' : 'Verse'} {lastRead.verseNumber || 1}</span>
            </div>
            <svg className="continue-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </section>
      )}

      {/* Quick Verse Lookup */}
      <section className="qv-section">
        <div className="qv-box">
        <h3 className="qv-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {transliteration === 'telugu' ? 'ఆయత్ వెతుకు' : 'Quick Verse Lookup'}
        </h3>
        <div className="qv-controls">
          <div className="qv-select-wrap" ref={qvDropRef}>
            <div className="qv-select" onClick={() => setQvDropOpen(p => !p)}>
              <span className="qv-select-label">
                {qvSurah ? `${qvSurah}. ${(() => { const found = surahs.find(s => s.number === parseInt(qvSurah)); return transliteration === 'telugu' ? (found?.nameTelugu || found?.name || '') : (found?.name || ''); })()}` : (transliteration === 'telugu' ? 'సూరా ఎంచుకోండి' : 'Select Surah')}
              </span>
              <svg className="qv-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{transform: qvDropOpen ? 'rotate(180deg)' : 'none', transition: '0.2s'}}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
            {qvDropOpen && (
              <div className="qv-dropdown">
                <input
                  className="qv-drop-search"
                  placeholder={transliteration === 'telugu' ? 'సూరా వెతుకు...' : 'Search surah...'}
                  value={qvFilter}
                  onChange={e => setQvFilter(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <ul className="qv-drop-list">
                  {qvFilteredSurahs.map(s => (
                    <li
                      key={s.number}
                      className={`qv-drop-item${String(s.number) === qvSurah ? ' active' : ''}`}
                      onClick={() => { setQvSurah(String(s.number)); setQvVerse(''); setQvError(''); setQvDropOpen(false); setQvFilter('') }}
                    >
                      {s.number}. {transliteration === 'telugu' ? (s.nameTelugu || s.name) : s.name} ({transliteration === 'telugu' ? s.name : s.nameEnglish})
                    </li>
                  ))}
                  {qvFilteredSurahs.length === 0 && <li className="qv-drop-empty">No results</li>}
                </ul>
              </div>
            )}
          </div>
          <input
            type="number"
            className="qv-verse-input"
            placeholder={qvSelectedSurah ? `${transliteration === 'telugu' ? 'ఆయత్' : 'Verse'} (1-${qvSelectedSurah.ayahs})` : (transliteration === 'telugu' ? 'ఆయత్' : 'Verse')}
            value={qvVerse}
            onChange={e => { setQvVerse(e.target.value); setQvError('') }}
            onKeyDown={e => e.key === 'Enter' && handleQvSearch()}
            min="1"
            max={qvSelectedSurah?.ayahs || 286}
          />
          <button className="qv-go-btn" onClick={handleQvSearch} disabled={qvLoading}>
            {qvLoading ? (
              <span className="qv-spinner" />
            ) : (
              <>{transliteration === 'telugu' ? 'చూడు' : 'View'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
            )}
          </button>
        </div>
        {qvError && <p className="qv-error">{qvError}</p>}
        </div>
      </section>

      {/* Action Cards — 2x2 Grid */}
      <section className="action-cards">
        <button className="action-card read-card" onClick={handleReadQuran}>
          <h3>{transliteration === 'telugu' ? 'ఖురాన్ చదవండి' : 'Read Quran'}</h3>
          {transliteration !== 'telugu' && <p>ఖురాన్ చదవండి</p>}
          <span className="action-meta">{transliteration === 'telugu' ? 'మొత్తం 114 సూరాలు' : 'All 114 Surahs'}</span>
        </button>

        <button className="action-card namaz-action-card" onClick={() => navigate('/namaz')}>
          <h3>{transliteration === 'telugu' ? 'నమాజ్ సూరాలు' : 'Namaz Surahs'}</h3>
          {transliteration !== 'telugu' && <p>నమాజ్ సూరాలు</p>}
          <span className="action-meta">{COUNTS.namaz} {transliteration === 'telugu' ? 'సూరాలు' : 'Surahs'}</span>
        </button>

        <button className="action-card duas-action-card" onClick={() => navigate('/duas')}>
          <h3>{transliteration === 'telugu' ? 'దుఆలు' : 'Duas'}</h3>
          {transliteration !== 'telugu' && <p>దుఆలు</p>}
          <span className="action-meta">{COUNTS.duas} {transliteration === 'telugu' ? 'దుఆలు' : 'Duas'}</span>
        </button>

        <button className="action-card dosdonts-action-card" onClick={() => navigate('/dos-and-donts')}>
          <h3>{transliteration === 'telugu' ? 'ఆదేశాలు & నిషేధాలు' : "Dos and Don'ts in Islam"}</h3>
          {transliteration !== 'telugu' && <p>ఆదేశాలు & నిషేధాలు</p>}
          <span className="action-meta">{COUNTS.dosdonts} {transliteration === 'telugu' ? 'అంశాలు' : 'Items'}</span>
        </button>

        <button className="action-card asma-action-card" onClick={() => navigate('/names-of-allah')}>
          <h3>{transliteration === 'telugu' ? 'అల్లాహ్ 99 నామాలు' : '99 Names of Allah'}</h3>
          {transliteration !== 'telugu' && <p>అల్లాహ్ 99 నామాలు</p>}
          <span className="action-meta">{COUNTS.asma} {transliteration === 'telugu' ? 'నామాలు' : 'Names'}</span>
        </button>

        <button className="action-card tasbih-action-card" onClick={() => navigate('/tasbih')}>
          <h3>{transliteration === 'telugu' ? 'తస్బీహ్ కౌంటర్' : 'Tasbih Counter'}</h3>
          {transliteration !== 'telugu' && <p>తస్బీహ్ కౌంటర్</p>}
          <span className="action-meta">{transliteration === 'telugu' ? 'డిజిటల్ ధిక్ర్' : 'Digital Dhikr'}</span>
        </button>

        <button className="action-card adhkar-action-card" onClick={() => navigate('/adhkar')}>
          <h3>{transliteration === 'telugu' ? 'ఉదయ సాయంత్ర అధ్కార్' : 'Morning & Evening Adhkar'}</h3>
          {transliteration !== 'telugu' && <p>ఉదయ సాయంత్ర అధ్కార్</p>}
          <span className="action-meta">{COUNTS.adhkar} {transliteration === 'telugu' ? 'అధ్కార్' : 'Adhkar'}</span>
        </button>

        <button className="action-card isa-action-card" onClick={() => navigate('/prophet-isa')}>
          <h3>{transliteration === 'telugu' ? 'ప్రవక్త ఈసా (అ)' : 'Prophet Isa (Jesus)'}</h3>
          {transliteration !== 'telugu' && <p>ప్రవక్త ఈసా (అ)</p>}
          <span className="action-meta">{COUNTS.isa} {transliteration === 'telugu' ? 'వచనాలు' : 'Verses'}</span>
        </button>

        <button className="action-card seerah-action-card" onClick={() => navigate('/prophet-muhammad')}>
          <h3>{transliteration === 'telugu' ? 'ప్రవక్త ﷺ జీవిత చరిత్ర' : 'Seerah — Prophet ﷺ Life'}</h3>
          {transliteration !== 'telugu' && <p>ప్రవక్త ﷺ జీవిత చరిత్ర</p>}
          <span className="action-meta">{COUNTS.seerah} {transliteration === 'telugu' ? 'సంఘటనలు' : 'Events'}</span>
        </button>

        <button className="action-card fav-card" onClick={handleFavorites}>
          <h3>{transliteration === 'telugu' ? 'ఇష్టమైనవి' : 'Favorites'}</h3>
          {transliteration !== 'telugu' && <p>ఇష్టమైనవి</p>}
          <span className="action-meta">{favorites.length} {transliteration === 'telugu' ? 'సేవ్ చేసినవి' : 'Saved'}</span>
        </button>
      </section>

      {/* Reciter Selection */}
      <section className="home-reciter-section">
        <h3 className="home-reciter-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          {transliteration === 'telugu' ? 'ఖురాన్ రీసైటర్' : 'Quran Reciter'}
        </h3>
        <p className="home-reciter-desc">{transliteration === 'telugu' ? 'ఆడియో ప్లేబ్యాక్ కోసం మీ ఇష్టమైన ఖురాన్ రీసైటర్‌ని ఎంచుకోండి' : 'Choose your preferred Quran reciter for audio playback'}</p>
        <ReciterPicker reciter={reciter} onSelect={setReciter} transliteration={transliteration} />
      </section>

      {/* Transliteration Preference */}
      <section className="translit-section">
        <h3 className="translit-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
          </svg>
          {transliteration === 'telugu' ? 'లిప్యంతరీకరణ శైలి' : 'Transliteration Style'}
        </h3>
        <p className="translit-desc">{transliteration === 'telugu' ? 'ఖురాన్ ఉచ్ఛారణను ఎలా చూపించాలో ఎంచుకోండి' : 'Choose how to display Quranic pronunciation'}</p>
        <div className="translit-options">
          <button
            className={`translit-btn ${transliteration === 'english' ? 'active' : ''}`}
            onClick={() => setTransliteration('english')}
          >
            <span className="translit-btn-label">Roman English</span>
            <span className="translit-btn-example">Bismillaahir Rahmaanir Raheem</span>
          </button>
          <button
            className={`translit-btn ${transliteration === 'telugu' ? 'active' : ''}`}
            onClick={() => setTransliteration('telugu')}
          >
            <span className="translit-btn-label">{transliteration === 'telugu' ? 'రోమన్ తెలుగు' : 'Roman Telugu'}</span>
            <span className="translit-btn-example">బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్</span>
          </button>
          <button
            className={`translit-btn ${transliteration === 'both' ? 'active' : ''}`}
            onClick={() => setTransliteration('both')}
          >
            <span className="translit-btn-label">{transliteration === 'telugu' ? 'రెండూ (Both)' : 'Both'}</span>
            <span className="translit-btn-example">{transliteration === 'telugu' ? 'ఇంగ్లీష్ + తెలుగు పక్కపక్కన' : 'English + Telugu side by side'}</span>
          </button>
        </div>
      </section>



      {/* Background Image Picker */}
        <section className="bg-picker-section">
          <h3 className="bg-picker-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
            </svg>
            {transliteration === 'telugu' ? 'నేపథ్య చిత్రం' : 'Background Image'}
          </h3>
          <p className="bg-picker-desc">{transliteration === 'telugu' ? 'హోమ్ పేజీ నేపథ్య చిత్రాన్ని ఎంచుకోండి' : 'Choose the home page background image'}</p>
          <div className="bg-picker-options">
            <button
              className={`bg-picker-card ${bgImage === 'first-theme' ? 'active' : ''}`}
              onClick={() => setBgImage('first-theme')}
            >
              <img src="/first-theme.jpg" alt="Green Arch" className="bg-picker-thumb" />
              <span className="bg-picker-label">{transliteration === 'telugu' ? 'ఆర్చ్ థీమ్' : 'Arch Theme'}</span>
            </button>
            <button
              className={`bg-picker-card ${bgImage === 'second-theme' ? 'active' : ''}`}
              onClick={() => setBgImage('second-theme')}
            >
              <img src="/second-theme.png" alt="Mosque at Dusk" className="bg-picker-thumb" />
              <span className="bg-picker-label">{transliteration === 'telugu' ? 'మసీదు థీమ్' : 'Mosque Theme'}</span>
            </button>
            <button
              className={`bg-picker-card ${bgImage === 'third-theme' ? 'active' : ''}`}
              onClick={() => setBgImage('third-theme')}
            >
              <img src="/third-theme.jpg" alt="Quba Masjid" className="bg-picker-thumb" />
              <span className="bg-picker-label">{transliteration === 'telugu' ? 'ఖుబా మసీదు' : 'Quba Masjid'}</span>
            </button>
            <button
              className={`bg-picker-card ${bgImage === 'fourth-theme' ? 'active' : ''}`}
              onClick={() => setBgImage('fourth-theme')}
            >
              <img src="/fourth-theme.jpg?v=kaba2" alt="Makkah - Kaaba" className="bg-picker-thumb" />
              <span className="bg-picker-label">{transliteration === 'telugu' ? 'మక్కా - కాబా' : 'Makkah — Kaaba'}</span>
            </button>
          </div>
        </section>

      {/* Dark Theme Toggle */}
      <section className="dark-theme-section">
        <button
          className={`dark-theme-toggle ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme(theme === 'dark' ? 'normal' : 'dark')}
        >
          <span className="dark-theme-track">
            <span className="dark-theme-knob">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            </span>
          </span>
        </button>
        <span className="dark-theme-label">
          {theme === 'dark'
            ? (transliteration === 'telugu' ? 'డార్క్ మోడ్' : 'DARK MODE')
            : (transliteration === 'telugu' ? 'లైట్ మోడ్' : 'LIGHT MODE')}
        </span>
      </section>

      {/* Contact / Info */}
      <section className="info-section">
        <button
          className="info-btn"
          onClick={() => { setInfoOpen(true); setInfoClosing(false) }}
          aria-label={transliteration === 'telugu' ? 'సపోర్ట్' : 'Support'}
        >
          <span className="info-btn-icon" aria-hidden="true">
            {/* Proper filled 'i' letter — round dot + rounded vertical bar */}
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <circle cx="12" cy="6" r="1.8"/>
              <rect x="10.4" y="9.6" width="3.2" height="9.4" rx="1.6"/>
            </svg>
          </span>
          <span className="info-btn-text">
            {transliteration === 'telugu' ? 'సపోర్ట్' : 'SUPPORT'}
          </span>
          <span className="info-btn-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width="14" height="14">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </span>
        </button>
      </section>

      {/* Quote */}
      <footer className="home-footer">
        <blockquote className="footer-quote">
          {transliteration === 'telugu'
            ? '"మరియు నిశ్చయంగా మేము ఖురాన్‌ను స్మరణ కొరకు సులభం చేశాము, కావున స్మరించేవారు ఎవరైనా ఉన్నారా?"'
            : '"And We have certainly made the Quran easy for remembrance, so is there any who will remember?"'
          }
        </blockquote>
        <cite className="footer-ref">{transliteration === 'telugu' ? '— సూరహ్ అల్-ఖమర్ 54:17' : '— Surah Al-Qamar 54:17'}</cite>
      </footer>

      {/* Quick Verse Modal */}
      {qvData && createPortal(
        <div className={`qv-overlay${qvClosing ? ' closing' : ''}`} onClick={closeQvModal}>
          <div className={`qv-modal${qvClosing ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
            {/* Top bar: audio + close */}
            <div className="qv-modal-topbar">
              <div className="qv-modal-audio">
                <AudioPlayer
                  audioUrl={getVerseAudioUrl(qvData.surahNumber, qvData.verse.number, reciter)}
                  verseNumber={qvData.verse.number}
                  isGlobalPlaying={qvPlaying}
                  onPlay={handleQvPlay}
                />
              </div>
              <button className="qv-modal-close" onClick={closeQvModal} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Header */}
            <div className="qv-modal-header">
              <span className="qv-modal-surah">{transliteration === 'telugu' ? (qvData.surahNameTelugu || qvData.surahName) : qvData.surahName}</span>
              <span className="qv-modal-ayah">{transliteration === 'telugu' ? 'ఆయత్' : 'Verse'} {qvData.verse.number}</span>
            </div>

            {/* Scrollable content */}
            <div className="qv-modal-scroll">
              {showArabic && qvData.verse.arabic && (
                <div className="qv-modal-arabic" dir="rtl">
                  <p>{qvData.verse.arabic}</p>
                </div>
              )}
              <div className="qv-modal-body">
                {(transliteration === 'english' || transliteration === 'both') && qvData.verse.roman && (
                  <div className="qv-modal-block">
                    <span className="qv-modal-label">Transliteration</span>
                    <p className="qv-modal-roman">{qvData.verse.roman}</p>
                  </div>
                )}
                {(transliteration === 'telugu' || transliteration === 'both') && qvData.verse.roman && (
                  <div className="qv-modal-block">
                    <span className="qv-modal-label">{transliteration === 'both' ? 'తెలుగు లిప్యంతరీకరణ' : 'తెలుగు'}</span>
                    <p className="qv-modal-telugu">{romanToTelugu(qvData.verse.roman)}</p>
                  </div>
                )}
                {(transliteration === 'telugu' || transliteration === 'both') && qvData.verse.telugu && (
                  <div className="qv-modal-block">
                    <span className="qv-modal-label">అర్థం</span>
                    <p className="qv-modal-telugu">{qvData.verse.telugu}</p>
                  </div>
                )}
                {(transliteration === 'english' || transliteration === 'both') && qvData.verse.translation && (
                  <div className="qv-modal-block">
                    <span className="qv-modal-label">Translation</span>
                    <p className="qv-modal-english">{qvData.verse.translation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Info / Contact Modal */}
      {infoOpen && createPortal(
        <div
          className={`info-overlay${infoClosing ? ' closing' : ''}`}
          onClick={closeInfoModal}
        >
          <div
            className={`info-modal${infoClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Corner ornaments */}
            <span className="info-corner info-corner-tl" aria-hidden="true"></span>
            <span className="info-corner info-corner-tr" aria-hidden="true"></span>
            <span className="info-corner info-corner-bl" aria-hidden="true"></span>
            <span className="info-corner info-corner-br" aria-hidden="true"></span>

            <button
              className="info-modal-close"
              onClick={closeInfoModal}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <div className="info-modal-body">
              {/* Medallion icon at the top */}
              <div className="info-medallion" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>

              <p className="info-salam" dir="rtl">
                السلام عليكم ورحمة الله وبركاته
              </p>
              {(transliteration === 'english' || transliteration === 'both') && (
                <p className="info-salam-roman">
                  Asalam alaikum wa rahamatullahi wa barakatuhu
                </p>
              )}
              {(transliteration === 'telugu' || transliteration === 'both') && (
                <p className="info-salam-telugu">
                  {romanToTelugu('Assalaamu alaikum wa rahmatullaahi wa barakaatuhu')}
                </p>
              )}

              <span className="info-divider" aria-hidden="true">
                <span className="info-divider-dot"></span>
              </span>

              <p className="info-message">
                {transliteration === 'telugu'
                  ? 'యాప్‌లో ఏవైనా టెక్స్ట్ లోపాలు లేదా తప్పులు కనిపించినా, లేదా ఈ వెబ్‌సైట్‌లో మీకు ఏదైనా ఇస్లామిక్ కంటెంట్ కావాలనుకుంటే, దయచేసి ఈ ఇమెయిల్ ద్వారా మమ్మల్ని సంప్రదించండి:'
                  : 'If you notice any text errors or mistakes in the app, or if you would like any Islamic content added to this website, please contact us via this email:'}
              </p>

              <a
                href="mailto:quranintelugu.support@gmail.com"
                className="info-email"
              >
                <span className="info-email-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <span className="info-email-text">quranintelugu.support@gmail.com</span>
              </a>

              <p className="info-jazak">
                {transliteration === 'telugu' ? '— జజాకల్లాహు ఖైరన్ —' : '— JazakAllahu Khairan —'}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})
Home.displayName = 'Home'

export default Home
