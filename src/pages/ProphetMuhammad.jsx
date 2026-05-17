import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { prophetMuhammadData } from '../data/prophetMuhammad'
import { useSettings } from '../context/SettingsContext'
import './ProphetMuhammad.css'

function ProphetMuhammad() {
  const navigate = useNavigate()
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [expandedEvent, setExpandedEvent] = useState(null)
  const { transliteration } = useSettings()

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const totalEvents = prophetMuhammadData.reduce((t, c) => t + c.events.length, 0)

  return (
    <div className="seerah-page">
      <header className="seerah-header">
        <button className="seerah-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="seerah-title-group">
          <h1 className="seerah-title">సీరత్-ఉన్-నబీ ﷺ</h1>
          <span className="seerah-subtitle">سِيرَةُ النَّبِيِّ مُحَمَّدٍ ﷺ — Life of Prophet Muhammad</span>
        </div>
      </header>

      {/* Bismillah Hero */}
      <div className="seerah-hero">
        <div className="seerah-hero-basmala">ﷺ</div>
        <h2 className="seerah-hero-name">ముహమ్మద్ రసూలుల్లాహ్</h2>
        <p className="seerah-hero-arabic">مُحَمَّدٌ رَّسُولُ اللَّهِ</p>
        <p className="seerah-hero-telugu">
          "మేము నిన్ను సమస్త సృష్టికి రహ్మత్ గా పంపాం"
        </p>
        <p className="seerah-hero-ref">— సూరా అల్-అంబియా 21:107</p>
        <div className="seerah-hero-stats">
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">63</span>
            <span className="seerah-stat-lbl">సంవత్సరాలు • Years</span>
          </div>
          <div className="seerah-stat-divider" />
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">23</span>
            <span className="seerah-stat-lbl">వహీ సంవత్సరాలు • Years of Revelation</span>
          </div>
          <div className="seerah-stat-divider" />
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">{totalEvents}</span>
            <span className="seerah-stat-lbl">జీవిత సంఘటనలు • Life Events</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="seerah-timeline">
        {prophetMuhammadData.map((chapter, chIdx) => {
          const isChapterOpen = expandedChapter === chIdx
          return (
            <div key={chIdx} className={`seerah-chapter ${isChapterOpen ? 'open' : ''}`}>
              {/* Chapter header */}
              <button
                className="seerah-chapter-btn"
                style={{ '--chapter-color': chapter.color }}
                onClick={() => {
                  setExpandedChapter(isChapterOpen ? null : chIdx)
                  setExpandedEvent(null)
                }}
              >
                <div className="seerah-chapter-left">
                  <span className="seerah-chapter-num">{chapter.chapter}</span>
                  <span className="seerah-chapter-icon">{chapter.icon}</span>
                  <div className="seerah-chapter-info">
                    {(transliteration === 'telugu' || transliteration === 'both') && (
                      <span className="seerah-chapter-era">{chapter.era}</span>
                    )}
                    {(transliteration === 'english' || transliteration === 'both') && (
                      <span className="seerah-chapter-era-en">{chapter.eraEn}</span>
                    )}
                    <span className="seerah-chapter-period">{chapter.period}</span>
                  </div>
                </div>
                <div className="seerah-chapter-right">
                  <span className="seerah-chapter-count">{chapter.events.length} events</span>
                  <svg
                    className={`seerah-chevron ${isChapterOpen ? 'open' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </button>

              {/* Events */}
              {isChapterOpen && (
                <div className="seerah-events">
                  {chapter.events.map((ev, evIdx) => {
                    const key = `${chIdx}-${evIdx}`
                    const isOpen = expandedEvent === key
                    return (
                      <div key={evIdx} className={`seerah-event ${isOpen ? 'open' : ''}`}
                        style={{ '--chapter-color': chapter.color }}>
                        {/* Event header */}
                        <button
                          className="seerah-event-btn"
                          onClick={() => setExpandedEvent(isOpen ? null : key)}
                        >
                          <div className="seerah-event-left">
                            <div className="seerah-event-dot" />
                            <div>
                              {(transliteration === 'telugu' || transliteration === 'both') && (
                                <span className="seerah-event-title">{ev.title}</span>
                              )}
                              {(transliteration === 'english' || transliteration === 'both') && (
                                <span className="seerah-event-title-en">{ev.titleEn}</span>
                              )}
                              <span className="seerah-event-year">{ev.year}</span>
                            </div>
                          </div>
                          <svg
                            className={`seerah-chevron ${isOpen ? 'open' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"
                          >
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>

                        {/* Event body */}
                        {isOpen && (
                          <div className="seerah-event-body">
                            {/* Arabic */}
                            <div className="seerah-arabic-box">
                              <p className="seerah-arabic-text" dir="rtl">{ev.arabic}</p>
                            </div>
                            {/* Telugu */}
                            {(transliteration === 'telugu' || transliteration === 'both') && (
                              <div className="seerah-lang-block telugu-block">
                                <span className="seerah-lang-tag">తెలుగు</span>
                                <p className="seerah-telugu-text">{ev.telugu}</p>
                              </div>
                            )}
                            {/* English */}
                            {(transliteration === 'english' || transliteration === 'both') && (
                              <div className="seerah-lang-block english-block">
                                <span className="seerah-lang-tag">English</span>
                                <p className="seerah-english-text">{ev.english}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="seerah-footer">
        <div className="seerah-footer-salawat">
          <p className="seerah-footer-arabic" dir="rtl">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ</p>
          {(transliteration === 'english' || transliteration === 'both') && (
            <p className="seerah-footer-transliteration">Allahumma salli 'ala Muhammadin wa 'ala aali Muhammad</p>
          )}
          {(transliteration === 'telugu' || transliteration === 'both') && (
            <p className="seerah-footer-meaning">ఓ అల్లాహ్! ముహమ్మద్ ﷺ పై మరియు ఆయన కుటుంబంపై దీవెనలు కురిపించు</p>
          )}
        </div>
        {(transliteration === 'english' || transliteration === 'both') && (
          <p className="seerah-footer-quote">
            "Verily, in the Messenger of Allah you have an excellent example to follow."
          </p>
        )}
        <cite className="seerah-footer-ref">— Surah Al-Ahzab 33:21</cite>
      </div>
    </div>
  )
}

export default ProphetMuhammad
