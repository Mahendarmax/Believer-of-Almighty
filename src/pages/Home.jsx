import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { surahs } from '../data/quranData'
import { namazSurahs, prophetDuas } from '../data/namazAndDuas'
import './Home.css'

const Home = React.memo(function Home() {
  const navigate = useNavigate()
  const { lastRead, favorites, transliteration, setTransliteration } = useSettings()

  const [selectedSurah, setSelectedSurah] = useState('')
  const [verseNumber, setVerseNumber] = useState('')
  const [expandedNamaz, setExpandedNamaz] = useState(null)
  const [expandedDua, setExpandedDua] = useState(null)

  const selectedSurahData = useMemo(() => {
    if (!selectedSurah) return null
    return surahs.find(s => s.number === parseInt(selectedSurah))
  }, [selectedSurah])

  const handleReadQuran = useCallback(() => navigate('/surahs'), [navigate])
  const handleFavorites = useCallback(() => navigate('/favorites'), [navigate])
  const handleContinue = useCallback(() => {
    if (lastRead) {
      navigate(`/surah/${lastRead.surahNumber}?verse=${lastRead.verseNumber || 1}`)
    }
  }, [navigate, lastRead])

  const handleGoToVerse = useCallback(() => {
    if (!selectedSurah) return
    const verse = parseInt(verseNumber) || 1
    navigate(`/surah/${selectedSurah}?verse=${verse}`)
  }, [navigate, selectedSurah, verseNumber])

  return (
    <div className="home">
      {/* Hero Section */}
      <header className="home-hero">
        <div className="hero-pattern" />
        <div className="hero-content">
          <div className="hero-icon">﷽</div>
          <h1 className="hero-title">The Holy Quran</h1>
          <h2 className="hero-subtitle">القرآن الكريم</h2>
          <p className="hero-telugu">పవిత్ర ఖురాన్</p>
          <div className="hero-divider">
            <span className="divider-ornament">✦</span>
          </div>
          <p className="hero-desc">
            Read, Listen & Understand the words of Allah
          </p>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-num">114</span>
          <span className="stat-label">Surahs</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">6236</span>
          <span className="stat-label">Verses</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">30</span>
          <span className="stat-label">Juz</span>
        </div>
      </section>

      {/* Continue Reading */}
      {lastRead && (
        <section className="continue-section">
          <button className="continue-card" onClick={handleContinue}>
            <div className="continue-icon">📖</div>
            <div className="continue-info">
              <span className="continue-label">Continue Reading</span>
              <span className="continue-surah">{lastRead.surahName}</span>
              <span className="continue-verse">Verse {lastRead.verseNumber || 1}</span>
            </div>
            <svg className="continue-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </section>
      )}

      {/* Go to Verse */}
      <section className="goto-section">
        <h3 className="goto-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Go to Verse
        </h3>
        <p className="goto-desc">Jump to any surah and verse directly</p>
        <div className="goto-controls">
          <div className="goto-select-wrap">
            <select
              className="goto-select"
              value={selectedSurah}
              onChange={e => { setSelectedSurah(e.target.value); setVerseNumber('') }}
            >
              <option value="">Select Surah</option>
              {surahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.nameEnglish})
                </option>
              ))}
            </select>
            <svg className="goto-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
          <input
            type="number"
            className="goto-verse-input"
            placeholder={selectedSurahData ? `Verse (1-${selectedSurahData.ayahs})` : 'Verse'}
            value={verseNumber}
            onChange={e => setVerseNumber(e.target.value)}
            min="1"
            max={selectedSurahData?.ayahs || 286}
            disabled={!selectedSurah}
          />
          <button
            className="goto-btn"
            onClick={handleGoToVerse}
            disabled={!selectedSurah}
          >
            Go
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Action Cards */}
      <section className="action-cards">
        <button className="action-card read-card" onClick={handleReadQuran}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3>Read Quran</h3>
          <p>ఖురాన్ చదవండి</p>
          <span className="action-meta">All 114 Surahs</span>
        </button>

        <button className="action-card fav-card" onClick={handleFavorites}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h3>Favorites</h3>
          <p>ఇష్టమైనవి</p>
          <span className="action-meta">{favorites.length} Saved</span>
        </button>
      </section>

      {/* Transliteration Preference */}
      <section className="translit-section">
        <h3 className="translit-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
          </svg>
          Transliteration Style
        </h3>
        <p className="translit-desc">Choose how to display Quranic pronunciation</p>
        <div className="translit-options">
          <button
            className={`translit-btn ${transliteration === 'english' ? 'active' : ''}`}
            onClick={() => setTransliteration('english')}
          >
            <span className="translit-btn-label">Roman English</span>
            <span className="translit-btn-example">Bismillaahir Rahmaanir Raheem</span>
          </button>
          <button
            className={`translit-btn ${transliteration === 'telugu' ? 'active' : ''}`}
            onClick={() => setTransliteration('telugu')}
          >
            <span className="translit-btn-label">Roman Telugu</span>
            <span className="translit-btn-example">బిస్మిల్లాహిర్ రహ్మానిర్ రహీమ్</span>
          </button>
          <button
            className={`translit-btn ${transliteration === 'both' ? 'active' : ''}`}
            onClick={() => setTransliteration('both')}
          >
            <span className="translit-btn-label">Both</span>
            <span className="translit-btn-example">English + Telugu side by side</span>
          </button>
        </div>
      </section>

      {/* Namaz Surahs */}
      <section className="namaz-section">
        <h3 className="namaz-title">
          <span className="namaz-title-icon">🕌</span>
          Namaz Surahs
        </h3>
        <p className="namaz-desc">Surahs commonly recited during Salah (Prayer)</p>
        <div className="namaz-list">
          {namazSurahs.map(s => (
            <div key={s.number} className={`namaz-card ${expandedNamaz === s.number ? 'expanded' : ''}`}>
              <button className="namaz-card-header" onClick={() => setExpandedNamaz(expandedNamaz === s.number ? null : s.number)}>
                <div className="namaz-card-info">
                  <span className="namaz-card-num">{s.number}</span>
                  <div>
                    <span className="namaz-card-name">{s.name}</span>
                    <span className="namaz-card-arabic">{s.nameArabic}</span>
                  </div>
                </div>
                <div className="namaz-card-right">
                  <span className="namaz-card-note">{s.note}</span>
                  <svg className={`namaz-chevron ${expandedNamaz === s.number ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
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
                  <button className="namaz-goto-btn" onClick={() => navigate(`/surah/${s.number}`)}>
                    Read full Surah →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Duas */}
      <section className="duas-section">
        <h3 className="duas-title">
          <span className="duas-title-icon">🤲</span>
          Recommended Duas
        </h3>
        <p className="duas-desc">Most recommended supplications by Prophet Muhammad ﷺ</p>
        <div className="duas-list">
          {prophetDuas.map((d, idx) => (
            <div key={idx} className={`dua-card ${expandedDua === idx ? 'expanded' : ''}`}>
              <button className="dua-card-header" onClick={() => setExpandedDua(expandedDua === idx ? null : idx)}>
                <div className="dua-card-info">
                  <span className="dua-card-category">{d.category}</span>
                  <div>
                    <span className="dua-card-title">{d.title}</span>
                    <span className="dua-card-title-telugu">{d.titleTelugu}</span>
                  </div>
                </div>
                <svg className={`dua-chevron ${expandedDua === idx ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
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
                    <p className="dua-telugu-translit">{d.romanTelugu}</p>
                  </div>
                  <div className="dua-text-block">
                    <span className="dua-label">English</span>
                    <p className="dua-english">{d.english}</p>
                  </div>
                  <div className="dua-text-block">
                    <span className="dua-label">తెలుగు</span>
                    <p className="dua-telugu">{d.telugu}</p>
                  </div>
                  <span className="dua-reference">📖 {d.reference}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature">
          <span className="feature-icon">🔊</span>
          <span>Verse-by-verse Audio</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📝</span>
          <span>4 Languages</span>
        </div>
        <div className="feature">
          <span className="feature-icon">🔍</span>
          <span>Search Surahs</span>
        </div>
      </section>

      {/* Quote */}
      <footer className="home-footer">
        <blockquote className="footer-quote">
          "And We have certainly made the Quran easy for remembrance, so is there any who will remember?"
        </blockquote>
        <cite className="footer-ref">— Surah Al-Qamar 54:17</cite>
      </footer>
    </div>
  )
})
Home.displayName = 'Home'

export default Home
