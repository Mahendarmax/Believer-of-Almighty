# ﷽ Believer of Almighty — Holy Quran App

**Read, Listen & Understand the words of Allah**

A complete Islamic web application built with React + Vite, featuring the Holy Quran with Arabic, English, and Telugu translations, verse-by-verse audio, and a rich set of Islamic tools.

🌐 **Live Web App:** [https://mahendarmax.github.io/Believer-of-Almighty/](https://mahendarmax.github.io/Believer-of-Almighty/)

---

## 🏗️ Project Structure

```
Believer-of-Almighty/
├── src/                        ← React source code
│   ├── pages/                  ← All page components
│   ├── components/             ← Shared components (AudioPlayer, SearchBar, etc.)
│   ├── context/                ← Settings context (theme, reciter, transliteration)
│   ├── data/                   ← Quran, duas, adhkar, asma ul husna data files
│   └── utils/                  ← Telugu transliteration utility
├── public/                     ← Static assets (manifest, service worker)
├── .github/
│   └── workflows/
│       └── jekyll-gh-pages.yml ← Auto-deploys to GitHub Pages on push
└── vite.config.js              ← Vite build config
```

---

## 🚀 Deployment

Every push to the `develop` branch automatically builds and deploys to GitHub Pages via the `jekyll-gh-pages.yml` workflow:

```
Push to develop
      │
      ▼
jekyll-gh-pages.yml triggers
  → npm install
  → vite build
  → Deploy to GitHub Pages
      │
      ▼
Live at https://mahendarmax.github.io/Believer-of-Almighty/ ✅
```

---

## 💻 Local Development

```bash
npm install
npm run dev       # starts at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
```

---

## ✨ Features

### 📖 Quran
- All **114 Surahs** with **6236 verses**
- Arabic text with English & Telugu translations
- Verse-by-verse audio playback with **21 reciters** (default: Mishari Rashid Al-Afasy)
- Surah-level full audio streaming
- Bookmarks & continue reading
- Adjustable Arabic font size
- Transliteration display (English / Telugu / Both)

### 🕌 Namaz Surahs
- **9 commonly recited Surahs** for Salah
- Full Arabic text with word-by-word Telugu meaning

### 🤲 Duas
- **31 Prophet's Duas** from Quran & Hadith
- Categories: Daily, Forgiveness, Protection, Family, Prayer, Evil Eye, Dhikr
- Arabic with Telugu translation

### ✅ Dos & Don'ts in Islam
- **96 items** across 4 categories
- Halal · Haram · Makruh · Sunnah

### ⭐ 99 Names of Allah (Asma ul Husna)
- All 99 names with Arabic, transliteration, English meaning & Telugu

### 📿 Tasbih Counter
- Digital dhikr counter with 5 presets
- SubhanAllah · Alhamdulillah · Allahu Akbar · La ilaha illallah · Astaghfirullah
- Session tracking

### 🌅 Adhkar
- **14 daily Adhkar** — 7 Morning & 7 Evening
- Arabic with transliteration and reference

### ➡️☪️ Prophet Isa (Jesus) — AS
- **60 verses** from Bible & Quran across 7 categories
- Telugu translations included

### 📜 Seerah — Prophet Muhammad ﷺ
- **16 chapters** covering **48 key events**
- Complete life from birth to passing
- Arabic, English & Telugu text for each event

### ❤️ Favorites
- Save any Quran verse to favorites
- Quick access from home screen

---

## 🛠️ Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router v6 (HashRouter) |
| Styling | Plain CSS with CSS variables |
| Audio | Quran CDN (cdn.islamic.network) |
| Offline | Service Worker (cache-first for audio) |
| Deployment | GitHub Pages via GitHub Actions |

