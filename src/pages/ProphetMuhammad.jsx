import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { prophetMuhammadData } from '../data/prophetMuhammad'
import './ProphetMuhammad.css'

function ProphetMuhammad() {
  const navigate = useNavigate()
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [expandedEvent, setExpandedEvent] = useState(null)
  const [seerahLanguage, setSeerahLanguage] = useState(() => {
    try {
      return localStorage.getItem('seerah_language') === 'urdu' ? 'urdu' : 'telugu'
    } catch {
      return 'telugu'
    }
  })

  const handleBack = useCallback(() => navigate(-1), [navigate])

  const totalEvents = prophetMuhammadData.reduce((t, c) => t + c.events.length, 0)
  const isUrdu = seerahLanguage === 'urdu'

  useEffect(() => {
    try {
      localStorage.setItem('seerah_language', seerahLanguage)
    } catch {
      // Ignore localStorage errors
    }
  }, [seerahLanguage])

  return (
    <div className={`seerah-page${isUrdu ? ' urdu-mode' : ''}`}>
      <header className="seerah-header">
        <button className="seerah-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="seerah-title-group">
          <h1 className="seerah-title" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'سیرت النبی ﷺ' : 'సీరత్-ఉన్-నబీ ﷺ'}</h1>
          <span className="seerah-subtitle" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'سِيرَةُ النَّبِيِّ مُحَمَّدٍ ﷺ — حیاتِ نبی محمد ﷺ' : 'سِيرَةُ النَّبِيِّ مُحَمَّدٍ ﷺ — Life of Prophet Muhammad'}</span>
        </div>
      </header>

      {/* Bismillah Hero */}
      <div className="seerah-hero">
        <div className="seerah-hero-lang-row">
          <button
            type="button"
            className={`seerah-hero-lang-btn ${!isUrdu ? 'active' : ''}`}
            onClick={() => setSeerahLanguage('telugu')}
          >
            తెలుగు
          </button>
          <button
            type="button"
            className={`seerah-hero-lang-btn ${isUrdu ? 'active' : ''}`}
            onClick={() => setSeerahLanguage('urdu')}
          >
            اردو میں تبدیل کریں
          </button>
        </div>
        <div className="seerah-hero-basmala">ﷺ</div>
        <h2 className="seerah-hero-name" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'محمد رسول اللہ' : 'ముహమ్మద్ రసూలుల్లాహ్'}</h2>
        <p className="seerah-hero-arabic">مُحَمَّدٌ رَّسُولُ اللَّهِ</p>
        <p className="seerah-hero-telugu" dir={isUrdu ? 'rtl' : undefined}>
          {isUrdu ? '"اور ہم نے آپ کو تمام جہانوں کے لئے رحمت بنا کر بھیجا ہے"' : '"మేము నిన్ను సమస్త సృష్టికి రహ్మత్ గా పంపాం"'}
        </p>
        <p className="seerah-hero-ref" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? '— سورۃ الانبیاء 21:107' : '— సూరా అల్-అంబియా 21:107'}</p>
        <div className="seerah-hero-stats">
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">63</span>
            <span className="seerah-stat-lbl" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'سال' : 'సంవత్సరాలు'}</span>
          </div>
          <div className="seerah-stat-divider" />
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">23</span>
            <span className="seerah-stat-lbl" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'وحی کے سال' : 'వహీ సంవత్సరాలు'}</span>
          </div>
          <div className="seerah-stat-divider" />
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">{totalEvents}</span>
            <span className="seerah-stat-lbl" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'زندگی کے واقعات' : 'జీవిత సంఘటనలు'}</span>
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
                    {isUrdu
                      ? <span className="seerah-chapter-era-en" dir="rtl">{chapter.eraUr || chapter.eraEn}</span>
                      : <span className="seerah-chapter-era">{chapter.era}</span>
                    }
                    <span className="seerah-chapter-period">{chapter.period}</span>
                  </div>
                </div>
                <div className="seerah-chapter-right">
                  <span className="seerah-chapter-count" dir={isUrdu ? 'rtl' : undefined}>{chapter.events.length} {isUrdu ? 'واقعات' : 'సంఘటనలు'}</span>
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
                              {isUrdu
                                ? <span className="seerah-event-title-en" dir="rtl">{ev.titleUr || ev.titleEn}</span>
                                : <span className="seerah-event-title">{ev.title}</span>
                              }
                              <span className="seerah-event-year" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? (ev.yearUr || ev.year) : ev.year}</span>
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
                            {!isUrdu && (
                              <div className="seerah-lang-block telugu-block">
                                <span className="seerah-lang-tag">తెలుగు</span>
                                <p className="seerah-telugu-text">{ev.telugu}</p>
                              </div>
                            )}
                            {isUrdu && (
                              <div className="seerah-lang-block urdu-block" dir="rtl">
                                <span className="seerah-lang-tag">اردو</span>
                                <p className="seerah-urdu-text">{ev.urdu || ev.english}</p>
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
          {!isUrdu && (
            <p className="seerah-footer-meaning">ఓ అల్లాహ్! ముహమ్మద్ ﷺ పై మరియు ఆయన కుటుంబంపై దీవెనలు కురిపించు</p>
          )}
          {isUrdu && (
            <p className="seerah-footer-meaning" dir="rtl">اے اللہ! محمد ﷺ پر اور آلِ محمد پر درود و سلام نازل فرما</p>
          )}
        </div>
        {!isUrdu && <cite className="seerah-footer-ref">— Surah Al-Ahzab 33:21</cite>}
        {isUrdu && <cite className="seerah-footer-ref" dir="rtl">— سورۃ الاحزاب 33:21</cite>}
      </div>
    </div>
  )
}

export default ProphetMuhammad
