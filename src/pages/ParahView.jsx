import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJuzArabic, juzList, getSurahByNumber } from '../data/quranData'
import { useSettings } from '../context/SettingsContext'
import './ParahView.css'

// Scroll to top button — throttled scroll handler
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

// One surah section within the juz — decorative name header + continuous Arabic
const SurahSection = memo(({ surahNumber, verses, transliteration }) => {
  const surah = getSurahByNumber(surahNumber)
  return (
    <section className="pv-surah-section">
      <div className="pv-surah-divider">
        <span className="pv-divider-ornament">﴾</span>
        <div className="pv-surah-heading">
          <h2 className="pv-surah-arabic" dir="rtl">سُورَة {surah?.name}</h2>
          <span className="pv-surah-meta">
            {surahNumber}. {surah?.name}
            {(transliteration === 'telugu' || transliteration === 'both') && surah?.nameTelugu ? ` · ${surah.nameTelugu}` : ''}
          </span>
        </div>
        <span className="pv-divider-ornament">﴿</span>
      </div>
      <div className="pv-arabic-flow" dir="rtl">
        {verses.map((v) => (
          <span className="pv-ayah" key={v.ayah}>
            {v.arabic}
            <span className="pv-ayah-num" aria-label={`Ayah ${v.ayah}`}>{v.ayah}</span>
          </span>
        ))}
      </div>
    </section>
  )
})
SurahSection.displayName = 'SurahSection'

function ParahView() {
  const { number } = useParams()
  const navigate = useNavigate()
  const { transliteration } = useSettings()

  const juzNumber = parseInt(number)
  const juz = useMemo(() => juzList.find(j => j.number === juzNumber), [juzNumber])

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const data = await getJuzArabic(juzNumber)
        if (cancelled) return
        setGroups(data)
        setLoading(false)
        // Prefetch adjacent juz for instant navigation
        if (juzNumber < 30) getJuzArabic(juzNumber + 1).catch(() => {})
        if (juzNumber > 1) getJuzArabic(juzNumber - 1).catch(() => {})
      } catch (err) {
        if (cancelled) return
        setError(true)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [juzNumber])

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const handlePrev = useCallback(() => {
    if (juzNumber > 1) navigate(`/parah/${juzNumber - 1}`)
  }, [juzNumber, navigate])
  const handleNext = useCallback(() => {
    if (juzNumber < 30) navigate(`/parah/${juzNumber + 1}`)
  }, [juzNumber, navigate])

  if (loading) {
    return (
      <div className="pv-loading">
        <div className="pv-spinner" />
        <p>{transliteration === 'telugu' ? 'పారా లోడ్ అవుతోంది...' : 'Loading Parah...'}</p>
      </div>
    )
  }

  if (error || !juz) {
    return (
      <div className="pv-error">
        <p>{transliteration === 'telugu' ? 'పారా లోడ్ చేయడంలో విఫలమైంది. మీ కనెక్షన్‌ను తనిఖీ చేయండి.' : 'Failed to load Parah. Please check your connection.'}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <div className="parah-view">
      {/* Sticky header */}
      <header className="pv-header">
        <button className="pv-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="pv-title-group">
          <h1 className="pv-juz-name" dir="rtl">{juz.arabicName}</h1>
          <p className="pv-juz-sub">
            {transliteration === 'telugu' ? `పారా ${juz.number}` : `Juz ${juz.number}`} · {juz.name}
          </p>
        </div>
        <span className="pv-juz-badge">{juz.number}</span>
      </header>

      {/* Juz nav */}
      <div className="pv-nav">
        <button className="pv-nav-btn" onClick={handlePrev} disabled={juzNumber <= 1}>
          ← {transliteration === 'telugu' ? 'మునుపటి' : 'Previous'}
        </button>
        <span className="pv-nav-label">
          {transliteration === 'telugu' ? `పారా ${juzNumber} / 30` : `Juz ${juzNumber} of 30`}
        </span>
        <button className="pv-nav-btn" onClick={handleNext} disabled={juzNumber >= 30}>
          {transliteration === 'telugu' ? 'తరువాతి' : 'Next'} →
        </button>
      </div>

      {/* Arabic content — grouped by surah */}
      <div className="pv-content">
        {groups.length === 0 ? (
          <div className="pv-empty">
            <p>{transliteration === 'telugu' ? 'ఆయతులు లోడ్ చేయడం సాధ్యం కాలేదు.' : 'Unable to load verses.'}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          groups.map((g) => (
            <SurahSection
              key={g.surah}
              surahNumber={g.surah}
              verses={g.verses}
              transliteration={transliteration}
            />
          ))
        )}
      </div>

      {/* Bottom nav */}
      <div className="pv-bottom-nav">
        <button className="pv-nav-btn" onClick={handlePrev} disabled={juzNumber <= 1}>
          ← {transliteration === 'telugu' ? 'మునుపటి పారా' : 'Previous Parah'}
        </button>
        <button className="pv-nav-btn" onClick={handleNext} disabled={juzNumber >= 30}>
          {transliteration === 'telugu' ? 'తరువాతి పారా' : 'Next Parah'} →
        </button>
      </div>

      <ScrollToTop />
    </div>
  )
}

export default ParahView
