# ﷽ Believer of Almighty — Holy Quran App

**Read, Listen & Understand the words of Allah**

A complete Islamic web application built with React + Vite, featuring the Holy Quran with Arabic, English, and Telugu translations, verse-by-verse audio, and a rich set of Islamic tools.

🌐 **Live:** [https://mahendarmax.github.io/Believer-of-Almighty/](https://mahendarmax.github.io/Believer-of-Almighty/)

---

## ✨ Features

### 📖 Quran
- All **114 Surahs** with **6236 verses**
- Arabic text with English & Telugu translations
- Verse-by-verse audio playback with **21 reciters** (default: Nasser Al-Qatami)
- Surah-level full audio streaming
- Bookmarks & continue reading
- Adjustable Arabic font size
- Transliteration display (English/Telugu/Both)

### 🕌 Namaz Surahs
- **9 commonly recited Surahs** for Salah (Al-Fatiha, Al-Ikhlas, Al-Falaq, An-Nas, Al-Kafirun, Al-Kawthar, Al-Asr, An-Nasr, Ad-Duha)
- Full Arabic text with word-by-word Telugu meaning

### 🤲 Duas
- **31 Prophet's Duas** from Quran & Hadith
- Categories: Daily, Forgiveness, Protection, Family, Prayer, Evil Eye, Dhikr
- Arabic with Telugu translation

### ✅ Dos & Don'ts in Islam
- **96 items** across 4 categories
- Halal (29) · Haram (29) · Makruh (14) · Sunnah (24)

### ⭐ 99 Names of Allah (Asma ul Husna)
- All 99 names with Arabic, transliteration, English meaning & Telugu

### 📿 Tasbih Counter
- Digital dhikr counter with 5 presets
- SubhanAllah (33) · Alhamdulillah (33) · Allahu Akbar (34) · La ilaha illallah (100) · Astaghfirullah (100)
- Haptic feedback & session tracking

### 🌅 Adhkar
- **14 daily Adhkar** — 7 Morning & 7 Evening
- Arabic with transliteration and reference

### ➡️☪️ Prophet Isa (Jesus) — AS
- **60 verses** from Bible & Quran across 7 categories
- Proving Isa (AS) is a Prophet of Allah, not God
- Telugu translations included

### 📜 Seerah — Prophet Muhammad ﷺ
- **16 chapters** covering **48 key events**
- Complete life from birth to passing
- Arabic, English & Telugu text for each event

### ❤️ Favorites
- Save any Quran verse to favorites
- Quick access from home screen

### ⚙️ Settings
- Arabic text display toggle
- Font size control (12–28px)
- Transliteration mode (English/Telugu/Both)
- Reciter selection (21 reciters)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router DOM v6 |
| Styling | CSS (no framework — custom dark theme) |
| Audio | HTML5 Audio API |
| APIs | alquran.cloud, everyayah.com, cdn.islamic.network |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/Mahendarmax/Believer-of-Almighty.git
cd Believer-of-Almighty

# Install
npm install

# Dev server (localhost:3000)
npm run dev

# Production build
npm run build
```

---

## 📱 Android APK

A separate Android-ready copy is available in the `Believer-of-Almighty-Android` folder, using Capacitor to wrap the exact same web app as a native APK.

```bash
cd Believer-of-Almighty-Android
npm install
npm run build
npx cap add android
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build from terminal
cd android && ./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📂 Project Structure

```
src/
├── App.jsx                  # Root component with routing
├── main.jsx                 # Entry point
├── components/
│   ├── AudioPlayer.jsx      # Verse & Surah audio player
│   ├── SearchBar.jsx        # Global search
│   └── ErrorBoundary.jsx    # Error handling
├── context/
│   └── SettingsContext.jsx   # App-wide settings (reciter, font, etc.)
├── data/
│   ├── quranData.js          # 114 Surahs + 21 reciters
│   ├── namazAndDuas.js       # Namaz surahs + Dos & Don'ts
│   ├── asmaUlHusna.js        # 99 Names of Allah
│   ├── adhkar.js             # Morning & Evening Adhkar
│   ├── prophetIsa.js         # 60 Bible & Quran verses
│   └── prophetMuhammad.js    # 16-chapter Seerah
├── pages/
│   ├── Home.jsx              # Landing page with stats & navigation
│   ├── SurahList.jsx         # All 114 Surahs browser
│   ├── VerseView.jsx         # Verse-by-verse reading + audio
│   ├── NamazSurahs.jsx       # Namaz Surahs viewer
│   ├── Duas.jsx              # 31 Duas with categories
│   ├── DosAndDonts.jsx       # Halal/Haram/Makruh/Sunnah
│   ├── AsmaUlHusna.jsx       # 99 Names of Allah
│   ├── TasbihCounter.jsx     # Digital Tasbih
│   ├── Adhkar.jsx            # Daily Adhkar
│   ├── ProphetIsa.jsx        # Isa (AS) proofs
│   ├── ProphetMuhammad.jsx   # Complete Seerah
│   ├── Favorites.jsx         # Saved verses
│   └── Settings.jsx          # App settings
└── utils/
    └── teluguTransliteration.js  # Telugu script helper
```

---

## 🎨 Theme

Dark theme with Islamic gold accent:
- Background: `#06090f`
- Cards: `#111827`
- Primary gold: `#d4a44a`
- Text: `#94a3b8`

---

## 📡 APIs Used

| API | Purpose |
|-----|---------|
| `api.alquran.cloud` | Quran Arabic text & English translation |
| `everyayah.com` | Verse-by-verse audio (21 reciters) |
| `cdn.islamic.network` | Full Surah audio streaming |

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/my-feature`)
5. Open a Pull Request

---

**بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ**

Made with ❤️ for the Ummah
