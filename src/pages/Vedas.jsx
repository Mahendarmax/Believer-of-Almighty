import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { vedasData } from '../data/vedasData'
import './Vedas.css'

function Vedas() {
  const navigate = useNavigate()
  const [expandedCat, setExpandedCat] = useState(null)
  const [expandedVerse, setExpandedVerse] = useState(null)

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const totalVerses = vedasData.reduce((t, c) => t + c.items.length, 0)

  return (
    <div className="vedas-page">
      <header className="vedas-page-header">
        <button className="vedas-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="vedas-page-title-group">
          <h1 className="vedas-page-title">🕉️ Vedas, Gita & Mahabharata</h1>
          <span className="vedas-page-subtitle">ONE God in Hindu Scriptures — ఏకం సత్</span>
        </div>
      </header>

      <div className="vedas-intro">
        <p className="vedas-intro-text">
          The Vedas, Upanishads, Bhagavad Gita, and Mahabharata all declare: 
          <strong> God is ONE. He has no image. Worship the Creator alone.</strong>
        </p>
        <p className="vedas-intro-telugu">
          వేదాలు, ఉపనిషత్తులు, భగవద్గీత, మహాభారతం అన్నీ ప్రకటిస్తాయి:
          <strong> దేవుడు ఒక్కడే. ఆయనకు ప్రతిమ లేదు. సృష్టికర్తను మాత్రమే ఆరాధించండి.</strong>
        </p>
        <div className="vedas-intro-stat">
          <span className="vedas-intro-stat-num">{totalVerses}</span>
          <span className="vedas-intro-stat-label">Verses from Vedas, Gita & Mahabharata</span>
        </div>
      </div>

      <div className="vedas-page-list">
        {vedasData.map((cat, idx) => (
          <div key={idx} className={`vedas-card ${expandedCat === idx ? 'expanded' : ''}`}>
            <button
              className="vedas-card-header"
              onClick={() => { setExpandedCat(expandedCat === idx ? null : idx); setExpandedVerse(null) }}
            >
              <div className="vedas-card-info">
                <span className="vedas-card-icon">{cat.icon}</span>
                <div>
                  <span className="vedas-card-category">{cat.category}</span>
                  <span className="vedas-card-category-telugu">{cat.categoryTelugu}</span>
                </div>
              </div>
              <div className="vedas-card-right">
                <span className="vedas-card-count">{cat.items.length} verses</span>
                <svg
                  className={`vedas-chevron ${expandedCat === idx ? 'open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </button>

            {expandedCat === idx && (
              <div className="vedas-card-body">
                {cat.items.map((item, i) => {
                  const verseKey = `${idx}-${i}`
                  const isExpanded = expandedVerse === verseKey
                  return (
                    <div key={i} className={`vedas-verse ${isExpanded ? 'verse-expanded' : ''}`}>
                      <div className="vedas-verse-header">
                        <span className="vedas-verse-num">{i + 1}</span>
                        <span className="vedas-verse-ref">{item.reference}</span>
                      </div>
                      <blockquote className="vedas-verse-text">"{item.verse}"</blockquote>
                      <p className="vedas-verse-telugu">"{item.telugu}"</p>

                      <button
                        className="vedas-context-toggle"
                        onClick={() => setExpandedVerse(isExpanded ? null : verseKey)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                        </svg>
                        {isExpanded ? 'Hide Explanation' : 'Why This Matters'}
                      </button>

                      {isExpanded && (
                        <div className="vedas-context-box">
                          <p className="vedas-context-english">{item.context}</p>
                          <p className="vedas-context-telugu">{item.contextTelugu}</p>
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

      <div className="vedas-footer">
        <blockquote className="vedas-footer-quote">
          "Ekam sat viprā bahudhā vadanti" — Truth is ONE; the wise call it by many names.
        </blockquote>
        <cite className="vedas-footer-ref">— Rig Veda 1.164.46</cite>
        <p className="vedas-footer-telugu">
          "ఏకం సత్ విప్రా బహుధా వదంతి" — సత్యం ఒక్కటే; జ్ఞానులు దానిని అనేక పేర్లతో పిలుస్తారు.
        </p>
      </div>
    </div>
  )
}

export default Vedas
