import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { namazSurahs, prophetDuas } from '../data/namazAndDuas'
import './Home.css'

const Home = React.memo(function Home() {
  const navigate = useNavigate()
  const { lastRead, favorites, transliteration, setTransliteration } = useSettings()

  const handleReadQuran = useCallback(() => navigate('/surahs'), [navigate])
  const handleFavorites = useCallback(() => navigate('/favorites'), [navigate])
  const handleContinue = useCallback(() => {
    if (lastRead) {
      navigate(`/surah/${lastRead.surahNumber}?verse=${lastRead.verseNumber || 1}&t=${Date.now()}`)
    }
  }, [navigate, lastRead])

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

      {/* Action Cards — 2x2 Grid */}
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

        <button className="action-card namaz-action-card" onClick={() => navigate('/namaz')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>
            </svg>
          </div>
          <h3>Namaz Surahs</h3>
          <p>నమాజ్ సూరాలు</p>
          <span className="action-meta">{namazSurahs.length} Surahs</span>
        </button>

        <button className="action-card duas-action-card" onClick={() => navigate('/duas')}>
          <div className="action-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          <h3>Duas</h3>
          <p>దుఆలు</p>
          <span className="action-meta">{prophetDuas.length} Duas</span>
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
