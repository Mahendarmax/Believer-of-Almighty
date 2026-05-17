import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, useRef } from 'react'

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

const saveSetting = (key, value) => {
  try { localStorage.setItem(`quran_${key}`, JSON.stringify(value)) }
  catch { /* quota exceeded — silent fail */ }
}

export const SettingsProvider = ({ children }) => {
  const [showArabic, setShowArabic] = useState(() => loadSetting('showArabic', true))
  const [fontSize, setFontSize] = useState(() => loadSetting('fontSize', 16))
  const [lastRead, setLastRead] = useState(() => loadSetting('lastRead', null))
  const [favorites, setFavorites] = useState(() => loadSetting('favorites', []))
  const [transliteration, setTransliteration] = useState(() => loadSetting('transliteration', 'telugu'))
  const [reciter, setReciter] = useState(() => loadSetting('reciter', 'ar.alafasy'))

  // Debounced localStorage writes — batch rapid changes (e.g. font size)
  const saveTimers = useRef({})
  const debouncedSave = useCallback((key, value, delay = 300) => {
    clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(() => saveSetting(key, value), delay)
  }, [])

  // Save to localStorage on change (debounced to reduce IO)
  useEffect(() => { debouncedSave('showArabic', showArabic, 0) }, [showArabic, debouncedSave])
  useEffect(() => { debouncedSave('fontSize', fontSize) }, [fontSize, debouncedSave])
  useEffect(() => { if (lastRead) debouncedSave('lastRead', lastRead, 0) }, [lastRead, debouncedSave])
  useEffect(() => { debouncedSave('favorites', favorites, 500) }, [favorites, debouncedSave])
  useEffect(() => { debouncedSave('transliteration', transliteration, 0) }, [transliteration, debouncedSave])
  useEffect(() => { debouncedSave('reciter', reciter, 0) }, [reciter, debouncedSave])

  const toggleArabic = useCallback(() => setShowArabic(prev => !prev), [])
  const increaseFontSize = useCallback(() => setFontSize(prev => Math.min(28, prev + 1)), [])
  const decreaseFontSize = useCallback(() => setFontSize(prev => Math.max(12, prev - 1)), [])

  const updateLastRead = useCallback((surahNumber, surahName, verseNumber) => {
    setLastRead({ surahNumber, surahName, verseNumber: verseNumber || 1, timestamp: Date.now() })
  }, [])

  const toggleFavorite = useCallback((surahNumber, surahName, verseNumber, arabicText, translationText) => {
    setFavorites(prev => {
      const key = `${surahNumber}:${verseNumber}`
      const exists = prev.find(f => f.key === key)
      if (exists) return prev.filter(f => f.key !== key)
      return [...prev, { key, surahNumber, surahName, verseNumber, arabic: arabicText, translation: translationText, timestamp: Date.now() }]
    })
  }, [])

  const isFavorite = useCallback((surahNumber, verseNumber) => {
    return favorites.some(f => f.key === `${surahNumber}:${verseNumber}`)
  }, [favorites])

  const value = useMemo(() => ({
    showArabic, toggleArabic,
    fontSize, increaseFontSize, decreaseFontSize,
    lastRead, updateLastRead,
    favorites, toggleFavorite, isFavorite,
    transliteration, setTransliteration,
    reciter, setReciter,
  }), [showArabic, toggleArabic, fontSize, increaseFontSize, decreaseFontSize, lastRead, updateLastRead, favorites, toggleFavorite, isFavorite, transliteration, reciter])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
