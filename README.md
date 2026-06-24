# Believer of Almighty — Holy Quran App

**Read, Listen & Understand the words of Allah**

A complete Islamic web application built with React + Vite, featuring the Holy Quran with Arabic, English, and Telugu translations, verse-by-verse audio from 35 world-renowned reciters, and a rich set of Islamic tools including Duas, Adhkar, Tasbih, 99 Names of Allah, and more.

**Live:** [https://mahendarmax.github.io/Believer-of-Almighty/](https://mahendarmax.github.io/Believer-of-Almighty/)

---

## Features

### Quran Reader
- All **114 Surahs** with **6,236 verses** across **30 Juz**
- Arabic text with English and Telugu translations
- Transliteration in Roman English, Roman Telugu, or both
- Verse-by-verse audio playback with **35 reciters** (default: Nasser Al-Qatami)
- Full Surah audio streaming
- Bookmarks, favorites, and continue-reading tracker
- Adjustable Arabic font size
- **Dark mode** for comfortable reading — applies to the verse reading page

### Namaz Surahs
- **8 commonly recited Surahs** for Salah (Al-Fatiha, Al-Ikhlas, Al-Falaq, An-Nas, Al-Kafirun, Al-Kauthar, Al-Asr, Al-Fil)
- Full Arabic text with Roman transliteration and word-by-word Telugu meaning

### Duas
- **24 recommended Duas** from Quran and Hadith
- Categories: Daily, Forgiveness, Protection, Family, Prayer, Evil Eye, Dhikr
- Arabic text with Telugu translation

### Dos & Don'ts in Islam
- **45 items** across 4 categories
- Halal, Haram, Makruh, and Sunnah classifications

### 99 Names of Allah (Asma ul Husna)
- All 99 names with Arabic, transliteration, English meaning, and Telugu translation
- Detailed explanation for each name

### Tasbih Counter
- Digital dhikr counter with presets:
  SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Astaghfirullah
- Session tracking with count history

### Adhkar
- **14 daily Adhkar** — 7 Morning and 7 Evening
- Arabic text with transliteration and hadith references

### Prophet Isa (Jesus) — Peace Be Upon Him
- Verses from Bible and Quran across 7 categories
- Telugu translations included

### Seerah — Prophet Muhammad (Peace Be Upon Him)
- **16 chapters** covering **48 key events** from birth to passing
- Arabic, English, and Telugu text for each event

### Favorites
- Save any Quran verse to favorites
- Quick access from the home screen

---

## Dark Mode

A pill-shaped toggle on the home page enables dark mode. The label dynamically shows the current state — **DARK MODE** or **LIGHT MODE** (with Telugu equivalents). Dark mode applies exclusively to the **verse reading page** for a comfortable reading experience; all other pages remain in the light theme.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router v6 (HashRouter) |
| Styling | Plain CSS with CSS custom properties |
| Audio | everyayah.com CDN (35 reciters, 128–192 kbps) |
| Image Export | html-to-image (verse screenshot sharing) |
| Storage | localStorage (preferences, favorites, reading progress) |
| Offline | Service Worker with cache-first strategy for audio |
| Deployment | GitHub Pages via GitHub Actions |

---

## Project Structure

```
Believer-of-Almighty/
├── src/
│   ├── pages/          ← Page components (Home, VerseView, SurahList, etc.)
│   ├── components/     ← Shared components (AudioPlayer, SearchBar, ErrorBoundary)
│   ├── context/        ← SettingsContext (theme, reciter, transliteration, font size)
│   ├── data/           ← Quran metadata, duas, adhkar, asma ul husna, seerah
│   └── utils/          ← Telugu transliteration utility
├── public/             ← Static assets, manifest, service worker
├── .github/workflows/  ← GitHub Actions deploy workflow
└── vite.config.js
```

---

## Local Development

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # production build → dist/
npm run preview     # preview production build
```

---

## Deployment

Every push to the `develop` branch triggers the GitHub Actions workflow which builds and deploys to GitHub Pages automatically.

```
Push to develop → npm install → vite build → Deploy to GitHub Pages
```
