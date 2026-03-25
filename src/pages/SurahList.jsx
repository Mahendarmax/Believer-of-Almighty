import React, { useState, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { surahs } from '../data/quranData'
import './SurahList.css'

// Memoized surah card — prevents re-rendering unchanged cards during search
const SurahCard = memo(({ surah, onClick }) => (
  <button
    className="surah-card"
    onClick={() => onClick(surah.number)}
  >
    <div className="sc-number">
      <span>{surah.number}</span>
    </div>
    <div className="sc-info">
      <h3 className="sc-name">{surah.name}</h3>
      <p className="sc-english">{surah.nameEnglish}</p>
      <p className="sc-telugu">{surah.nameTelugu}</p>
    </div>
    <div className="sc-meta">
      <span className="sc-ayahs">{surah.ayahs} Ayahs</span>
      <span className={`sc-type ${surah.revelationType.toLowerCase()}`}>
        {surah.revelationType}
      </span>
    </div>
  </button>
))
SurahCard.displayName = 'SurahCard'

function SurahList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showGoTo, setShowGoTo] = useState(false)
  const [goSurah, setGoSurah] = useState('')
  const [goVerse, setGoVerse] = useState('')

  const handleBack = useCallback(() => navigate('/'), [navigate])
  const handleSurahClick = useCallback((num) => navigate(`/surah/${num}`), [navigate])

  const handleGoTo = useCallback(() => {
    const s = parseInt(goSurah)
    const v = parseInt(goVerse) || 1
    if (s >= 1 && s <= 114) {
      navigate(`/surah/${s}?verse=${v}`)
      setShowGoTo(false)
      setGoSurah('')
      setGoVerse('')
    }
  }, [goSurah, goVerse, navigate])

  const filteredSurahs = useMemo(() => {
    if (!searchTerm) return surahs
    const t = searchTerm.toLowerCase()
    return surahs.filter(s =>
      s.name.toLowerCase().includes(t) ||
      s.nameEnglish.toLowerCase().includes(t) ||
      s.nameTelugu.includes(searchTerm) ||
      s.number.toString().includes(t)
    )
  }, [searchTerm])

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
          <h1 className="sl-title">All Surahs</h1>
          <span className="sl-subtitle">114 Chapters of the Holy Quran</span>
        </div>
        <button className="sl-goto-btn" onClick={() => setShowGoTo(true)} aria-label="Go to verse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </header>

      {/* Compact Go To popup */}
      {showGoTo && (
        <div className="sl-goto-overlay" onClick={() => setShowGoTo(false)}>
          <div className="sl-goto-box" onClick={e => e.stopPropagation()}>
            <h3>Go to Surah & Verse</h3>
            <div className="sl-goto-fields">
              <input
                type="number"
                min="1"
                max="114"
                placeholder="Surah (1-114)"
                value={goSurah}
                onChange={e => setGoSurah(e.target.value)}
                autoFocus
              />
              <input
                type="number"
                min="1"
                placeholder="Verse (optional)"
                value={goVerse}
                onChange={e => setGoVerse(e.target.value)}
              />
            </div>
            <div className="sl-goto-actions">
              <button className="sl-goto-cancel" onClick={() => setShowGoTo(false)}>Cancel</button>
              <button className="sl-goto-go" onClick={handleGoTo}>Go</button>
            </div>
          </div>
        </div>
      )}

      {/* Inline search */}
      <div className="sl-search-wrap">
        <div className="sl-search-bar">
          <svg className="sl-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="sl-search-input"
            placeholder="Filter by name or number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="sl-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="sl-meta">
        {searchTerm ? (
          <span>{filteredSurahs.length} result{filteredSurahs.length !== 1 ? 's' : ''}</span>
        ) : (
          <span>Showing all 114 surahs</span>
        )}
      </div>

      {/* Surah grid */}
      {filteredSurahs.length === 0 ? (
        <div className="sl-empty">
          <p>No surahs found for "{searchTerm}"</p>
        </div>
      ) : (
        <div className="surah-grid">
          {filteredSurahs.map((surah) => (
            <SurahCard
              key={surah.id}
              surah={surah}
              onClick={handleSurahClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SurahList
