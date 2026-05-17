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

// Memoized reciter picker for Home page
const ReciterPicker = memo(({ reciter, onSelect }) => {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const barRef = useRef(null)
  const activeRef = useRef(null)

  const currentName = useMemo(() => RECITERS.find(r => r.id === reciter)?.name || 'Nasser Al-Qatami', [reciter])

  const filtered = useMemo(() => {
    if (!filter) return RECITERS
    const q = filter.toLowerCase()
    return RECITERS.filter(r => r.name.toLowerCase().includes(q) || r.nameAr.includes(filter))
  }, [filter])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
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
          <span className="home-reciter-label">Quran Reciter</span>
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
              placeholder="Search reciter..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              autoFocus
              aria-label="Search reciters"
            />
          </div>
          <div className="home-reciter-list">
            {filtered.length === 0 && <div className="home-reciter-empty">No reciters found</div>}
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
  const { lastRead, favorites, transliteration, setTransliteration, reciter, setReciter, showArabic, fontSize } = useSettings()

  // Quick Verse Lookup state
  const [qvSurah, setQvSurah] = useState('')
  const [qvVerse, setQvVerse] = useState('')
  const [qvData, setQvData] = useState(null)
  const [qvLoading, setQvLoading] = useState(false)
  const [qvError, setQvError] = useState('')
  const [qvClosing, setQvClosing] = useState(false)

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
        setQvData({ verse, surahName: surahInfo.name, surahNumber: s })
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
    setTimeout(() => {
      setQvData(null)
      setQvClosing(false)
    }, 280)
  }, [])

  useEffect(() => {}, [])

  const handleReadQuran = useCallback(() => navigate('/surahs'), [navigate])
  const handleFavorites = useCallback(() => navigate('/favorites'), [navigate])
  const handleContinue = useCallback(() => {
    if (lastRead) {
      navigate(`/surah/${lastRead.surahNumber}?verse=${lastRead.verseNumber || 1}&t=${Date.now()}`)
    }
  }, [navigate, lastRead])

  return (
    <div className="home">

      {/* Hero Section */}
      <header className="home-hero">
        <div className="hero-pattern" />
        <div className="hero-content">
          <div className="hero-icon">﷽</div>
          <h1 className="hero-title">The Holy Quran</h1>
          <h2 className="hero-subtitle">القرآن الكريم</h2>
          <p className="hero-telugu">పవిత్ర ఖురాన్</p>
          <div className="hero-divider">
            <span className="divider-ornament">✦</span>
          </div>
          <p className="hero-desc">
            Read, Listen & Understand the words of Allah
          </p>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-num">114</span>
          <span className="stat-label">Surahs</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">6236</span>
          <span className="stat-label">Verses</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">30</span>
          <span className="stat-label">Juz</span>
        </div>
      </section>

      {/* Continue Reading */}
      {lastRead && (
        <section className="continue-section">
          <button className="continue-card" onClick={handleContinue}>
            <div className="continue-icon"></div>
            <div className="continue-info">
              <span className="continue-label">Continue Reading</span>
              <span className="continue-surah">{lastRead.surahName}</span>
              <span className="continue-verse">Verse {lastRead.verseNumber || 1}</span>
            </div>
            <svg className="continue-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </section>
      )}

      {/* Quick Verse Lookup */}
      <section className="qv-section">
        <h3 className="qv-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {transliteration === 'telugu' ? 'ఆయత్ వెతుకు' : 'Quick Verse Lookup'}
        </h3>
        <div className="qv-controls">
          <div className="qv-select-wrap">
            <select
              className="qv-select"
              value={qvSurah}
              onChange={e => { setQvSurah(e.target.value); setQvVerse(''); setQvError('') }}
            >
              <option value="">{transliteration === 'telugu' ? 'సూరా ఎంచుకోండి' : 'Select Surah'}</option>
              {surahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.nameEnglish})
                </option>
              ))}
            </select>
            <svg className="qv-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M6 9l6 6 6-6"/>
            </svg>
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
      </section>

      {/* Action Cards — 2x2 Grid */}
      <section className="action-cards">
        <button className="action-card read-card" onClick={handleReadQuran}>
          <h3>Read Quran</h3>
          <p>ఖురాన్ చదవండి</p>
          <span className="action-meta">All 114 Surahs</span>
        </button>

        <button className="action-card namaz-action-card" onClick={() => navigate('/namaz')}>
          <h3>Namaz Surahs</h3>
          <p>నమాజ్ సూరాలు</p>
          <span className="action-meta">{COUNTS.namaz} Surahs</span>
        </button>

        <button className="action-card duas-action-card" onClick={() => navigate('/duas')}>
          <h3>Duas</h3>
          <p>దుఆలు</p>
          <span className="action-meta">{COUNTS.duas} Duas</span>
        </button>

        <button className="action-card dosdonts-action-card" onClick={() => navigate('/dos-and-donts')}>
          <h3>Dos and Don'ts in Islam</h3>
          <p>ఆదేశాలు & నిషేధాలు</p>
          <span className="action-meta">{COUNTS.dosdonts} Items</span>
        </button>

        <button className="action-card asma-action-card" onClick={() => navigate('/names-of-allah')}>
          <h3>99 Names of Allah</h3>
          <p>అల్లాహ్ 99 నామాలు</p>
          <span className="action-meta">{COUNTS.asma} Names</span>
        </button>

        <button className="action-card tasbih-action-card" onClick={() => navigate('/tasbih')}>
          <h3>Tasbih Counter</h3>
          <p>తస్బీహ్ కౌంటర్</p>
          <span className="action-meta">Digital Dhikr</span>
        </button>

        <button className="action-card adhkar-action-card" onClick={() => navigate('/adhkar')}>
          <h3>Morning & Evening Adhkar</h3>
          <p>ఉదయ సాయంత్ర అధ్కార్</p>
          <span className="action-meta">{COUNTS.adhkar} Adhkar</span>
        </button>

        <button className="action-card isa-action-card" onClick={() => navigate('/prophet-isa')}>
          <h3>Prophet Isa (Jesus)</h3>
          <p>ప్రవక్త ఈసా (అ)</p>
          <span className="action-meta">{COUNTS.isa} Verses</span>
        </button>

        <button className="action-card seerah-action-card" onClick={() => navigate('/prophet-muhammad')}>
          <h3>Seerah — Prophet ﷺ Life</h3>
          <p>ప్రవక్త ﷺ జీవిత చరిత్ర</p>
          <span className="action-meta">{COUNTS.seerah} Events</span>
        </button>

        <button className="action-card fav-card" onClick={handleFavorites}>
          <h3>Favorites</h3>
          <p>ఇష్టమైనవి</p>
          <span className="action-meta">{favorites.length} Saved</span>
        </button>
      </section>

      {/* Reciter Selection */}
      <section className="home-reciter-section">
        <h3 className="home-reciter-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          Quran Reciter
        </h3>
        <p className="home-reciter-desc">Choose your preferred Quran reciter for audio playback</p>
        <ReciterPicker reciter={reciter} onSelect={setReciter} />
      </section>

      {/* Transliteration Preference */}
      <section className="translit-section">
        <h3 className="translit-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
          </svg>
          Transliteration Style
        </h3>
        <p className="translit-desc">Choose how to display Quranic pronunciation</p>
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
            <span className="translit-btn-label">Roman Telugu</span>
            <span className="translit-btn-example">బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్</span>
          </button>
          <button
            className={`translit-btn ${transliteration === 'both' ? 'active' : ''}`}
            onClick={() => setTransliteration('both')}
          >
            <span className="translit-btn-label">Both</span>
            <span className="translit-btn-example">English + Telugu side by side</span>
          </button>
        </div>
      </section>

      {/* Quote */}
      <footer className="home-footer">
        <blockquote className="footer-quote">
          "And We have certainly made the Quran easy for remembrance, so is there any who will remember?"
        </blockquote>
        <cite className="footer-ref">— Surah Al-Qamar 54:17</cite>
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
              <span className="qv-modal-surah">{qvData.surahName}</span>
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
    </div>
  )
})
Home.displayName = 'Home'

export default Home
