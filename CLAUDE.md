# Claude Code Instructions

For Quran data updates in this repository:

- Use `public/quran-support/*.json` as the primary editable source for Roman English, English meaning, and Telugu meaning content.
- If a wording issue is reported, correct the relevant local JSON file first.
- Do not prefer changing upstream API assumptions when the local support files can solve the problem.
- Keep the local-first runtime behavior in place.
- Preserve the Roman fallback correction logic in `src/data/quranData.js`.
- Be careful when regenerating support files; review manual corrections so they are not lost.
