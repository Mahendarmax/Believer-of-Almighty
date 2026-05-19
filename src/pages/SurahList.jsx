import React, { useState, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { surahs } from '../data/quranData'
import { useSettings } from '../context/SettingsContext'
import './SurahList.css'

// Memoized surah card — prevents re-rendering unchanged cards during search
const SurahCard = memo(({ surah, onClick, transliteration }) => (
  <button
    className="surah-card"
    onClick={() => onClick(surah.number)}
  >
    <div className="sc-number">
      <span>{surah.number}</span>
    </div>
    <div className="sc-info">
      <h3 className="sc-name">{surah.name}</h3>
      {(transliteration === 'english' || transliteration === 'both') && (
        <p className="sc-english">{surah.nameEnglish}</p>
      )}
      {(transliteration === 'telugu' || transliteration === 'both') && (
        <p className="sc-telugu">{surah.nameTelugu}</p>
      )}
    </div>
    <div className="sc-meta">
      <span className="sc-ayahs">{surah.ayahs} {transliteration === 'telugu' ? 'ఆయతులు' : 'Ayahs'}</span>
      <span className={`sc-type ${surah.revelationType.toLowerCase()}`}>
        {surah.revelationType}
      </span>
    </div>
  </button>
))
SurahCard.displayName = 'SurahCard'

function SurahList() {
  const navigate = useNavigate()
  const { transliteration } = useSettings()
  const [navSurah, setNavSurah] = useState('')
  const [navVerse, setNavVerse] = useState('')

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const handleSurahClick = useCallback((num) => navigate(`/surah/${num}`), [navigate])

  const selectedSurahData = useMemo(() => {
    if (!navSurah) return null
    return surahs.find(s => s.number === parseInt(navSurah))
  }, [navSurah])

  const handleNavigate = useCallback(() => {
    const s = parseInt(navSurah)
    if (!s || s < 1 || s > 114) return
    const surahData = surahs.find(su => su.number === s)
    const maxVerse = surahData?.ayahs || 286
    let v = parseInt(navVerse) || 1
    if (v < 1) v = 1
    if (v > maxVerse) v = maxVerse
    navigate(`/surah/${s}?verse=${v}&t=${Date.now()}`)
  }, [navSurah, navVerse, navigate])

  return (
    <div className="surah-list-page">
      {/* Header */}
      <header className="sl-header">
        <button className="sl-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="sl-title-group">
          <h1 className="sl-title">{transliteration === 'telugu' ? 'అన్ని సూరాలు' : 'All Surahs'}</h1>
          <span className="sl-subtitle">{transliteration === 'telugu' ? 'పవిత్ర ఖురాన్ లోని 114 అధ్యాయాలు' : '114 Chapters of the Holy Quran'}</span>
        </div>
      </header>

      {/* Navigate to Surah & Verse */}
      <div className="sl-navigator">
        <h3 className="sl-nav-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          {transliteration === 'telugu' ? 'ఆయత్ కి వెళ్ళు' : 'Go to Verse'}
        </h3>
        <div className="sl-nav-controls">
          <div className="sl-nav-select-wrap">
            <select
              className="sl-nav-select"
              value={navSurah}
              onChange={e => { setNavSurah(e.target.value); setNavVerse('') }}
            >
              <option value="">{transliteration === 'telugu' ? 'సూరా ఎంచుకోండి' : 'Select Surah'}</option>
              {surahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.nameEnglish})
                </option>
              ))}
            </select>
            <svg className="sl-nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
          <input
            type="number"
            className="sl-nav-verse"
            placeholder={selectedSurahData ? `${transliteration === 'telugu' ? 'ఆయత్' : 'Verse'} (1-${selectedSurahData.ayahs})` : (transliteration === 'telugu' ? 'ఆయత్' : 'Verse')}
            value={navVerse}
            onChange={e => setNavVerse(e.target.value)}
            min="1"
            max={selectedSurahData?.ayahs || 286}
            disabled={!navSurah}
          />
          <button
            className="sl-nav-go"
            onClick={handleNavigate}
            disabled={!navSurah}
          >
            {transliteration === 'telugu' ? 'వెళ్ళు' : 'Go'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>



      {/* Surah grid */}
      <div className="surah-grid">
        {surahs.map((surah) => (
          <SurahCard
            key={surah.id}
            surah={surah}
            onClick={handleSurahClick}
            transliteration={transliteration}
          />
        ))}
      </div>
    </div>
  )
}

export default SurahList
