import React, { useState, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { asmaUlHusna } from '../data/asmaUlHusna'
import './AsmaUlHusna.css'

const NameCard = memo(({ name }) => (
  <div className="asma-card">
    <div className="asma-card-num">{name.num}</div>
    <p className="asma-card-arabic" dir="rtl">{name.arabic}</p>
    <p className="asma-card-roman">{name.roman}</p>
    <p className="asma-card-english">{name.english}</p>
    <p className="asma-card-telugu">{name.telugu}</p>
  </div>
))
NameCard.displayName = 'NameCard'

function AsmaUlHusna() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const filtered = useMemo(() => {
    if (!search) return asmaUlHusna
    const q = search.toLowerCase()
    return asmaUlHusna.filter(n =>
      n.roman.toLowerCase().includes(q) ||
      n.english.toLowerCase().includes(q) ||
      n.telugu.includes(search) ||
      n.arabic.includes(search) ||
      String(n.num) === search
    )
  }, [search])

  return (
    <div className="asma-page">
      <header className="asma-page-header">
        <button className="asma-page-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="asma-page-title-group">
          <h1 className="asma-page-title">☪️ 99 Names of Allah</h1>
          <span className="asma-page-subtitle">أسماء الله الحسنى — Asma ul Husna</span>
        </div>
      </header>

      <div className="asma-search-wrap">
        <input
          type="text"
          className="asma-search"
          placeholder="Search by name, number, or meaning..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="asma-grid">
        {filtered.map(name => (
          <NameCard key={name.num} name={name} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="asma-no-results">No names found for "{search}"</p>
      )}

      <div className="asma-footer">
        <p className="asma-hadith">
          Prophet ﷺ said: "Allah has 99 names. Whoever memorizes them will enter Paradise."
        </p>
        <cite className="asma-hadith-ref">— Sahih Al-Bukhari 2736</cite>
      </div>
    </div>
  )
}

export default AsmaUlHusna
