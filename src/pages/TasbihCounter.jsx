import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './TasbihCounter.css'

const PRESETS = [
  { label: 'سُبْحَانَ اللَّهِ', roman: 'SubhanAllah', telugu: 'సుబ్హానల్లాహ్', target: 33, color: '#34d399' },
  { label: 'ٱلْحَمْدُ لِلَّهِ', roman: 'Alhamdulillah', telugu: 'అల్హందులిల్లాహ్', target: 33, color: '#63b3ed' },
  { label: 'ٱللَّهُ أَكْبَرُ', roman: 'Allahu Akbar', telugu: 'అల్లాహు అక్బర్', target: 34, color: '#d4a44a' },
  { label: 'لَا إِلَٰهَ إِلَّا ٱللَّهُ', roman: 'La ilaha illallah', telugu: 'లా ఇలాహ ఇల్లల్లాహ్', target: 100, color: '#a78bfa' },
  { label: 'أَسْتَغْفِرُ ٱللَّهَ', roman: 'Astaghfirullah', telugu: 'అస్తఘ్ఫిరుల్లాహ్', target: 100, color: '#f472b6' },
]

Object.freeze(PRESETS)

const CUSTOM_COLORS = ['#fb923c', '#22d3ee', '#e879f9', '#facc15', '#4ade80', '#f87171']

function loadCustomZikrs() {
  try {
    const val = localStorage.getItem('tasbih_custom_zikrs')
    return val ? JSON.parse(val) : []
  } catch { return [] }
}

function saveCustomZikrs(zikrs) {
  try { localStorage.setItem('tasbih_custom_zikrs', JSON.stringify(zikrs)) }
  catch { /* quota exceeded */ }
}

function TasbihCounter() {
  const navigate = useNavigate()
  const [customZikrs, setCustomZikrs] = useState(loadCustomZikrs)
  const [showAddForm, setShowAddForm] = useState(false)
  const [customText, setCustomText] = useState('')
  const [customTarget, setCustomTarget] = useState(33)

  const allPresets = [...PRESETS, ...customZikrs]

  const [activePreset, setActivePreset] = useState(() => {
    try { return parseInt(sessionStorage.getItem('tasbih_preset')) || 0 } catch { return 0 }
  })
  const [count, setCount] = useState(() => {
    try { return parseInt(sessionStorage.getItem('tasbih_count')) || 0 } catch { return 0 }
  })
  const [totalSets, setTotalSets] = useState(() => {
    try { return parseInt(sessionStorage.getItem('tasbih_sets')) || 0 } catch { return 0 }
  })
  const vibrate = useRef(typeof navigator !== 'undefined' && navigator.vibrate)

  // Persist to sessionStorage so progress survives navigation
  useEffect(() => {
    try {
      sessionStorage.setItem('tasbih_preset', activePreset)
      sessionStorage.setItem('tasbih_count', count)
      sessionStorage.setItem('tasbih_sets', totalSets)
    } catch { /* quota exceeded */ }
  }, [activePreset, count, totalSets])

  // Clamp activePreset if custom zikrs were removed
  useEffect(() => {
    if (activePreset >= allPresets.length) {
      setActivePreset(0)
      setCount(0)
    }
  }, [activePreset, allPresets.length])

  const preset = allPresets[activePreset] || allPresets[0]
  const progress = Math.min((count / preset.target) * 100, 100)

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const handleCount = useCallback(() => {
    setCount(prev => {
      const next = prev + 1
      if (next >= preset.target) {
        setTotalSets(s => s + 1)
        if (vibrate.current) try { navigator.vibrate([100, 50, 100]) } catch (_) {}
        return 0
      }
      if (vibrate.current) try { navigator.vibrate(30) } catch (_) {}
      return next
    })
  }, [preset.target])

  const handleReset = useCallback(() => setCount(0), [])

  const handlePreset = useCallback((idx) => {
    setActivePreset(idx)
    setCount(0)
  }, [])

  const handleAddCustom = useCallback(() => {
    const text = customText.trim()
    if (!text) return
    const newZikr = {
      label: text,
      roman: text,
      telugu: '',
      target: parseInt(customTarget) || 33,
      color: CUSTOM_COLORS[customZikrs.length % CUSTOM_COLORS.length],
      isCustom: true,
    }
    const updated = [...customZikrs, newZikr]
    setCustomZikrs(updated)
    saveCustomZikrs(updated)
    setCustomText('')
    setCustomTarget(33)
    setShowAddForm(false)
    setActivePreset(PRESETS.length + updated.length - 1)
    setCount(0)
  }, [customText, customTarget, customZikrs])

  const handleRemoveCustom = useCallback((customIdx) => {
    const updated = customZikrs.filter((_, i) => i !== customIdx)
    setCustomZikrs(updated)
    saveCustomZikrs(updated)
    if (activePreset >= PRESETS.length + customIdx) {
      setActivePreset(0)
      setCount(0)
    }
  }, [customZikrs, activePreset])

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (e.target.tagName === 'INPUT') return
        e.preventDefault()
        handleCount()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleCount])

  return (
    <div className="tasbih-page">
      <header className="tasbih-page-header">
        <button className="tasbih-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="tasbih-page-title-group">
          <h1 className="tasbih-page-title">Tasbih Counter</h1>
          <span className="tasbih-page-subtitle">Digital Dhikr Counter — tap to count</span>
        </div>
      </header>

      {/* Preset selector */}
      <div className="tasbih-presets">
        {allPresets.map((p, i) => (
          <button
            key={i}
            className={`tasbih-preset-btn ${activePreset === i ? 'active' : ''}`}
            onClick={() => handlePreset(i)}
            style={activePreset === i ? { borderColor: p.color, color: p.color } : {}}
          >
            <span className="tasbih-preset-roman">{p.roman}</span>
            {p.isCustom && (
              <span
                className="tasbih-preset-remove"
                onClick={(e) => { e.stopPropagation(); handleRemoveCustom(i - PRESETS.length) }}
                title="Remove custom zikr"
              >×</span>
            )}
          </button>
        ))}
        <button
          className="tasbih-preset-btn tasbih-add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          title="Add custom zikr"
        >
          <span className="tasbih-preset-roman">{showAddForm ? '✕' : '+ Custom'}</span>
        </button>
      </div>

      {/* Add custom zikr form */}
      {showAddForm && (
        <div className="tasbih-custom-form">
          <input
            type="text"
            className="tasbih-custom-input"
            placeholder="Enter dua or name of Allah..."
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            maxLength={100}
            autoFocus
          />
          <div className="tasbih-custom-row">
            <label className="tasbih-custom-label">
              Target count:
              <input
                type="number"
                className="tasbih-custom-target"
                value={customTarget}
                onChange={e => setCustomTarget(e.target.value)}
                min={1}
                max={1000}
              />
            </label>
            <button className="tasbih-custom-save" onClick={handleAddCustom} disabled={!customText.trim()}>
              Add Zikr
            </button>
          </div>
        </div>
      )}

      {/* Main counter area */}
      <div className="tasbih-counter-area">
        <p className="tasbih-arabic" dir="rtl">{preset.label}</p>
        <p className="tasbih-roman">{preset.roman}</p>
        {preset.telugu && <p className="tasbih-telugu">{preset.telugu}</p>}

        {/* Circular progress */}
        <div className="tasbih-circle-wrap">
          <svg className="tasbih-circle-svg" viewBox="0 0 200 200">
            <circle className="tasbih-circle-bg" cx="100" cy="100" r="85" />
            <circle
              className="tasbih-circle-progress"
              cx="100" cy="100" r="85"
              style={{
                strokeDashoffset: 534 - (534 * progress / 100),
                stroke: preset.color,
              }}
            />
          </svg>
          <button className="tasbih-tap-btn" onClick={handleCount} style={{ color: preset.color }}>
            <span className="tasbih-count">{count}</span>
            <span className="tasbih-target">/ {preset.target}</span>
          </button>
        </div>

        <p className="tasbih-tap-hint">Tap the circle or press Space</p>

        <div className="tasbih-stats">
          <div className="tasbih-stat">
            <span className="tasbih-stat-num">{totalSets}</span>
            <span className="tasbih-stat-label">Sets completed</span>
          </div>
          <div className="tasbih-stat">
            <span className="tasbih-stat-num">{totalSets * preset.target + count}</span>
            <span className="tasbih-stat-label">Total count</span>
          </div>
        </div>

        <button className="tasbih-reset-btn" onClick={handleReset}>
          Reset Count
        </button>
      </div>
    </div>
  )
}

export default TasbihCounter
