import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import './Favorites.css'

function Favorites() {
  const navigate = useNavigate()
  const { favorites, toggleFavorite, showArabic } = useSettings()
  const [teluguLookup, setTeluguLookup] = useState({})

  // Backfill Telugu for favorites saved before it was stored, by surah+verse
  useEffect(() => {
    const missing = favorites.filter(f => !f.telugu)
    if (missing.length === 0) return
    const surahNums = [...new Set(missing.map(f => f.surahNumber))]
    let cancelled = false
    Promise.all(surahNums.map(async (n) => {
      try {
        const res = await fetch(`/quran-support/${n}.json`)
        if (!res.ok) return []
        const data = await res.json()
        return (data.verses || []).map(v => [`${n}:${v.number}`, v.telugu || ''])
      } catch {
        return []
      }
    })).then(results => {
      if (cancelled) return
      const map = {}
      results.flat().forEach(([k, t]) => { if (t) map[k] = t })
      setTeluguLookup(map)
    })
    return () => { cancelled = true }
  }, [favorites])

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const handleGoToVerse = useCallback((surahNumber, verseNumber) => {
    navigate(`/surah/${surahNumber}?verse=${verseNumber}&t=${Date.now()}`)
  }, [navigate])

  const sortedFavorites = useMemo(() => [...favorites].sort((a, b) => b.timestamp - a.timestamp), [favorites])

  return (
    <div className="favorites-page">
      <header className="fav-header">
        <button className="fav-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="fav-title-group">
          <h1 className="fav-title">Favorites</h1>
          <span className="fav-subtitle">{favorites.length} saved verse{favorites.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      {sortedFavorites.length === 0 ? (
        <div className="fav-empty">
          <div className="fav-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <p>No favorites yet</p>
          <span>Tap the heart icon on any verse to save it here</span>
        </div>
      ) : (
        <div className="fav-list">
          {sortedFavorites.map((fav) => {
            const telugu = fav.telugu || teluguLookup[fav.key]
            return (
            <div key={fav.key} className="fav-card">
              <div className="fav-card-header">
                <div className="fav-card-info">
                  <span className="fav-card-surah">{fav.surahName}</span>
                  <span className="fav-card-verse">Verse {fav.verseNumber}</span>
                </div>
                <div className="fav-card-actions">
                  <button
                    className="fav-card-go"
                    onClick={() => handleGoToVerse(fav.surahNumber, fav.verseNumber)}
                    title="Go to verse"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </button>
                  <button
                    className="fav-card-remove"
                    onClick={() => toggleFavorite(fav.surahNumber, fav.surahName, fav.verseNumber, fav.arabic, fav.translation, fav.telugu)}
                    title="Remove from favorites"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
              {showArabic && fav.arabic && (
                <p className="fav-card-arabic" dir="rtl">{fav.arabic}</p>
              )}
              {telugu && (
                <p className="fav-card-telugu">{telugu}</p>
              )}
              {fav.translation && (
                <p className="fav-card-translation">{fav.translation}</p>
              )}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Favorites
