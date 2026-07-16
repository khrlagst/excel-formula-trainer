# Excel Formula Trainer

An interactive, beginner-friendly web app for learning Microsoft Excel formulas.
No build step, no dependencies, no backend — plain HTML, CSS, and JavaScript.

## Features

- **6 levels** with progressive difficulty:
  1. Basics — `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA`
  2. Logic — `IF`, comparison operators, `IFERROR`
  3. Text — `LEFT`, `RIGHT`, `MID`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `PROPER`, `SUBSTITUTE`, `CONCAT`
  4. Numbers — `ROUND`, `ROUNDUP`, `ROUNDDOWN`, `ABS`, `INT`, `MOD`, `POWER`, `SQRT`
  5. Lookups — `VLOOKUP`, `HLOOKUP`, `INDEX`, `MATCH`, `INDEX-MATCH`
  6. Stats & Criteria — `COUNTIF`, `COUNTIFS`, `SUMIF`, `AVERAGEIF`, `MEDIAN`
- **Learn** reference, **Practice** (type a formula into a grid), and **Quiz** modes.
- Built-in formula engine that evaluates the formulas you write.
- **Progress** saved to `localStorage` (XP, level unlocks, best quiz scores).
- **Dark mode** and **4 languages**: English, Spanish, Indonesian, French.
- Mobile-friendly and installable as a **PWA** (add to home screen).

## Run locally

Just open `index.html` in a browser — no server required.

## Deploy

Static hosting only. For GitHub Pages, enable **Settings → Pages → Source: Deploy
from a branch → `main` → `/(root)`**. The `.nojekyll` file disables the Jekyll
build so the files are served as-is.

## Project structure

```
index.html          App shell, loads the scripts
style.css           Design tokens, dark mode, responsive layout
app.js              Formula engine, UI, i18n, theme, progress
data.js             Levels, formulas, practice, and quiz content (localized)
locales.js          UI strings and level metadata (en/es/id/fr)
manifest.webmanifest, icon.svg   PWA assets
```
