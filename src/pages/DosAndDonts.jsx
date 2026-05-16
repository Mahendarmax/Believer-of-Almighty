import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { islamicDosAndDonts } from '../data/namazAndDuas'
import './DosAndDonts.css'

function DosAndDonts() {
  const navigate = useNavigate()
  const [expandedCat, setExpandedCat] = useState(null)
  const cardRefs = useRef({})

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const handleToggle = useCallback((idx) => {
    setExpandedCat(prev => {
      const next = prev === idx ? null : idx
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
    <div className="dosdonts-page">
      <header className="dosdonts-page-header">
        <button className="dosdonts-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="dosdonts-page-title-group">
          <h1 className="dosdonts-page-title">Dos and Don'ts in Islam</h1>
          <span className="dosdonts-page-subtitle">What Allah has allowed and forbidden — based on Quran & Hadith</span>
        </div>
      </header>

      <div className="dosdonts-page-list">
        {islamicDosAndDonts.map((cat, idx) => (
          <div
            key={idx}
            ref={el => { cardRefs.current[idx] = el }}
            className={`dd-card ${expandedCat === idx ? 'expanded' : ''}`}
          >
            <button
              className="dd-card-header"
              onClick={() => handleToggle(idx)}
            >
              <div className="dd-card-info">
                <span className="dd-card-icon">{cat.icon}</span>
                <div>
                  <span className="dd-card-category">{cat.category}</span>
                  <span className="dd-card-category-telugu">{cat.categoryTelugu}</span>
                </div>
              </div>
              <div className="dd-card-right">
                <span className="dd-card-count">{cat.items.length} items</span>
                <svg
                  className={`dd-chevron ${expandedCat === idx ? 'open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </button>

            {expandedCat === idx && (
              <div className="dd-card-body">
                {cat.items.map((item, i) => (
                  <div key={i} className="dd-item">
                    <div className="dd-item-num">{i + 1}</div>
                    <div className="dd-item-content">
                      <p className="dd-item-english">{item.text}</p>
                      <p className="dd-item-telugu">{item.telugu}</p>
                      <span className="dd-item-ref">{item.reference}</span>
                    </div>
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

export default DosAndDonts
