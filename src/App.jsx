import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import Home from './pages/Home'
import SurahList from './pages/SurahList'
import VerseView from './pages/VerseView'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/surahs" element={<SurahList />} />
            <Route path="/surah/:number" element={<VerseView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SettingsProvider>
  )
}

export default App
