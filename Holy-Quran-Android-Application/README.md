# Holy-Quran (Arabic, Roman-English & Telugu)

An Android application for reading the Holy Quran with Arabic text, Roman-English transliteration, and Telugu translation. Built with React, Vite, and Capacitor.

- **App ID:** `com.believer.almighty`
- **Version:** 2.0.0

---

## Publishing to Google Play Store

### Prerequisites

1. **Google Play Developer Account** — Register at [play.google.com/console](https://play.google.com/console) (one-time $25 fee)
2. **A signed release APK or AAB** (Android App Bundle — preferred by Google)
3. **App assets** (screenshots, descriptions, icon) ready for the store listing

---

### Step 1: Generate a Signing Key

You need a keystore to sign your release build. Run this **once** and keep the keystore file safe:

```bash
keytool -genkey -v -keystore holy-quran-release.keystore -alias holy-quran -keyalg RSA -keysize 2048 -validity 10000
```

You will be prompted for:
- Keystore password (remember this!)
- Your name, organization, city, country
- Key password

> **IMPORTANT:** Never lose this keystore or passwords. You cannot update your app on Play Store without the same signing key.

---

### Step 2: Build a Signed Release APK/AAB

#### Option A: Using Android Studio (Recommended)

1. Open the Android project:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```
2. In Android Studio: **Build → Generate Signed Bundle / APK**
3. Select **Android App Bundle (AAB)** (Google Play prefers this)
4. Choose your keystore file, enter passwords
5. Select **release** build variant
6. Click **Create** — the signed AAB will be in `android/app/release/`

#### Option B: Using Command Line

1. Place your keystore in `android/app/`:
   ```bash
   cp holy-quran-release.keystore android/app/
   ```

2. Create `android/key.properties`:
   ```properties
   storeFile=holy-quran-release.keystore
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyAlias=holy-quran
   keyPassword=YOUR_KEY_PASSWORD
   ```

3. Edit `android/app/build.gradle` — add signing config before `buildTypes`:
   ```groovy
   def keystorePropertiesFile = rootProject.file("key.properties")
   def keystoreProperties = new Properties()
   keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

   android {
       signingConfigs {
           release {
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

4. Build the release AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

### Step 3: Prepare Store Listing Assets

You will need the following before submitting:

| Asset | Requirement |
|---|---|
| **App Icon** | 512 x 512 px (PNG, 32-bit, no alpha) |
| **Feature Graphic** | 1024 x 500 px |
| **Phone Screenshots** | Minimum 2, recommended 4-8 (16:9 or 9:16) |
| **Tablet Screenshots** | Recommended (7-inch and 10-inch) |
| **Short Description** | Max 80 characters |
| **Full Description** | Max 4000 characters |
| **Privacy Policy URL** | Required for all apps |

#### Suggested Short Description
```
Holy Quran with Arabic, Roman-English transliteration & Telugu translation
```

#### Suggested Full Description
```
Read the Holy Quran with Arabic text, Roman-English transliteration, and Telugu 
translation — all in one app.

Features:
• Complete Quran with all 114 Surahs
• Arabic text with proper diacritics
• Roman-English transliteration for easy reading
• Telugu translation
• Namaz Surahs and Duas collection
• 99 Names of Allah (Asma Ul Husna)
• Morning & Evening Adhkar
• Tasbih Counter
• Prophet Muhammad ﷺ biography (Sirat-un-Nabi)
• Prophet Isa (Jesus) in Islam
• Islamic Do's and Don'ts
• Favorites for bookmarking
• Dark theme optimized for comfortable reading
• Works offline — no internet required
```

---

### Step 4: Create App on Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** Holy-Quran(Arabic,Roman-English & Telugu)
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept the declarations and click **Create app**

---

### Step 5: Complete Store Listing

1. Go to **Main store listing** (left sidebar)
2. Fill in:
   - Short description
   - Full description
   - Upload app icon (512x512)
   - Upload feature graphic (1024x500)
   - Upload phone screenshots (minimum 2)
3. Click **Save**

---

### Step 6: Content Rating

1. Go to **Content rating** (left sidebar → Policy)
2. Click **Start questionnaire**
3. Enter your email
4. Select **Utility** category
5. Answer all questions honestly (no violence, no user data collection, etc.)
6. Click **Save → Calculate → Apply**

---

### Step 7: App Content & Privacy

1. **Privacy policy** — Create a privacy policy page (you can use [privacypolicygenerator.info](https://www.privacypolicygenerator.info/)) and enter the URL
2. **Ads** — Select "No, my app does not contain ads"
3. **App access** — Select "All functionality is available without special access"
4. **Data safety** — Fill in what data your app collects (if none, select accordingly)
5. **Target audience** — Select appropriate age group

---

### Step 8: Upload the AAB/APK

1. Go to **Production** (left sidebar → Release)
2. Click **"Create new release"**
3. If using Google Play App Signing (recommended): opt in
4. Upload your **app-release.aab** file
5. Add release notes:
   ```
   Version 2.0.0
   - Complete Quran with Arabic, English transliteration & Telugu
   - Namaz Surahs, Duas, Adhkar
   - 99 Names of Allah
   - Tasbih Counter
   - Prophet biographies
   - Dark theme
   ```
6. Click **Save → Review release → Start rollout to Production**

---

### Step 9: Review & Publish

- Google will review your app (usually takes **a few hours to 7 days**)
- You'll get an email when approved
- Once approved, your app will be live on the Play Store

---

## App Category & Tags (Suggested)

- **Category:** Books & Reference
- **Tags:** Quran, Islam, Islamic, Prayer, Telugu, Arabic, Dua, Namaz

---

## Updating the App Later

1. Increment version in `package.json`:
   ```json
   "version": "2.1.0"
   ```
2. Build new signed AAB
3. Go to Play Console → **Production → Create new release**
4. Upload new AAB, add release notes
5. Submit for review

---

## Important Notes

- **Never commit** your keystore or `key.properties` to Git — add them to `.gitignore`
- Keep a **backup of your keystore** in a secure location
- Google Play requires **AAB format** for new apps (APK is still accepted for updates)
- App must comply with [Google Play Developer Policies](https://play.google.com/about/developer-content-policy/)
- First review may take longer; subsequent updates are usually faster
