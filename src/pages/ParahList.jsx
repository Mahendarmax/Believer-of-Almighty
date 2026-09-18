import React, { useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { juzList, getSurahByNumber } from '../data/quranData'
import { useSettings } from '../context/SettingsContext'
import './ParahList.css'

// Memoized juz (parah) card — mirrors the surah card layout
const ParahCard = memo(({ juz, onClick, transliteration }) => {
  const startSurah = getSurahByNumber(juz.startSurah)
  const startName = transliteration === 'telugu'
    ? (startSurah?.nameTelugu || startSurah?.name || '')
    : (startSurah?.name || '')
  return (
    <button className="parah-card" onClick={() => onClick(juz.number)}>
      <div className="pc-number">
        <span>{juz.number}</span>
      </div>
      <div className="pc-info">
        <h3 className="pc-arabic" dir="rtl">{juz.arabicName}</h3>
        <p className="pc-name">
          {transliteration === 'telugu' ? `పారా ${juz.number}` : `Juz ${juz.number}`} · {juz.name}
        </p>
      </div>
      <div className="pc-meta">
        <span className="pc-start">
          {transliteration === 'telugu' ? 'ప్రారంభం' : 'Starts'}
        </span>
        <span className="pc-start-surah">{startName} {juz.startSurah}:{juz.startAyah}</span>
      </div>
    </button>
  )
})
ParahCard.displayName = 'ParahCard'

function ParahList() {
  const navigate = useNavigate()
  const { transliteration } = useSettings()

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const handleParahClick = useCallback((num) => navigate(`/parah/${num}`), [navigate])

  return (
    <div className="parah-list-page">
      {/* Header */}
      <header className="pl-header">
        <button className="pl-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="pl-title-group">
          <h1 className="pl-title">{transliteration === 'telugu' ? 'పారా వారీగా' : 'Parah (Juz) Wise'}</h1>
          <span className="pl-subtitle">
            {transliteration === 'telugu' ? 'హఫీజ్ ఖురాన్ · 30 పారాలు (అరబిక్)' : 'Hafiz Quran · 30 Parts (Arabic)'}
          </span>
        </div>
      </header>

      {/* Parah grid */}
      <div className="parah-grid">
        {juzList.map((juz) => (
          <ParahCard
            key={juz.number}
            juz={juz}
            onClick={handleParahClick}
            transliteration={transliteration}
          />
        ))}
      </div>
    </div>
  )
}

export default ParahList
