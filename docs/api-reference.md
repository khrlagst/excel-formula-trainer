# 📚 API Reference

# Excel Formula Trainer - API Reference

This API reference documents the core modules, classes, functions, and utility methods of the **Excel Formula Trainer** application. The codebase is structured into a formula evaluation engine, state/progress management, internationalization (I18N) helpers, and a dynamic DOM rendering system.

---

## 1. Formula Evaluation Engine

The formula evaluation engine parses and evaluates Excel-like formulas against a structured grid object. It supports cell references (e.g., `A1`), ranges (e.g., `A1:B3`), arithmetic/comparison operators, and a wide array of built-in Excel functions.

### `evaluateFormula(formula, grid)`

Parses and evaluates an Excel formula string against a provided grid dataset.

- **Parameters:**
  - `formula` (`string`): The formula string to evaluate (with or without a leading `=` character).
  - `grid` (`Object`): A key-value map representing the spreadsheet cells, where keys are cell references (e.g., `"A1"`) and values are numbers or strings.
- **Returns:** `any` — The evaluated result of the formula (can be a `number`, `string`, `boolean`, or range object).
- **Throws:** An `Error` if tokenization, parsing, or evaluation fails (e.g., `#NAME?`, `#VALUE!`, `#DIV/0!`, `#REF!`, `#N/A`).

```javascript
const grid = {
  A1: 10,
  A2: 20,
  B1: "Hello\

---

## 📁 Source Modules

| Module | Classes | Functions |
|--------|:-------:|:---------:|
| `app.js` | 1 | 80 |
| `data.js` | 0 | 0 |
| `locales.js` | 0 | 0 |
| `index.html` | 0 | 0 |
| `style.css` | 0 | 0 |

---

### `app.js`


**Classes:**

| Class | Description |
|-------|-------------|
| `Parser` | /* ---------- Parser (recursive descent) ---------- * |

**Functions:**

| Function | Signature | Description |
|----------|-----------|-------------|
| `letterToCol` | `(letters)` | ============================================================ * |
| `colLetter` | `(c)` | — |
| `parseCell` | `(ref)` | — |
| `getCell` | `(grid, ref)` | — |
| `rangeData` | `(grid, startRef, endRef)` | — |
| `tokenize` | `(src)` | /* ---------- Tokenizer ---------- * |
| `asNumber` | `(v)` | /* ---------- Evaluation ---------- * |
| `isTruthy` | `(v)` | — |
| `flattenNumbers` | `(args)` | — |
| `flattenAll` | `(args)` | — |
| `valuesEqual` | `(a, b)` | — |
| `valuesLessEq` | `(a, b)` | — |
| `compareCriteria` | `(cellVal, criteria)` | — |
| `isEmpty` | `(v)` | — |
| `evalNode` | `(node, grid)` | — |
| `evaluateFormula` | `(formula, grid)` | — |
| `formatValue` | `(v)` | — |
| `matchesExpected` | `(expected, actual)` | — |
| `todayKey` | `()` | — |
| `defaultState` | `()` | — |
| `loadState` | `()` | — |
| `saveState` | `()` | — |
| `touchStreak` | `()` | /* ---------- Streak ---------- * |
| `awardBadge` | `(id)` | — |
| `checkStaticBadges` | `()` | — |
| `playSound` | `(type)` | — |
| `el` | `(tag, props, children)` | ============================================================ * |
| `clear` | `(node)` | — |
| `detectLang` | `()` | ============================================================ * |
| `t` | `(key, vars)` | — |
| `lvlName` | `(lvl)` | — |
| `lvlTagline` | `(lvl)` | — |
| `L` | `(obj)` | — |
| `renderLangSelect` | `()` | — |
| `levelById` | `(id)` | — |
| `render` | `()` | — |
| `renderTopBar` | `()` | — |
| `renderLevelPicker` | `()` | — |
| `renderTabs` | `()` | — |
| `renderBottomNav` | `()` | — |
| `renderBadges` | `()` | — |
| `renderDailyStrip` | `()` | — |
| `startDailyChallenge` | `()` | — |
| `runDailyQuiz` | `(picks)` | — |
| `renderQ` | `()` | — |
| `markCorrect` | `()` | — |
| `finishDaily` | `()` | — |
| `openCheatSheet` | `()` | — |
| `showBadgeToast` | `(id)` | — |
| `renderLearn` | `()` | /* ---------- Learn ---------- * |
| `renderLearnInto` | `(list, lvl)` | — |
| `conceptById` | `(id)` | /* ---------- Learn More (walkthroughs) ---------- * |
| `renderLearnMore` | `()` | — |
| `renderShortcuts` | `(concept)` | — |
| `renderWalkthrough` | `(concept)` | — |
| `renderPivot` | `(concept)` | — |
| `renderChart` | `(concept)` | — |
| `markActive` | `(box, k)` | — |
| `drawChart` | `()` | — |
| `buildChart` | `(kind, cats, series, title)` | — |
| `renderPowerQuery` | `(concept)` | — |
| `renderPractice` | `()` | /* ---------- Practice ---------- * |
| `renderScenario` | `(stage, lvl, scenario)` | — |
| `renderQuiz` | `()` | /* ---------- Quiz ---------- * |
| `renderQuestion` | `()` | — |
| `choose` | `(oi, btn, opts)` | — |
| `next` | `()` | — |
| `finish` | `()` | — |
| `gridBounds` | `(grid)` | /* ---------- Shared grid renderer ---------- * |
| `buildGridTable` | `(grid, bounds, targetCell)` | — |
| `showFeedback` | `(node, msg, kind)` | /* ---------- Feedback + celebration ---------- * |
| `renderTopBarInto` | `()` | — |
| `showCelebration` | `(lvl)` | — |
| `applyTheme` | `()` | — |
| `toggleTheme` | `()` | — |
| `isDigit` | `(c)` | — |
| `isAlpha` | `(c)` | — |
| `submitFn` | `()` | — |
| `add` | `(tag, attrs, text)` | — |
| `doCheck` | `()` | — |

---

### `data.js`




---

### `locales.js`




---

### `index.html`

> Title: Excel Formula Trainer | An interactive, beginner-friendly app to learn Microsoft Excel formulas by doing.



---

### `style.css`





---