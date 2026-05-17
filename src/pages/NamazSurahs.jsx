import React, { useState, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { namazSurahs } from '../data/namazAndDuas'
import { romanToTelugu } from '../utils/teluguTransliteration'
import './NamazSurahs.css'

const NamazVerse = memo(({ v }) => (
  <div className="namaz-verse">
    <p className="namaz-verse-arabic" dir="rtl">{v.arabic}</p>
    <p className="namaz-verse-roman">{v.roman}</p>
    <p className="namaz-verse-telugu-translit">{romanToTelugu(v.roman, { noMAnusvara: true })}</p>
    <p className="namaz-verse-english">{v.english}</p>
    <p className="namaz-verse-telugu">{v.telugu}</p>
  </div>
))
NamazVerse.displayName = 'NamazVerse'

function NamazSurahs() {
  const navigate = useNavigate()
  const [expandedNamaz, setExpandedNamaz] = useState(null)
  const cardRefs = useRef({})

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const handleToggle = useCallback((num) => {
    setExpandedNamaz(prev => {
      const next = prev === num ? null : num
      if (next !== null) {
        setTimeout(() => {
          const el = cardRefs.current[next]
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 72
            window.scrollTo({ top, behavior: 'smooth' })
          }
        }, 50)
      }
      return next
    })
  }, [])

  return (
    <div className="namaz-page">
      <header className="namaz-page-header">
        <button className="namaz-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="namaz-page-title-group">
          <h1 className="namaz-page-title">Namaz Surahs</h1>
          <span className="namaz-page-subtitle">Surahs commonly recited during Salah (Prayer)</span>
        </div>
      </header>

      <div className="namaz-page-list">
        {namazSurahs.map(s => (
          <div
            key={s.number}
            ref={el => { cardRefs.current[s.number] = el }}
            className={`namaz-card ${expandedNamaz === s.number ? 'expanded' : ''}`}
          >
            <button
              className="namaz-card-header"
              onClick={() => handleToggle(s.number)}
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
                  <NamazVerse key={i} v={v} />
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
