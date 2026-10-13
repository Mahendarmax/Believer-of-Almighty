import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { fetchHadithRoots, fetchHadithCategories, fetchHadithList, fetchHadith } from '../data/hadithApi'
import './Hadith.css'

const PER_PAGE = 20

// Expanded hadith body — fetches Telugu (and English when the mode asks for it)
const HadithDetail = ({ id, transliteration }) => {
  const [te, setTe] = useState(null)
  const [en, setEn] = useState(null)
  const [error, setError] = useState(false)
  const wantTe = transliteration !== 'english'
  const wantEn = transliteration !== 'telugu'

  useEffect(() => {
    let alive = true
    setError(false)
    const jobs = []
    if (wantTe) jobs.push(fetchHadith('te', id).then(d => alive && setTe(d)))
    if (wantEn) jobs.push(fetchHadith('en', id).then(d => alive && setEn(d)))
    Promise.all(jobs).catch(() => alive && setError(true))
    return () => { alive = false }
  }, [id, wantTe, wantEn])

  const primary = te || en
  if (error) return <p className="hd-detail-error">Could not load this hadith. Check your connection.</p>
  if (!primary) return <div className="hd-detail-loading"><div className="hd-spinner" /></div>

  const arabic = [primary.hadeeth_intro_ar, primary.hadeeth_ar].filter(Boolean).join(' ')

  return (
    <div className="hd-detail">
      {arabic && <p className="hd-arabic" dir="rtl">{arabic}</p>}

      {wantTe && te && (
        <div className="hd-block">
          <span className="hd-label">తెలుగు</span>
          {te.hadeeth_intro && <p className="hd-intro">{te.hadeeth_intro}</p>}
          <p className="hd-text">{te.hadeeth}</p>
        </div>
      )}
      {wantEn && en && (
        <div className="hd-block">
          <span className="hd-label">English</span>
          {en.hadeeth_intro && <p className="hd-intro">{en.hadeeth_intro}</p>}
          <p className="hd-text">{en.hadeeth}</p>
        </div>
      )}

      <div className="hd-meta">
        {primary.attribution && <span className="hd-source">{primary.attribution}</span>}
        {primary.grade && <span className="hd-grade">{primary.grade}</span>}
      </div>

      {wantTe && te?.explanation && (
        <div className="hd-block hd-explain">
          <span className="hd-label">వివరణ</span>
          <p>{te.explanation}</p>
        </div>
      )}
      {wantEn && en?.explanation && (
        <div className="hd-block hd-explain">
          <span className="hd-label">Explanation</span>
          <p>{en.explanation}</p>
        </div>
      )}

      {(() => {
        const hints = (wantTe && te?.hints?.length ? te.hints : null) || (wantEn && en?.hints?.length ? en.hints : null)
        if (!hints) return null
        return (
          <div className="hd-block hd-hints">
            <span className="hd-label">{transliteration === 'telugu' ? 'నేర్చుకోవలసినవి' : 'Lessons'}</span>
            <ul>{hints.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </div>
        )
      })()}
    </div>
  )
}

function Hadith() {
  const navigate = useNavigate()
  const { transliteration } = useSettings()
  const isTe = transliteration === 'telugu'
  const lang = transliteration === 'english' ? 'en' : 'te'

  const [roots, setRoots] = useState([])
  const [allCats, setAllCats] = useState([])
  const [catsError, setCatsError] = useState(false)
  const [selected, setSelected] = useState(null) // category object
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState(false)
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const handleBack = useCallback(() => {
    if (selected) { setSelected(null); setItems([]); setExpandedId(null); return }
    navigate(-1)
  }, [navigate, selected])

  // Categories (roots + full tree) for the chosen language
  useEffect(() => {
    let alive = true
    setCatsError(false)
    Promise.all([fetchHadithRoots(lang), fetchHadithCategories(lang)])
      .then(([r, all]) => { if (alive) { setRoots(r || []); setAllCats(all || []) } })
      .catch(() => alive && setCatsError(true))
    return () => { alive = false }
  }, [lang])

  // Hadith list for the selected category (paged)
  useEffect(() => {
    if (!selected) return
    let alive = true
    setLoadingList(true)
    setListError(false)
    fetchHadithList(lang, selected.id, page, PER_PAGE)
      .then(res => {
        if (!alive) return
        const data = res?.data || []
        setItems(prev => page === 1 ? data : [...prev, ...data])
        setLastPage(res?.meta?.last_page || 1)
        setTotal(res?.meta?.total_items || data.length)
      })
      .catch(() => alive && setListError(true))
      .finally(() => alive && setLoadingList(false))
    return () => { alive = false }
  }, [selected, page, lang])

  const openCategory = useCallback((cat) => {
    setSelected(cat)
    setItems([])
    setPage(1)
    setExpandedId(null)
    setQuery('')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const subcats = useMemo(
    () => selected ? allCats.filter(c => String(c.parent_id) === String(selected.id)) : [],
    [allCats, selected]
  )

  const q = query.trim().toLowerCase()
  const numericId = /^\d+$/.test(q) ? q : null

  // Searching with no category open: match any category title
  const matchedCats = useMemo(() => {
    if (!q || selected) return []
    return allCats.filter(c => (c.title || '').toLowerCase().includes(q)).slice(0, 30)
  }, [q, selected, allCats])

  const visibleItems = useMemo(
    () => q ? items.filter(h => (h.title || '').toLowerCase().includes(q)) : items,
    [items, q]
  )

  const t = (teText, enText) => (isTe ? teText : enText)

  return (
    <div className="hd-page">
      <header className="hd-header">
        <button className="hd-back" onClick={handleBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="hd-title-group">
          <h1 className="hd-title">{selected ? selected.title : t('హదీసులు', 'Hadith')}</h1>
          <span className="hd-subtitle">
            {selected
              ? `${total || selected.hadeeths_count || ''} ${t('హదీసులు', 'hadiths')}`
              : t('బుఖారీ, ముస్లిం & ఇతర ప్రామాణిక హదీసులు — తెలుగు వివరణతో', 'Authentic hadiths from Bukhari, Muslim & more, with explanation')}
          </span>
        </div>
      </header>

      {/* Search */}
      <div className="hd-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={selected
            ? t('ఈ అంశంలో వెతకండి…', 'Search in this topic…')
            : t('అంశం లేదా హదీసు నంబర్ వెతకండి…', 'Search a topic or hadith number…')}
          aria-label="Search hadith"
        />
        {query && (
          <button className="hd-search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>
        )}
      </div>

      {/* Direct open by hadith id */}
      {numericId && (
        <div className="hd-card expanded hd-direct">
          <div className="hd-card-head">
            <span className="hd-card-title">{t('హదీసు', 'Hadith')} #{numericId}</span>
          </div>
          <HadithDetail id={numericId} transliteration={transliteration} />
        </div>
      )}

      {/* Topic grid / category search results */}
      {!selected && !numericId && (
        <>
          {catsError && <p className="hd-error">{t('అంశాలు లోడ్ కాలేదు. ఇంటర్నెట్ చూసి మళ్ళీ ప్రయత్నించండి.', 'Could not load topics. Check your connection and try again.')}</p>}
          {!catsError && roots.length === 0 && <div className="hd-detail-loading"><div className="hd-spinner" /></div>}

          {q ? (
            <div className="hd-chips">
              {matchedCats.length === 0 && <p className="hd-empty">{t('ఏ అంశం దొరకలేదు', 'No matching topics')}</p>}
              {matchedCats.map(c => (
                <button key={c.id} className="hd-chip" onClick={() => openCategory(c)}>
                  {c.title} <span>{c.hadeeths_count}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="hd-topics">
              {roots.map(c => (
                <button key={c.id} className="hd-topic" onClick={() => openCategory(c)}>
                  <span className="hd-topic-title">{c.title}</span>
                  <span className="hd-topic-count">{c.hadeeths_count} {t('హదీసులు', 'hadiths')}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Selected topic: sub-topics + hadith list */}
      {selected && !numericId && (
        <>
          {subcats.length > 0 && (
            <div className="hd-chips">
              {subcats.map(c => (
                <button key={c.id} className="hd-chip" onClick={() => openCategory(c)}>
                  {c.title} <span>{c.hadeeths_count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="hd-list">
            {visibleItems.map(h => {
              const open = expandedId === h.id
              return (
                <div key={h.id} className={`hd-card ${open ? 'expanded' : ''}`}>
                  <button className="hd-card-head" onClick={() => setExpandedId(open ? null : h.id)} aria-expanded={open}>
                    <span className="hd-card-title">{h.title}</span>
                    <svg className={`hd-chevron ${open ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {open && <HadithDetail id={h.id} transliteration={transliteration} />}
                </div>
              )
            })}

            {listError && <p className="hd-error">{t('హదీసులు లోడ్ కాలేదు.', 'Could not load hadiths.')}</p>}
            {!loadingList && !listError && items.length === 0 && subcats.length === 0 && (
              <p className="hd-empty">{t('ఈ అంశంలో హదీసులు లేవు', 'No hadiths in this topic')}</p>
            )}
            {!loadingList && q && visibleItems.length === 0 && items.length > 0 && (
              <p className="hd-empty">{t('లోడ్ అయిన హదీసులలో దొరకలేదు — "మరిన్ని" నొక్కి చూడండి', 'Nothing in the loaded hadiths — try "Load more"')}</p>
            )}
            {loadingList && <div className="hd-detail-loading"><div className="hd-spinner" /></div>}
            {!loadingList && page < lastPage && (
              <button className="hd-more" onClick={() => setPage(p => p + 1)}>
                {t('మరిన్ని', 'Load more')} ({items.length}/{total})
              </button>
            )}
          </div>
        </>
      )}

      <p className="hd-credit">Source: HadeethEnc — Encyclopedia of Translated Prophetic Hadiths</p>
    </div>
  )
}

export default Hadith
