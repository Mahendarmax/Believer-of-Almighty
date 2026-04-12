import React, { useState, useCallback } from 'react'
import './SearchBar.css'

const SearchBar = React.memo(function SearchBar({ onSearch, placeholder = "Search surahs..." }) {
  const [value, setValue] = useState('')

  const handleChange = useCallback((e) => {
    const v = e.target.value
    setValue(v)
    onSearch(v)
  }, [onSearch])

  const handleClear = useCallback(() => {
    setValue('')
    onSearch('')
  }, [onSearch])

  return (
    <div className="search-bar">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {value && (
        <button className="search-clear" onClick={handleClear} aria-label="Clear search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  )
})
SearchBar.displayName = 'SearchBar'

export default SearchBar
