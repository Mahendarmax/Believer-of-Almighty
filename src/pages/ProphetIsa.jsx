import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { prophetIsaData } from '../data/prophetIsa'
import { useSettings } from '../context/SettingsContext'
import './ProphetIsa.css'

function ProphetIsa() {
  const navigate = useNavigate()
  const [expandedCat, setExpandedCat] = useState(null)
  const [expandedVerse, setExpandedVerse] = useState(null)
  const { transliteration } = useSettings()

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const totalVerses = prophetIsaData.reduce((t, c) => t + c.items.length, 0)

  return (
    <div className="isa-page">
      <header className="isa-page-header">
        <button className="isa-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="isa-page-title-group">
          <h1 className="isa-page-title">{transliteration === 'telugu' ? 'ప్రవక్త ఈసా (యేసు)' : 'Prophet Isa (Jesus)'}</h1>
          <span className="isa-page-subtitle">عيسى عليه السلام {transliteration !== 'telugu' && '— What Jesus really said'}</span>
        </div>
      </header>

      {/* Intro banner */}
      <div className="isa-intro">
        {(transliteration === 'english' || transliteration === 'both') && (
          <p className="isa-intro-text">
            Muslims love and honor Prophet Isa (Jesus, peace be upon him). The Quran and the Bible both confirm: 
            <strong> Jesus worshipped ONE God, called himself a prophet, and never claimed to be God.</strong>
          </p>
        )}
        {(transliteration === 'telugu' || transliteration === 'both') && (
          <p className="isa-intro-telugu">
            ముస్లింలు ప్రవక్త ఈసా (యేసు, శాంతి ఆయనపై ఉండుగాక) ను ప్రేమిస్తారు మరియు గౌరవిస్తారు. ఖురాన్ మరియు బైబిల్ రెండూ ధృవీకరిస్తాయి:
            <strong> ఈసా (అ) ఒక్క దేవుడిని ఆరాధించారు, తనను ప్రవక్తగా చెప్పుకున్నారు, ఎన్నడూ దేవుడినని చెప్పలేదు.</strong>
          </p>
        )}
        <div className="isa-intro-stat">
          <span className="isa-intro-stat-num">{totalVerses}</span>
          <span className="isa-intro-stat-label">Verses from Bible & Quran</span>
        </div>
      </div>

      {/* Categories */}
      <div className="isa-page-list">
        {prophetIsaData.map((cat, idx) => (
          <div key={idx} className={`isa-card ${expandedCat === idx ? 'expanded' : ''}`}>
            <button
              className="isa-card-header"
              onClick={() => { setExpandedCat(expandedCat === idx ? null : idx); setExpandedVerse(null) }}
            >
              <div className="isa-card-info">
                <span className="isa-card-icon">{cat.icon}</span>
                <div>
                  {(transliteration === 'english' || transliteration === 'both') && (
                    <span className="isa-card-category">{cat.category}</span>
                  )}
                  {(transliteration === 'telugu' || transliteration === 'both') && (
                    <span className="isa-card-category-telugu">{cat.categoryTelugu}</span>
                  )}
                </div>
              </div>
              <div className="isa-card-right">
                <span className="isa-card-count">{cat.items.length} {transliteration === 'telugu' ? 'వచనాలు' : 'verses'}</span>
                <svg
                  className={`isa-chevron ${expandedCat === idx ? 'open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </button>

            {expandedCat === idx && (
              <div className="isa-card-body">
                {cat.items.map((item, i) => {
                  const verseKey = `${idx}-${i}`
                  const isExpanded = expandedVerse === verseKey
                  return (
                    <div key={i} className={`isa-verse ${isExpanded ? 'verse-expanded' : ''}`}>
                      <div className="isa-verse-header">
                        <span className="isa-verse-num">{i + 1}</span>
                        <span className="isa-verse-ref">{item.reference}</span>
                      </div>
                      {(transliteration === 'english' || transliteration === 'both') && (
                        <blockquote className="isa-verse-text">"{item.verse}"</blockquote>
                      )}
                      {(transliteration === 'telugu' || transliteration === 'both') && (
                        <p className="isa-verse-telugu">"{item.telugu}"</p>
                      )}

                      <button
                        className="isa-context-toggle"
                        onClick={() => setExpandedVerse(isExpanded ? null : verseKey)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                        </svg>
                        {isExpanded
                          ? (transliteration === 'telugu' ? 'వివరణ దాచు' : 'Hide Explanation')
                          : (transliteration === 'telugu' ? 'ఇది ఎందుకు ముఖ్యం' : 'Why This Matters')
                        }
                      </button>

                      {isExpanded && (
                        <div className="isa-context-box">
                          {(transliteration === 'english' || transliteration === 'both') && (
                            <p className="isa-context-english">{item.context}</p>
                          )}
                          {(transliteration === 'telugu' || transliteration === 'both') && (
                            <p className="isa-context-telugu">{item.contextTelugu}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="isa-footer">
        {(transliteration === 'english' || transliteration === 'both') && (
          <blockquote className="isa-footer-quote">
            "Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. And there is none comparable to Him."
          </blockquote>
        )}
        <cite className="isa-footer-ref">— Surah Al-Ikhlas 112:1-4</cite>
        {(transliteration === 'telugu' || transliteration === 'both') && (
          <p className="isa-footer-telugu">
            "చెప్పు: ఆయన అల్లాహ్, ఒక్కడు. అల్లాహ్, శాశ్వత ఆశ్రయం. ఆయన జన్మించలేదు, జన్మింపజేయలేదు. ఆయనకు సమానమైనది ఏదీ లేదు."
          </p>
        )}
      </div>
    </div>
  )
}

export default ProphetIsa
