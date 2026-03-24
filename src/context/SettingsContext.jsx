import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}

// Persist settings to localStorage
const loadSetting = (key, fallback) => {
  try {
    const val = localStorage.getItem(`quran_${key}`)
    if (val === null) return fallback
    return JSON.parse(val)
  } catch { return fallback }
}

export const SettingsProvider = ({ children }) => {
  const [showArabic, setShowArabic] = useState(() => loadSetting('showArabic', true))
  const [fontSize, setFontSize] = useState(() => loadSetting('fontSize', 16))
  const [lastRead, setLastRead] = useState(() => loadSetting('lastRead', null))

  // Save to localStorage on change
  useEffect(() => { localStorage.setItem('quran_showArabic', JSON.stringify(showArabic)) }, [showArabic])
  useEffect(() => { localStorage.setItem('quran_fontSize', JSON.stringify(fontSize)) }, [fontSize])
  useEffect(() => { if (lastRead) localStorage.setItem('quran_lastRead', JSON.stringify(lastRead)) }, [lastRead])

  const toggleArabic = useCallback(() => setShowArabic(prev => !prev), [])
  const increaseFontSize = useCallback(() => setFontSize(prev => Math.min(28, prev + 1)), [])
  const decreaseFontSize = useCallback(() => setFontSize(prev => Math.max(12, prev - 1)), [])
  const updateLastRead = useCallback((surahNumber, surahName) => {
    setLastRead({ surahNumber, surahName, timestamp: Date.now() })
  }, [])

  const value = useMemo(() => ({
    showArabic, toggleArabic,
    fontSize, increaseFontSize, decreaseFontSize,
    lastRead, updateLastRead,
  }), [showArabic, toggleArabic, fontSize, increaseFontSize, decreaseFontSize, lastRead, updateLastRead])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
