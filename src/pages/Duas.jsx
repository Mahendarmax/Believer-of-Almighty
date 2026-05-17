import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { prophetDuas } from '../data/namazAndDuas'
import { romanToTelugu } from '../utils/teluguTransliteration'
import './Duas.css'

function Duas() {
  const navigate = useNavigate()
  const [expandedDua, setExpandedDua] = useState(null)

  const handleBack = useCallback(() => navigate('/'), [navigate])

  return (
    <div className="duas-page">
      <header className="duas-page-header">
        <button className="duas-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="duas-page-title-group">
          <h1 className="duas-page-title">Recommended Duas</h1>
          <span className="duas-page-subtitle">Most recommended supplications by Prophet Muhammad ﷺ</span>
        </div>
      </header>

      <div className="duas-page-list">
        {prophetDuas.map((d, idx) => (
          <div
            key={idx}
            className={`dua-card ${expandedDua === idx ? 'expanded' : ''} ${d.category === 'Evil Eye' ? 'dua-evil-eye' : ''}`}
          >
            <button
              className="dua-card-header"
              onClick={() => setExpandedDua(expandedDua === idx ? null : idx)}
            >
              <div className="dua-card-info">
                <span className={`dua-card-category ${d.category === 'Evil Eye' ? 'cat-evil-eye' : ''}`}>{d.category}</span>
                <div>
                  <span className="dua-card-title">{d.title}</span>
                  <span className="dua-card-title-telugu">{d.titleTelugu}</span>
                </div>
              </div>
              <svg
                className={`dua-chevron ${expandedDua === idx ? 'open' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {expandedDua === idx && (
              <div className="dua-card-body">
                <p className="dua-arabic" dir="rtl">{d.arabic}</p>
                <div className="dua-text-block">
                  <span className="dua-label">Transliteration</span>
                  <p className="dua-roman">{d.roman}</p>
                </div>
                <div className="dua-text-block">
                  <span className="dua-label">తెలుగు లిప్యంతరీకరణ</span>
                  <p className="dua-telugu-translit">{romanToTelugu(d.roman, { noMAnusvara: true })}</p>
                </div>
                <div className="dua-text-block">
                  <span className="dua-label">English</span>
                  <p className="dua-english">{d.english}</p>
                </div>
                <div className="dua-text-block">
                  <span className="dua-label">తెలుగు</span>
                  <p className="dua-telugu">{d.telugu}</p>
                </div>
                <span className="dua-reference">{d.reference}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Duas
