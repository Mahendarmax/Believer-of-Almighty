import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { prophetMuhammadData } from '../data/prophetMuhammad'
import './ProphetMuhammad.css'

function ProphetMuhammad() {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [expandedEvent, setExpandedEvent] = useState(null)

  const [seerahLanguage, setSeerahLanguage] = useState(() => {
    const queryLang = new URLSearchParams(location.search).get('lang')
    if (queryLang === 'urdu') return 'urdu'
    if (queryLang === 'telugu') return 'telugu'
    if (queryLang === 'english') return 'english'
    try {
      const saved = localStorage.getItem('seerahLanguageMode')
      if (saved === 'telugu' || saved === 'english' || saved === 'urdu') return saved
    } catch {
      // Ignore localStorage issues
    }
    return 'english'
  })

  const handleBack = useCallback(() => navigate(-1), [navigate])

  const totalEvents = prophetMuhammadData.reduce((t, c) => t + c.events.length, 0)
  const isTelugu = seerahLanguage === 'telugu'
  const isEnglish = seerahLanguage === 'english'
  const isUrdu = seerahLanguage === 'urdu'

  const quoteText = isUrdu
    ? '"اور ہم نے آپ کو تمام جہانوں کے لیے رحمت بنا کر بھیجا ہے"'
    : (isEnglish
      ? '"And We have not sent you except as a mercy to all the worlds."'
      : '"మేము నిన్ను సమస్త సృష్టికి రహ్మత్ గా పంపాం"')

  const quoteRef = isUrdu ? '— سورۃ الانبیاء 21:107' : (isEnglish ? '— Surah Al-Anbiya 21:107' : '— సూరా అల్-అంబియా 21:107')

  useEffect(() => {
    try {
      localStorage.setItem('seerahLanguageMode', seerahLanguage)
    } catch {
      // Ignore localStorage issues
    }
  }, [seerahLanguage])

  const pageTitle = isUrdu ? 'سیرت النبی ﷺ' : (isEnglish ? 'Seerah-un-Nabi ﷺ' : 'సీరత్-ఉన్-నబీ ﷺ')
  const pageSubtitle = isUrdu
    ? 'سِیرَۃُ النَّبِيِّ مُحَمَّدٍ ﷺ'
    : (isEnglish ? 'Life of Prophet Muhammad ﷺ' : 'సِيرَةُ النَّبِيِّ مُحَمَّدٍ ﷺ — Life of Prophet Muhammad')

  return (
    <div className="seerah-page">
      <header className="seerah-header">
        <button className="seerah-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="seerah-title-group">
          <h1 className="seerah-title" dir={isUrdu ? 'rtl' : undefined}>{pageTitle}</h1>
          <span className="seerah-subtitle" dir={isUrdu ? 'rtl' : undefined}>{pageSubtitle}</span>
        </div>
      </header>

      {/* Bismillah Hero */}
      <div className="seerah-hero">
        <div className="seerah-hero-basmala">ﷺ</div>
        <h2 className="seerah-hero-name" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'محمد رسول اللہ' : (isEnglish ? 'Muhammad Rasulullah' : 'ముహమ్మద్ రసూలుల్లాహ్')}</h2>
        <p className="seerah-hero-arabic">مُحَمَّدٌ رَّسُولُ اللَّهِ</p>
        <p className="seerah-hero-telugu" dir={isUrdu ? 'rtl' : undefined}>{quoteText}</p>
        <p className="seerah-hero-ref" dir={isUrdu ? 'rtl' : undefined}>{quoteRef}</p>
        <div className="seerah-hero-stats">
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">63</span>
            <span className="seerah-stat-lbl" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'سال' : (isEnglish ? 'Years' : 'సంవత్సరాలు')}</span>
          </div>
          <div className="seerah-stat-divider" />
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">23</span>
            <span className="seerah-stat-lbl" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'وحی کے سال' : (isEnglish ? 'Years of Revelation' : 'వహీ సంవత్సరాలు')}</span>
          </div>
          <div className="seerah-stat-divider" />
          <div className="seerah-hero-stat">
            <span className="seerah-stat-val">{totalEvents}</span>
            <span className="seerah-stat-lbl" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? 'زندگی کے واقعات' : (isEnglish ? 'Life Events' : 'జీవిత సంఘటనలు')}</span>
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
                    {isTelugu && (
                      <span className="seerah-chapter-era">{chapter.era}</span>
                    )}
                    {(isEnglish || isUrdu) && (
                      <span className="seerah-chapter-era-en" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? (chapter.eraUr || chapter.eraEn) : chapter.eraEn}</span>
                    )}
                    <span className="seerah-chapter-period">{chapter.period}</span>
                  </div>
                </div>
                <div className="seerah-chapter-right">
                  <span className="seerah-chapter-count" dir={isUrdu ? 'rtl' : undefined}>{chapter.events.length} {isUrdu ? 'واقعات' : (isTelugu ? 'సంఘటనలు' : 'events')}</span>
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
                              {isTelugu && (
                                <span className="seerah-event-title">{ev.title}</span>
                              )}
                              {(isEnglish || isUrdu) && (
                                <span className="seerah-event-title-en" dir={isUrdu ? 'rtl' : undefined}>{isUrdu ? (ev.titleUr || ev.titleEn) : ev.titleEn}</span>
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
                            <div className="seerah-inline-lang-toggle" role="group" aria-label="Seerah content language">
                              <button
                                type="button"
                                className={`seerah-inline-lang-btn ${isTelugu ? 'active' : ''}`}
                                onClick={() => setSeerahLanguage('telugu')}
                              >
                                తెలుగు
                              </button>
                              <button
                                type="button"
                                className={`seerah-inline-lang-btn ${isEnglish ? 'active' : ''}`}
                                onClick={() => setSeerahLanguage('english')}
                              >
                                English
                              </button>
                              <button
                                type="button"
                                className={`seerah-inline-lang-btn ${isUrdu ? 'active' : ''}`}
                                onClick={() => setSeerahLanguage('urdu')}
                              >
                                اردو
                              </button>
                            </div>
                            {/* Arabic */}
                            <div className="seerah-arabic-box">
                              <p className="seerah-arabic-text" dir="rtl">{ev.arabic}</p>
                            </div>
                            {/* Telugu */}
                            {isTelugu && (
                              <div className="seerah-lang-block telugu-block">
                                <span className="seerah-lang-tag">తెలుగు</span>
                                <p className="seerah-telugu-text">{ev.telugu}</p>
                              </div>
                            )}
                            {/* English */}
                            {isEnglish && (
                              <div className="seerah-lang-block english-block">
                                <span className="seerah-lang-tag">English</span>
                                <p className="seerah-english-text">{ev.english}</p>
                              </div>
                            )}
                            {/* Urdu */}
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
          {(isEnglish || isUrdu) && (
            <p className="seerah-footer-transliteration">Allahumma salli 'ala Muhammadin wa 'ala aali Muhammad</p>
          )}
          {isTelugu && (
            <p className="seerah-footer-meaning">ఓ అల్లాహ్! ముహమ్మద్ ﷺ పై మరియు ఆయన కుటుంబంపై దీవెనలు కురిపించు</p>
          )}
          {isUrdu && (
            <p className="seerah-footer-meaning" dir="rtl">اے اللہ! محمد ﷺ اور آلِ محمد پر درود و برکت نازل فرما</p>
          )}
        </div>
        {(isEnglish || isUrdu) && (
          isUrdu
            ? <p className="seerah-footer-quote" dir="rtl">"یقیناً تمہارے لیے رسول اللہ ﷺ میں بہترین نمونہ ہے۔"</p>
            : <p className="seerah-footer-quote">"Verily, in the Messenger of Allah you have an excellent example to follow."</p>
        )}
        {isTelugu && <cite className="seerah-footer-ref">— సూరా అల్-అహ్జాబ్ 33:21</cite>}
        {isUrdu && <cite className="seerah-footer-ref" dir="rtl">— سورۃ الاحزاب 33:21</cite>}
        {isEnglish && <cite className="seerah-footer-ref">— Surah Al-Ahzab 33:21</cite>}
      </div>
    </div>
  )
}

export default ProphetMuhammad
