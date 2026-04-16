import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const { showArabic, toggleArabic, fontSize, increaseFontSize, decreaseFontSize } = useSettings()
  const [showExportGuide, setShowExportGuide] = useState(false)
  const [exportCopied, setExportCopied] = useState(false)
  const [exportText, setExportText] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [showPasteImport, setShowPasteImport] = useState(false)
  const [pasteValue, setPasteValue] = useState('')

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const handleExport = useCallback(() => {
    setExportCopied(false)
    setExportText(null)
    setShowExportGuide(true)
  }, [])

  const buildBackupJson = useCallback(() => {
    const data = {}
    const keys = ['quran_favorites', 'quran_lastRead', 'quran_transliteration', 'quran_reciter', 'quran_fontSize', 'quran_showArabic']
    keys.forEach(k => {
      const val = localStorage.getItem(k)
      if (val !== null) data[k] = val
    })
    return JSON.stringify(data, null, 2)
  }, [])

  const doExport = useCallback(async () => {
    const jsonString = buildBackupJson()
    const filename = `quran-backup-${new Date().toISOString().slice(0, 10)}.json`

    try {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([blob], filename, { type: 'application/json' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Quran Backup' })
        setShowExportGuide(false)
        return
      }
    } catch { /* fall through */ }

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Quran Backup', text: jsonString })
        setShowExportGuide(false)
        return
      }
    } catch { /* fall through */ }

    try {
      await navigator.clipboard.writeText(jsonString)
      setExportCopied(true)
      return
    } catch { /* fall through */ }

    setExportText(jsonString)
  }, [buildBackupJson])

  const restoreData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (typeof data !== 'object' || Array.isArray(data)) throw new Error()
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v))
      setImportStatus('success')
      setTimeout(() => { setImportStatus(null); window.location.reload() }, 1500)
    } catch {
      setImportStatus('error')
      setTimeout(() => setImportStatus(null), 2500)
    }
  }, [])

  const handlePasteImport = useCallback(() => {
    restoreData(pasteValue)
    setPasteValue('')
    setShowPasteImport(false)
  }, [pasteValue, restoreData])

  return (
    <div className="settings-page">

      {/* ── Export Guide Modal ── */}
      {showExportGuide && (
        <div className="backup-overlay" onClick={() => setShowExportGuide(false)}>
          <div className="backup-modal" onClick={e => e.stopPropagation()}>
            <div className="backup-modal-icon">💾</div>
            <h2 className="backup-modal-title">Export Your Data</h2>
            <p className="backup-modal-subtitle">మీ డేటాను బ్యాకప్ చేయండి</p>

            {!exportCopied && !exportText && (
              <>
                <div className="backup-steps">
                  <div className="backup-step">
                    <span className="backup-step-num">1</span>
                    <span>Tap <strong>Share / Save Backup</strong> — Android share sheet opens</span>
                  </div>
                  <div className="backup-step">
                    <span className="backup-step-num">2</span>
                    <span>Share to <strong>WhatsApp Saved Messages</strong>, <strong>Google Keep</strong>, or any notes app</span>
                  </div>
                  <div className="backup-step">
                    <span className="backup-step-num">3</span>
                    <span>After reinstalling, open that message and <strong>copy the JSON text</strong></span>
                  </div>
                  <div className="backup-step">
                    <span className="backup-step-num">4</span>
                    <span>Go to <strong>Settings → Paste JSON</strong>, paste it, tap <strong>Restore</strong> ✅</span>
                  </div>
                </div>
                <p className="backup-note">📁 Contains your favorites, reading position &amp; preferences.</p>
                <div className="backup-modal-actions">
                  <button className="backup-btn-cancel" onClick={() => setShowExportGuide(false)}>Cancel</button>
                  <button className="backup-btn-download" onClick={doExport}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Share / Save Backup
                  </button>
                </div>
              </>
            )}

            {exportCopied && (
              <div className="backup-copied-msg">
                <div className="backup-copied-icon">✅</div>
                <p><strong>Backup copied to clipboard!</strong></p>
                <p className="backup-copied-sub">Paste it in WhatsApp Saved Messages or Google Keep to save. To restore: copy → Settings → Paste JSON → Restore.</p>
                <button className="backup-btn-cancel" onClick={() => { setExportCopied(false); setShowExportGuide(false) }}>Done</button>
              </div>
            )}

            {exportText && (
              <div className="backup-manual-copy">
                <p className="backup-note">🔴 Sharing not available. Copy the text below and save it to Notes.</p>
                <textarea className="backup-json-textarea" value={exportText} readOnly rows={6} onClick={e => e.target.select()} />
                <div className="backup-modal-actions">
                  <button className="backup-btn-cancel" onClick={() => { setExportText(null); setShowExportGuide(false) }}>Close</button>
                  <button className="backup-btn-download" onClick={() => {
                    navigator.clipboard?.writeText(exportText).then(() => { setExportCopied(true); setExportText(null) }).catch(() => {})
                  }}>Copy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Redesigned Header ── */}
      <header className="set-header">
        <button className="set-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="set-header-center">
          <div className="set-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h1 className="set-title">Settings</h1>
        </div>
      </header>

      <div className="set-content">

        {/* ── Section: Display ── */}
        <p className="set-section-label">Display</p>

        {/* Arabic Toggle */}
        <div className="set-item">
          <div className="set-item-info">
            <div className="set-item-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
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
            <div className="set-item-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
              </svg>
            </div>
            <div>
              <h3>Font Size</h3>
              <p>Adjust text size • ఫాంట్ పరిమాణం</p>
            </div>
          </div>
          <div className="font-controls">
            <button className="font-btn" onClick={decreaseFontSize} aria-label="Decrease font">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M5 12h14"/>
              </svg>
            </button>
            <span className="font-val">{fontSize}px</span>
            <button className="font-btn" onClick={increaseFontSize} aria-label="Increase font">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
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

        {/* ── Section: Data Backup ── */}
        <p className="set-section-label" style={{ marginTop: '8px' }}>Data Backup</p>

        <div className="backup-section">
          <div className="backup-section-header">
            <div className="backup-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5"/>
                <path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3"/>
              </svg>
            </div>
            <div>
              <div className="backup-section-title">Save &amp; Restore</div>
              <p className="backup-section-desc">Back up favorites, reading position &amp; preferences • మీ డేటాను భద్రపరచండి</p>
            </div>
          </div>

          <div className="backup-action-row">
            <button className="backup-card-btn export" onClick={handleExport}>
              <span className="backup-card-btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </span>
              <span className="backup-card-btn-text">
                <span className="backup-card-btn-label">Export</span>
                <span className="backup-card-btn-sub">Share your backup</span>
              </span>
            </button>

            <button className="backup-card-btn import" onClick={() => setShowPasteImport(v => !v)}>
              <span className="backup-card-btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 14 12 9 17 14"/>
                  <line x1="12" y1="9" x2="12" y2="21"/>
                </svg>
              </span>
              <span className="backup-card-btn-text">
                <span className="backup-card-btn-label">Import</span>
                <span className="backup-card-btn-sub">Paste &amp; restore</span>
              </span>
            </button>
          </div>

          {showPasteImport && (
            <div className="backup-paste-area">
              <p className="backup-paste-label">Paste your backup JSON here:</p>
              <textarea
                className="backup-json-textarea"
                value={pasteValue}
                onChange={e => setPasteValue(e.target.value)}
                rows={5}
                placeholder='{"quran_favorites":"..."}'
              />
              <button
                className="backup-restore-btn"
                onClick={handlePasteImport}
                disabled={!pasteValue.trim()}
              >
                Restore from Paste
              </button>
            </div>
          )}

          {importStatus === 'success' && (
            <div className="backup-status success">✅ Data restored successfully! Reloading...</div>
          )}
          {importStatus === 'error' && (
            <div className="backup-status error">❌ Invalid backup file. Please try again.</div>
          )}
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
