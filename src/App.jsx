import React, { lazy, Suspense, useEffect, useLayoutEffect, useCallback } from 'react'
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

// Lazy-load route components for code splitting
const Home = lazy(() => import('./pages/Home'))
const SurahList = lazy(() => import('./pages/SurahList'))
const VerseView = lazy(() => import('./pages/VerseView'))
const Favorites = lazy(() => import('./pages/Favorites'))
const NamazSurahs = lazy(() => import('./pages/NamazSurahs'))
const Duas = lazy(() => import('./pages/Duas'))
const DosAndDonts = lazy(() => import('./pages/DosAndDonts'))
const AsmaUlHusna = lazy(() => import('./pages/AsmaUlHusna'))
const TasbihCounter = lazy(() => import('./pages/TasbihCounter'))
const Adhkar = lazy(() => import('./pages/Adhkar'))
const ProphetIsa = lazy(() => import('./pages/ProphetIsa'))
const ProphetMuhammad = lazy(() => import('./pages/ProphetMuhammad'))

// Suspense fallback: matches app background to avoid any color-flash between
// lazy-loaded route transitions. Spinner fades in only after 200ms so cached
// chunks (which mount instantly) don't briefly show the loader.
const PageLoader = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '60vh', gap: '12px',
    background: 'var(--bg-primary)',
    animation: 'pageLoaderFadeIn 0.2s ease-out 0.2s both'
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
  // useLayoutEffect fires synchronously BEFORE the browser paints, so the new
  // page is never briefly visible at the old scroll position (no scroll-flash).
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Mobile back button: navigate within app instead of closing
function BackButtonHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Track that user has navigated within the app
    const entryKey = '__appEntry'
    if (!sessionStorage.getItem(entryKey)) {
      sessionStorage.setItem(entryKey, location.pathname)
      // Push an extra history entry so back doesn't exit immediately
      window.history.pushState({ app: true }, '')
    }
  }, [])

  useEffect(() => {
    const isHome = location.pathname === '/' || location.pathname === ''

    const handlePopState = (e) => {
      if (isHome) {
        // On home page, prevent exit — push state again
        window.history.pushState({ app: true }, '')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [location.pathname, navigate])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <HashRouter>
          <ScrollToTop />
          <BackButtonHandler />
          <div className="app">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/surahs" element={<SurahList />} />
                <Route path="/surah/:number" element={<VerseView />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/namaz" element={<NamazSurahs />} />
                <Route path="/duas" element={<Duas />} />
                <Route path="/dos-and-donts" element={<DosAndDonts />} />
                <Route path="/names-of-allah" element={<AsmaUlHusna />} />
                <Route path="/tasbih" element={<TasbihCounter />} />
                <Route path="/adhkar" element={<Adhkar />} />
                <Route path="/prophet-isa" element={<ProphetIsa />} />
                <Route path="/prophet-muhammad" element={<ProphetMuhammad />} />
              </Routes>
            </Suspense>
          </div>
        </HashRouter>
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App
