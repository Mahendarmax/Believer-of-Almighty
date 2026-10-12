import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const { showArabic, toggleArabic, fontSize, increaseFontSize, decreaseFontSize, showRecitation, toggleRecitation } = useSettings()

  const [showRecitationInfo, setShowRecitationInfo] = useState(false)

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const toggleRecitationInfo = useCallback(() => setShowRecitationInfo(prev => !prev), [])

  return (
    <div className="settings-page">
      <header className="set-header">
        <button className="set-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="set-title">Settings</h1>
      </header>

      <div className="set-content">
        {/* Arabic Toggle */}
        <div className="set-item">
          <div className="set-item-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <div>
              <h3>Arabic Text</h3>
              <p>Show/hide Arabic script • అరబిక్ టెక్స్ట్</p>
            </div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={showArabic} onChange={toggleArabic} />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Recitation line */}
        <div className="set-item">
          <div className="set-item-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
              <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
            <div>
              <h3>Recitation Line</h3>
              <p>Telugu as recited (tajweed), shown where it differs from the written form • పఠన రూపం</p>
            </div>
          </div>
          <div className="set-controls">
            <button
              className={`set-info-btn ${showRecitationInfo ? 'active' : ''}`}
              onClick={toggleRecitationInfo}
              aria-label="What is the difference between written and recited form?"
              aria-expanded={showRecitationInfo}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </button>
            <label className="toggle">
              <input type="checkbox" checked={showRecitation} onChange={toggleRecitation} />
              <span className="toggle-track" />
            </label>
          </div>
        </div>
        {showRecitationInfo && (
          <div className="set-info-panel">
            <div className="set-info-row">
              <h4>Written form <span>లిఖిత రూపం</span></h4>
              <p>Each word exactly as it appears in the Quran text. This is the main Telugu line.</p>
              <p className="set-info-example">హుద<strong>న్</strong> వ మౌఇధతుల్</p>
            </div>
            <div className="set-info-row">
              <h4>Recited form <span>పఠన రూపం</span></h4>
              <p>How a reciter joins sounds between words (tajweed). A final <strong>న్</strong> merges into a following వ, య, మ, ల or ర, and becomes మ్ before బ.</p>
              <p className="set-info-example">హుద<strong>వ్</strong> వ మౌఇధతుల్</p>
            </div>
            <p className="set-info-note">
              The recited line appears only on verses where the two differ. Telugu letters cannot show nasalisation or vowel length — follow the audio for exact pronunciation.
            </p>
          </div>
        )}

        {/* Font Size */}
        <div className="set-item">
          <div className="set-item-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
              <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
            </svg>
            <div>
              <h3>Font Size</h3>
              <p>Adjust text size • ఫాంట్ పరిమాణం</p>
            </div>
          </div>
          <div className="font-controls">
            <button className="font-btn" onClick={decreaseFontSize} aria-label="Decrease font">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M5 12h14"/>
              </svg>
            </button>
            <span className="font-val">{fontSize}px</span>
            <button className="font-btn" onClick={increaseFontSize} aria-label="Increase font">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="set-preview">
          <h4>Preview</h4>
          <div className="preview-box">
            {showArabic && (
              <p className="preview-arabic" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            )}
            <p className="preview-roman" style={{ fontSize: `${fontSize}px` }}>
              Bismillaahir Rahmaanir Raheem
            </p>
            <p className="preview-english" style={{ fontSize: `${fontSize - 1}px` }}>
              In the name of Allah, the Most Gracious, the Most Merciful
            </p>
          </div>
        </div>
      </div>

      <footer className="set-footer">
        <p>May this app help you in your journey of understanding the Holy Quran</p>
        <p className="set-footer-telugu">ఈ యాప్ పవిత్ర ఖురాన్ అర్థం చేసుకోవడంలో మీకు సహాయపడుతుందని ఆశిస్తున్నాము</p>
      </footer>
    </div>
  )
}

export default Settings
