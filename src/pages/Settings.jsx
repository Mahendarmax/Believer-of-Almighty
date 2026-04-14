import React, { useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import './Settings.css'

// Detect if running inside the APK (Capacitor WebView sets this user agent)
const isApk = typeof navigator !== 'undefined' && navigator.userAgent.includes('HolyQuranApp')

function Settings() {
  const navigate = useNavigate()
  const { showArabic, toggleArabic, fontSize, increaseFontSize, decreaseFontSize } = useSettings()
  const [showExportGuide, setShowExportGuide] = useState(false)
  const [importStatus, setImportStatus] = useState(null) // 'success' | 'error'
  const fileInputRef = useRef(null)

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const handleExport = useCallback(() => {
    setShowExportGuide(true)
  }, [])

  const doExport = useCallback(async () => {
    const data = {}
    const keys = ['quran_favorites', 'quran_lastRead', 'quran_transliteration', 'quran_reciter', 'quran_fontSize', 'quran_showArabic']
    keys.forEach(k => {
      const val = localStorage.getItem(k)
      if (val !== null) data[k] = val
    })
    const filename = `quran-backup-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

    // On Android WebView, use Web Share API to share/save the file
    if (navigator.canShare) {
      const file = new File([blob], filename, { type: 'application/json' })
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Quran Backup' })
        } catch {
          // User cancelled or share failed — do nothing
        }
        setShowExportGuide(false)
        return
      }
    }

    // Web fallback: trigger download via anchor
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportGuide(false)
  }, [])

  const handleImport = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v))
        setImportStatus('success')
        setTimeout(() => { setImportStatus(null); window.location.reload() }, 1500)
      } catch {
        setImportStatus('error')
        setTimeout(() => setImportStatus(null), 2500)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  return (
    <div className="settings-page">
      {/* Export Guide Modal */}
      {showExportGuide && (
        <div className="backup-overlay" onClick={() => setShowExportGuide(false)}>
          <div className="backup-modal" onClick={e => e.stopPropagation()}>
            <div className="backup-modal-icon">💾</div>
            <h2 className="backup-modal-title">Export Your Data</h2>
            <p className="backup-modal-subtitle">మీ డేటాను బ్యాకప్ చేయండి</p>
            <div className="backup-steps">
              <div className="backup-step">
                <span className="backup-step-num">1</span>
                <span>Tap <strong>Download Backup</strong> — a <code>.json</code> file saves to your device</span>
              </div>
              <div className="backup-step">
                <span className="backup-step-num">2</span>
                <span>After reinstalling the APK, open the app and go to <strong>Settings</strong></span>
              </div>
              <div className="backup-step">
                <span className="backup-step-num">3</span>
                <span>Tap <strong>Import Backup</strong> and pick the downloaded file</span>
              </div>
              <div className="backup-step">
                <span className="backup-step-num">4</span>
                <span>All your favorites and reading position will be restored ✅</span>
              </div>
            </div>
            <p className="backup-note">📁 This file contains your favorites, reading position, and preferences. Keep it safe.</p>
            <div className="backup-modal-actions">
              <button className="backup-btn-cancel" onClick={() => setShowExportGuide(false)}>Cancel</button>
              <button className="backup-btn-download" onClick={doExport}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Backup
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* Backup & Restore — APK only */}
        {isApk && <div className="backup-section">
          <div className="backup-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
              <path d="M12 8v4l3 3"/>
            </svg>
            Data Backup
          </div>
          <p className="backup-section-desc">Save and restore your favorites, reading position & preferences • మీ డేటాను భద్రపరచండి</p>
          <div className="backup-actions">
            <button className="backup-export-btn" onClick={handleExport}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Backup
            </button>
            <button className="backup-import-btn" onClick={() => fileInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import Backup
            </button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
          {importStatus === 'success' && (
            <div className="backup-status success">✅ Data restored successfully! Reloading...</div>
          )}
          {importStatus === 'error' && (
            <div className="backup-status error">❌ Invalid backup file. Please try again.</div>
          )}
        </div>}
      </div>

      <footer className="set-footer">
        <p>May this app help you in your journey of understanding the Holy Quran</p>
        <p className="set-footer-telugu">ఈ యాప్ పవిత్ర ఖురాన్ అర్థం చేసుకోవడంలో మీకు సహాయపడుతుందని ఆశిస్తున్నాము</p>
      </footer>
    </div>
  )
}

export default Settings
