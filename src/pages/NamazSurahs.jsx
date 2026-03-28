import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { namazSurahs } from '../data/namazAndDuas'
import './NamazSurahs.css'

function NamazSurahs() {
  const navigate = useNavigate()
  const [expandedNamaz, setExpandedNamaz] = useState(null)

  const handleBack = useCallback(() => navigate('/'), [navigate])

  return (
    <div className="namaz-page">
      <header className="namaz-page-header">
        <button className="namaz-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="namaz-page-title-group">
          <h1 className="namaz-page-title">🕌 Namaz Surahs</h1>
          <span className="namaz-page-subtitle">Surahs commonly recited during Salah (Prayer)</span>
        </div>
      </header>

      <div className="namaz-page-list">
        {namazSurahs.map(s => (
          <div key={s.number} className={`namaz-card ${expandedNamaz === s.number ? 'expanded' : ''}`}>
            <button
              className="namaz-card-header"
              onClick={() => setExpandedNamaz(expandedNamaz === s.number ? null : s.number)}
            >
              <div className="namaz-card-info">
                <span className="namaz-card-num">{s.number}</span>
                <div>
                  <span className="namaz-card-name">{s.name}</span>
                  <span className="namaz-card-arabic">{s.nameArabic}</span>
                </div>
              </div>
              <div className="namaz-card-right">
                <span className="namaz-card-note">{s.note}</span>
                <svg
                  className={`namaz-chevron ${expandedNamaz === s.number ? 'open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </button>

            {expandedNamaz === s.number && (
              <div className="namaz-card-body">
                {s.verses.map((v, i) => (
                  <div key={i} className="namaz-verse">
                    <p className="namaz-verse-arabic" dir="rtl">{v.arabic}</p>
                    <p className="namaz-verse-roman">{v.roman}</p>
                    <p className="namaz-verse-telugu-translit">{v.romanTelugu}</p>
                    <p className="namaz-verse-english">{v.english}</p>
                    <p className="namaz-verse-telugu">{v.telugu}</p>
                  </div>
                ))}

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NamazSurahs
