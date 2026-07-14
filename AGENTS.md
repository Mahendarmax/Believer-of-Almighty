# Agent Instructions

When fixing or updating Quran verse wording in this project:

- Treat `public/quran-support/*.json` as the source of truth for local Roman English, English meaning, and Telugu meaning data.
- If a wording mistake is found in Roman English, English meaning, or Telugu meaning, edit the matching file in `public/quran-support/` first.
- Do not change remote API text assumptions when the issue can be fixed in local support files.
- Keep the local-first data flow intact: the app should prefer local `public/quran-support/*.json` data and only fall back to APIs when local data is unavailable.
- Preserve the existing correction pipeline in `src/data/quranData.js` for Roman transliteration fallback handling.
- When regenerating support files, avoid overwriting intentional manual corrections without reviewing them.
