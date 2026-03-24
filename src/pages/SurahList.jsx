import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { surahs } from '../data/quranData'
import SearchBar from '../components/SearchBar'
import './SurahList.css'

function SurahList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = useCallback((term) => setSearchTerm(term), [])
  const handleBack = useCallback(() => navigate('/'), [navigate])
  const handleSurahClick = useCallback((num) => navigate(`/surah/${num}`), [navigate])

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
      </header>

      {/* Search */}
      <div className="sl-search-wrap">
        <SearchBar onSearch={handleSearch} placeholder="Search by name, number..." />
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
            <button
              key={surah.id}
              className="surah-card"
              onClick={() => handleSurahClick(surah.number)}
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
          ))}
        </div>
      )}
    </div>
  )
}

export default SurahList
