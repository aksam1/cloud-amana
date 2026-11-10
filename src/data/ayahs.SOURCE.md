# Where ayahs.json comes from

Each entry is one ayah: `ar` is the Uthmani text of the Tanzil Project (tanzil.net) exactly as the alquran.cloud
API serves it (edition `quran-uthmani`, with pause marks; the basmala the API puts before ayah 1 is removed), and
`en` is Sahih International (edition `en.sahih`).

- 76 ayat were fetched directly from api.alquran.cloud by `npm run ayahs`.
- 297 ayat were added on 10 November 2026 while that host was blocked from the workspace. They were taken from
  public mirrors on GitHub and accepted only because every check below passed:
  - Arabic: `azabcodes/quran_api` (`Quran/s<N>.json`, saved alquran.cloud responses, edition `quran-uthmani`)
    and `semarketir/quranjson` (`source/surah/surah_<N>.json`). Both match all 76 ayat already on file character
    for character, and they match each other on every one of the 294 ayat taken from them. Surah 36 is missing from
    the first mirror, so 36:20, 36:78 and 36:79 come from the second and were confirmed in a third
    (`TariqMK/Obsidian-Quran-Journal`).
  - English: Tanzil's `en.sahih.xml` (in `myquranapp/quran-data`) and `azabcodes/quran_api`
    (`quran-translated/en.sahih`). Both match all 76 ayat on file exactly, and they match each other on all 6,236.
- When api.alquran.cloud can be reached, re-check: delete an entry, run `npm run ayahs`, and compare.

33 verse moments show part of an ayah. Their word ranges (`ar`) and matching English were chosen by hand on the same
day (each scene's beat has them); they are on the scholar's review sheet.
