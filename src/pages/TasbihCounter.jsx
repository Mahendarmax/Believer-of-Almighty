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

function TasbihCounter() {
  const navigate = useNavigate()
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

  const preset = PRESETS[activePreset]
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

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
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
          <h1 className="tasbih-page-title">📿 Tasbih Counter</h1>
          <span className="tasbih-page-subtitle">Digital Dhikr Counter — tap to count</span>
        </div>
      </header>

      {/* Preset selector */}
      <div className="tasbih-presets">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className={`tasbih-preset-btn ${activePreset === i ? 'active' : ''}`}
            onClick={() => handlePreset(i)}
            style={activePreset === i ? { borderColor: p.color, color: p.color } : {}}
          >
            <span className="tasbih-preset-roman">{p.roman}</span>
          </button>
        ))}
      </div>

      {/* Main counter area */}
      <div className="tasbih-counter-area">
        <p className="tasbih-arabic" dir="rtl">{preset.label}</p>
        <p className="tasbih-roman">{preset.roman}</p>
        <p className="tasbih-telugu">{preset.telugu}</p>

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
