import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { RECITERS } from '../data/quranData'
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

// Bump ONLY when publishing a new APK binary (new permissions/native changes).
// Web-only updates auto-deploy via GitHub Pages — no bump needed.
const APK_BINARY_VERSION = '2.0'

const Home = React.memo(function Home() {
  const navigate = useNavigate()
  const { lastRead, favorites, transliteration, setTransliteration, reciter, setReciter } = useSettings()
  const [apkRelease, setApkRelease] = useState(null)
  const [showApkUpdateDialog, setShowApkUpdateDialog] = useState(false)
  const [downloadState, setDownloadState] = useState(null) // null | 'downloading' | 'done' | 'error'
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [upToDate, setUpToDate] = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    // Check if a new APK binary version is available
    const installed = localStorage.getItem('apk_installed_build')
    if (!installed) {
      localStorage.setItem('apk_installed_build', APK_BINARY_VERSION)
    } else if (parseFloat(APK_BINARY_VERSION) > parseFloat(installed)) {
      const dismissed = localStorage.getItem('apk_dismissed_build')
      if (dismissed !== APK_BINARY_VERSION) setShowApkUpdateDialog(true)
    }

    fetch('https://api.github.com/repos/Mahendarmax/Believer-of-Almighty/releases/tags/holy-quran-latest')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.id) setApkRelease(data) })
      .catch(() => {})
  }, [])

  // In-app self-update: download APK with progress then trigger Android installer
  const doSelfUpdate = useCallback(async () => {
    const apkUrl = apkRelease?.assets?.find(a => a.name.endsWith('.apk'))?.browser_download_url
      || 'https://github.com/Mahendarmax/Believer-of-Almighty/releases/download/holy-quran-latest/Holy-Quran.apk'

    setDownloadState('downloading')
    setDownloadProgress(0)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(apkUrl, {
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('HTTP ' + response.status)

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      const reader = response.body.getReader()
      const chunks = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        setDownloadProgress(
          total > 0
            ? Math.min(99, Math.round((received / total) * 100))
            : Math.min(90, Math.round((received / 8_000_000) * 100)) // ~8 MB estimate
        )
      }

      setDownloadProgress(100)
      const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'Holy-Quran-Update.apk'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000)

      localStorage.setItem('apk_dismissed_build', APK_BINARY_VERSION)
      setDownloadState('done')
    } catch (err) {
      if (err.name === 'AbortError') {
        setDownloadState(null)
        return
      }
      setDownloadState('error')
    }
  }, [apkRelease])

  const cancelDownload = useCallback(() => {
    abortRef.current?.abort()
    setDownloadState(null)
    setDownloadProgress(0)
  }, [])

  const openInBrowser = useCallback(() => {
    const apkUrl = apkRelease?.assets?.find(a => a.name.endsWith('.apk'))?.browser_download_url
      || 'https://github.com/Mahendarmax/Believer-of-Almighty/releases/download/holy-quran-latest/Holy-Quran.apk'
    window.open(apkUrl, '_system')
    setDownloadState(null)
    setShowApkUpdateDialog(false)
  }, [apkRelease])

  const handleApkUpdateLater = useCallback(() => {
    if (downloadState === 'downloading') abortRef.current?.abort()
    localStorage.setItem('apk_dismissed_build', APK_BINARY_VERSION)
    setShowApkUpdateDialog(false)
    setDownloadState(null)
    setDownloadProgress(0)
  }, [downloadState])

  const handleCheckUpdate = useCallback(async () => {
    setUpToDate(false)
    let release = apkRelease
    if (!release) {
      try {
        const r = await fetch('https://api.github.com/repos/Mahendarmax/Believer-of-Almighty/releases/tags/holy-quran-latest')
        const data = r.ok ? await r.json() : null
        if (data?.id) { setApkRelease(data); release = data }
      } catch {}
    }
    const installed = parseFloat(localStorage.getItem('apk_installed_build') || APK_BINARY_VERSION)
    if (parseFloat(APK_BINARY_VERSION) <= installed && !release?.assets?.length) {
      setUpToDate(true)
      setTimeout(() => setUpToDate(false), 3000)
      return
    }
    localStorage.removeItem('apk_dismissed_build')
    setDownloadState(null)
    setDownloadProgress(0)
    setShowApkUpdateDialog(true)
  }, [apkRelease])
  const handleFavorites = useCallback(() => navigate('/favorites'), [navigate])
  const handleContinue = useCallback(() => {
    if (lastRead) {
      navigate(`/surah/${lastRead.surahNumber}?verse=${lastRead.verseNumber || 1}&t=${Date.now()}`)
    }
  }, [navigate, lastRead])

  return (
    <div className="home">
      {/* APK Self-Update Dialog */}
      {showApkUpdateDialog && (
        <div className="apk-update-overlay">
          <div className="apk-update-modal">

            {/* ── Idle: prompt to update ── */}
            {!downloadState && (
              <>
                <div className="apk-update-icon">🔄</div>
                <h2 className="apk-update-title">Update Available</h2>
                <p className="apk-update-desc">A new version of Holy Quran is ready. The app will download and install the update automatically.</p>
                <div className="apk-update-actions">
                  <button className="apk-update-later" onClick={handleApkUpdateLater}>Later</button>
                  <button className="apk-update-download" onClick={doSelfUpdate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Update Now
                  </button>
                </div>
              </>
            )}

            {/* ── Downloading: progress bar ── */}
            {downloadState === 'downloading' && (
              <>
                <div className="apk-update-icon">⬇️</div>
                <h2 className="apk-update-title">Downloading Update</h2>
                <p className="apk-update-desc">Please wait while the update downloads...</p>
                <div className="apk-dl-progress-wrap">
                  <div className="apk-dl-progress-bar">
                    <div className="apk-dl-progress-fill" style={{ width: `${downloadProgress}%` }} />
                  </div>
                  <span className="apk-dl-progress-pct">{downloadProgress}%</span>
                </div>
                <button className="apk-update-later" style={{ width: '100%', marginTop: '4px' }} onClick={cancelDownload}>Cancel</button>
              </>
            )}

            {/* ── Done: install prompt ── */}
            {downloadState === 'done' && (
              <>
                <div className="apk-update-icon">✅</div>
                <h2 className="apk-update-title">Download Complete!</h2>
                <p className="apk-update-desc">The installation prompt should appear now. If not, open your Downloads folder and tap <strong>Holy-Quran-Update.apk</strong> to install.</p>
                <button className="apk-update-download" style={{ width: '100%' }} onClick={() => { setShowApkUpdateDialog(false); setDownloadState(null) }}>
                  Done
                </button>
              </>
            )}

            {/* ── Error: fallback to browser ── */}
            {downloadState === 'error' && (
              <>
                <div className="apk-update-icon">⚠️</div>
                <h2 className="apk-update-title">Download Failed</h2>
                <p className="apk-update-desc">In-app download could not complete. You can open it in the browser instead.</p>
                <div className="apk-update-actions">
                  <button className="apk-update-later" onClick={() => setDownloadState(null)}>Retry</button>
                  <button className="apk-update-download" onClick={openInBrowser}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Open in Browser
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

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
            <div className="continue-icon">📖</div>
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

      {/* Action Cards — 2x2 Grid */}
      <section className="action-cards">
        <button className="action-card read-card" onClick={handleReadQuran}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3>Read Quran</h3>
          <p>ఖురాన్ చదవండి</p>
          <span className="action-meta">All 114 Surahs</span>
        </button>

        <button className="action-card namaz-action-card" onClick={() => navigate('/namaz')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>
            </svg>
          </div>
          <h3>Namaz Surahs</h3>
          <p>నమాజ్ సూరాలు</p>
          <span className="action-meta">{COUNTS.namaz} Surahs</span>
        </button>

        <button className="action-card duas-action-card" onClick={() => navigate('/duas')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          <h3>Duas</h3>
          <p>దుఆలు</p>
          <span className="action-meta">{COUNTS.duas} Duas</span>
        </button>

        <button className="action-card dosdonts-action-card" onClick={() => navigate('/dos-and-donts')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6M9 14l2 2 4-4"/>
            </svg>
          </div>
          <h3>Dos and Don'ts in Islam</h3>
          <p>ఆదేశాలు & నిషేధాలు</p>
          <span className="action-meta">{COUNTS.dosdonts} Items</span>
        </button>

        <button className="action-card asma-action-card" onClick={() => navigate('/names-of-allah')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3>99 Names of Allah</h3>
          <p>అల్లాహ్ 99 నామాలు</p>
          <span className="action-meta">{COUNTS.asma} Names</span>
        </button>

        <button className="action-card tasbih-action-card" onClick={() => navigate('/tasbih')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h3>Tasbih Counter</h3>
          <p>తస్బీహ్ కౌంటర్</p>
          <span className="action-meta">Digital Dhikr</span>
        </button>

        <button className="action-card adhkar-action-card" onClick={() => navigate('/adhkar')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <h3>Morning & Evening Adhkar</h3>
          <p>ఉదయ సాయంత్ర అధ్కార్</p>
          <span className="action-meta">{COUNTS.adhkar} Adhkar</span>
        </button>

        <button className="action-card isa-action-card" onClick={() => navigate('/prophet-isa')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3>Prophet Isa (Jesus)</h3>
          <p>ప్రవక్త ఈసా (అ)</p>
          <span className="action-meta">{COUNTS.isa} Verses</span>
        </button>

        <button className="action-card seerah-action-card" onClick={() => navigate('/prophet-muhammad')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              <path d="M12 2l.5 1.5M12 2l-.5 1.5M17 5l-1.2 1M7 5l1.2 1"/>
            </svg>
          </div>
          <h3>Seerah — Prophet ﷺ Life</h3>
          <p>ప్రవక్త ﷺ జీవిత చరిత్ర</p>
          <span className="action-meta">{COUNTS.seerah} Events</span>
        </button>

        <button className="action-card fav-card" onClick={handleFavorites}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
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
        {upToDate && <p className="apk-up-to-date-msg">✓ App is up to date</p>}
        <button className="apk-check-update-btn" onClick={handleCheckUpdate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Check for Update
        </button>
      </footer>
    </div>
  )
})
Home.displayName = 'Home'

export default Home
