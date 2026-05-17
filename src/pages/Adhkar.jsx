import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adhkarData } from '../data/adhkar'
import { romanToTelugu } from '../utils/teluguTransliteration'
import { useSettings } from '../context/SettingsContext'
import './Adhkar.css'

function Adhkar() {
  const navigate = useNavigate()
  const [expandedCat, setExpandedCat] = useState(null)
  const { transliteration } = useSettings()

  const handleBack = useCallback(() => navigate('/'), [navigate])

  return (
    <div className="adhkar-page">
      <header className="adhkar-page-header">
        <button className="adhkar-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="adhkar-page-title-group">
          <h1 className="adhkar-page-title">Morning & Evening Adhkar</h1>
          <span className="adhkar-page-subtitle">أذكار الصباح والمساء — Daily Remembrance</span>
        </div>
      </header>

      <div className="adhkar-page-list">
        {adhkarData.map((cat, idx) => (
          <div key={idx} className={`adhkar-card ${expandedCat === idx ? 'expanded' : ''}`}>
            <button
              className="adhkar-card-header"
              onClick={() => setExpandedCat(expandedCat === idx ? null : idx)}
            >
              <div className="adhkar-card-info">
                <span className="adhkar-card-icon">{cat.icon}</span>
                <div>
                  {(transliteration === 'english' || transliteration === 'both') && (
                    <span className="adhkar-card-category">{cat.category}</span>
                  )}
                  {(transliteration === 'telugu' || transliteration === 'both') && (
                    <span className="adhkar-card-category-telugu">{cat.categoryTelugu}</span>
                  )}
                  <span className="adhkar-card-note">{cat.note}</span>
                </div>
              </div>
              <div className="adhkar-card-right">
                <span className="adhkar-card-count">{cat.items.length} adhkar</span>
                <svg
                  className={`adhkar-chevron ${expandedCat === idx ? 'open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </button>

            {expandedCat === idx && (
              <div className="adhkar-card-body">
                {cat.items.map((item, i) => (
                  <div key={i} className="adhkar-item">
                    <div className="adhkar-item-header">
                      <span className="adhkar-item-num">{i + 1}</span>
                      <span className="adhkar-item-repeat">{item.repeat}</span>
                    </div>
                    <p className="adhkar-item-arabic" dir="rtl">{item.arabic}</p>
                    {(transliteration === 'english' || transliteration === 'both') && (
                      <p className="adhkar-item-roman">{item.roman}</p>
                    )}
                    {(transliteration === 'telugu' || transliteration === 'both') && (
                      <p className="adhkar-item-telugu-translit">{romanToTelugu(item.roman, { noMAnusvara: true })}</p>
                    )}
                    {(transliteration === 'english' || transliteration === 'both') && (
                      <p className="adhkar-item-english">{item.english}</p>
                    )}
                    {(transliteration === 'telugu' || transliteration === 'both') && (
                      <p className="adhkar-item-telugu">{item.telugu}</p>
                    )}
                    <span className="adhkar-item-ref">{item.reference}</span>
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

export default Adhkar
