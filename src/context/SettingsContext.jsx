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
  const [favorites, setFavorites] = useState(() => loadSetting('favorites', []))
  const [transliteration, setTransliteration] = useState(() => loadSetting('transliteration', 'both'))

  // Save to localStorage on change
  useEffect(() => { localStorage.setItem('quran_showArabic', JSON.stringify(showArabic)) }, [showArabic])
  useEffect(() => { localStorage.setItem('quran_fontSize', JSON.stringify(fontSize)) }, [fontSize])
  useEffect(() => { if (lastRead) localStorage.setItem('quran_lastRead', JSON.stringify(lastRead)) }, [lastRead])
  useEffect(() => { localStorage.setItem('quran_favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('quran_transliteration', JSON.stringify(transliteration)) }, [transliteration])

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
  }), [showArabic, toggleArabic, fontSize, increaseFontSize, decreaseFontSize, lastRead, updateLastRead, favorites, toggleFavorite, isFavorite, transliteration])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
