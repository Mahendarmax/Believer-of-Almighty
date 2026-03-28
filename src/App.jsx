import React, { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

// Lazy-load route components for code splitting
const Home = lazy(() => import('./pages/Home'))
const SurahList = lazy(() => import('./pages/SurahList'))
const VerseView = lazy(() => import('./pages/VerseView'))
const Settings = lazy(() => import('./pages/Settings'))
const Favorites = lazy(() => import('./pages/Favorites'))
const NamazSurahs = lazy(() => import('./pages/NamazSurahs'))
const Duas = lazy(() => import('./pages/Duas'))

const PageLoader = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '60vh', gap: '12px', color: '#94a3b8'
  }}>
    <div style={{
      width: 40, height: 40, border: '3px solid rgba(212,164,74,0.15)',
      borderTopColor: '#d4a44a', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
  </div>
)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <HashRouter>
          <ScrollToTop />
          <div className="app">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/surahs" element={<SurahList />} />
                <Route path="/surah/:number" element={<VerseView />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/namaz" element={<NamazSurahs />} />
                <Route path="/duas" element={<Duas />} />
              </Routes>
            </Suspense>
          </div>
        </HashRouter>
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App
