# 📚 API Reference

# Excel Formula Trainer - API & Data Reference

This document provides a comprehensive technical reference for the data structures, configuration constants, localization dictionaries, and design tokens used in the Excel Formula Trainer application.

---

## 1. Global Configuration Constants (`data.js`)

These constants define the core gamification mechanics and thresholds of the application.

### `PASS_THRESHOLD`
* **Type:** `Number` (Float)
* **Value:** `0.8`
* **Description:** The minimum percentage score (80%) required by a user to pass a level's quiz and unlock the subsequent level.

### `XP_PER_QUIZ`
* **Type:** `Number` (Integer)
* **Value:** `50`
* **Description:** The amount of Experience Points (XP) awarded to a user upon successful completion of a quiz.

### `XP_PER_PRACTICE`
* **Type:** `Number` (Integer)
* **Value:** `10`
* **Description:** The amount of Experience Points (XP) awarded to a user upon completing a practice scenario.

---

## 2. Walkthrough Catalog Schema (`data.js` -> `CONCEPTS`)

The `CONCEPTS` array contains self-contained, explanatory topics for the "Learn More" section. Each element in the array represents a specific topic and adheres to one of several structural schemas based on its `type`.

### Common Concept Properties
Every concept object contains the following base properties:
* `id` (`String`): Unique identifier for the concept (e.g., `"shortcuts"`, `"tables"`).
* `icon` (`String`): Emoji representation of the concept.
* `type` (`String`): The structural type of the concept. Must be one of: `"shortcuts"`, `"walkthrough"`, `"pivot"`, `"chart"`, `"powerquery"`.
* `title` (`String`): English title of the concept.
* `intro` (`String`): English introductory text.
* `i18n` (`Object`): Localization overrides for non-English languages (see [Concept Localization Schema](#concept-localization-schema-i18n) below).

---

### Concept Type: `shortcuts`
Used for displaying keyboard shortcut cheat sheets.

#### Additional Properties:
* `groups` (`Array<ShortcutGroup>`): List of shortcut categories.

#### `ShortcutGroup` Schema:
* `name` (`String`): Name of the category (e.g., `"Navigation"`).
* `rows` (`Array<ShortcutRow>`): List of shortcuts in this category.

#### `ShortcutRow` Schema:
* `keys` (`String`): The key combination (e.g., `"Ctrl + Arrow"`).
* `desc` (`String`): Description of what the shortcut does.

#### Example:
```json
{
  "id": "shortcuts",
  "icon": "⌨️",
  "type": "shortcuts",
  "title": "Keyboard Shortcuts",
  "intro": "Move faster in Excel...",
  "groups": [
    {
      "name": "Navigation",
      "rows": [
        { "keys": "Ctrl + Arrow", "desc": "Jump to the edge of data." }
      ]
    }
  ]
}
```

---

### Concept Type: `walkthrough`
Used for step-by-step guides with an interactive formula demonstration.

#### Additional Properties:
* `steps` (`Array<WalkthroughStep>`): Ordered steps explaining the concept.
* `demo` (`DemoGrid`): Configuration for the interactive grid demonstration.

#### `WalkthroughStep` Schema:
* `title` (`String`): Title of the step.
* `body` (`String`): Explanatory text for the step.

#### `DemoGrid` Schema:
* `grid` (`Object`): Key-value pairs representing cell coordinates and their values (e.g., `{"A1": "Item", "B1": "Price"}`).
* `targetCell` (`String`): The coordinate of the cell containing the demonstration formula (e.g., `"D1"`).
* `formula` (`String`): The Excel formula demonstrated in the target cell.
* `note` (`String`): Explanatory note about the formula execution.

---

### Concept Type: `pivot`
Used for explaining PivotTables with a cross-tabulation data demonstration.

#### Additional Properties:
* `steps` (`Array<WalkthroughStep>`): Ordered steps explaining PivotTables.
* `pivotDemo` (`PivotDemo`): Configuration for the PivotTable visualization.

#### `PivotDemo` Schema:
* `source` (`Object`): Key-value pairs of the source data grid.
* `rowsField` (`String`): The column name used for PivotTable rows.
* `colsField` (`String`): The column name used for PivotTable columns.
* `valuesField` (`String`): The column name used for PivotTable values.
* `agg` (`String`): Aggregation method (e.g., `"SUM"`).
* `note` (`String`): Explanatory note for the PivotTable layout.

---

### Concept Type: `chart`
Used for explaining data visualization with an interactive chart.

#### Additional Properties:
* `steps` (`Array<WalkthroughStep>`): Ordered steps explaining chart creation.
* `chartDemo` (`ChartDemo`): Configuration for the chart visualization.

#### `ChartDemo` Schema:
* `kind` (`String`): Default chart type (e.g., `"column"`, `"line"`, `"pie"`, `"bar"`).
* `cats` (`Array<String>`): Categories/labels for the X-axis (e.g., `["Jan", "Feb"]`).
* `series` (`Array<Number>`): Data points corresponding to the categories.
* `note` (`String`): Explanatory note for the chart.

---

### Concept Type: `powerquery`
Used for explaining data transformation pipelines.

#### Additional Properties:
* `steps` (`Array<WalkthroughStep>`): Ordered steps explaining Power Query.
* `pqDemo` (`PowerQueryDemo`): Configuration showing "before" and "after" states of data.

#### `PowerQueryDemo` Schema:
* `before` (`Object`): Key-value pairs representing the source grid state.
* `after` (`Object`): Key-value pairs representing the transformed grid state.
* `note` (`String`): Explanatory note detailing the transformation steps.

---

### Concept Localization Schema (`i18n`)
Each concept contains an `i18n` object mapping language codes (`es`, `id`, `fr`) to localized overrides of the concept's text fields.

```typescript
interface ConceptI18n {
  [langCode: string]: {
    title?: string;
    intro?: string;
    groups?: Array<{
      name: string;
      rows: Array<{ keys: string; desc: string }>;
    }>;
    steps?: Array<{ title: string; body: string }>;
    demo?: { note: string };
    pivotDemo?: { note: string };
    chartDemo?: { note: string };
    pqDemo?: { note: string };
  }
}
```

---

## 3. Localization Configuration (`locales.js`)

The `locales.js` file handles internationalization (i18n) for the application's UI chrome and level metadata.

### `LANG_ORDER`
* **Type:** `Array<String>`
* **Value:** `["en", "es", "id", "fr"]`
* **Description:** Defines the supported languages and their display order in the language selection interface.

### `LANG_NAMES`
* **Type:** `Object`
* **Description:** Maps language codes to their native/localized display names.
* **Properties:**
  * `en`: `"English"`
  * `es`: `"Español"`
  * `id`: `"Bahasa Indonesia"`
  * `fr`: `"Français"`

### `I18N`
* **Type:** `Object`
* **Description:** Nested dictionary containing translation keys for each supported language.
* **Key Structure:** `I18N[langCode][translationKey]`
* **Dynamic Placeholders:** Some translation strings contain placeholders wrapped in curly braces (e.g., `{id}`, `{name}`, `{pct}`, `{got}`, `{exp}`) which are replaced dynamically at runtime.

### `LEVEL_META`
* **Type:** `Object`
* **Description:** Localized names and taglines for each of the 5 training levels.
* **Structure:**
  ```typescript
  interface LevelMeta {
    [levelId: number]: {
      [langCode: string]: {
        name: string;
        tagline: string;
      }
    }
  }
  ```
* **Levels Defined:**
  1. **Basics** (Level 1): Basic arithmetic, averages, and summaries.
  2. **Logic** (Level 2): Logical operations and conditional statements (`IF`).
  3. **Text** (Level 3): String manipulation and concatenation.
  4. **Numbers** (Level 4): Numeric rounding and formatting.
  5. **Lookups** (Level 5): Data retrieval (`VLOOKUP`, `HLOOKUP`, `INDEX-MATCH`).

---

## 4. Design Tokens & CSS Custom Properties (`style.css`)

The application's styling API is defined via CSS Custom Properties (variables) declared on the `:root` element. These variables control the theme, colors, typography, and spacing.

### Color Tokens
| Variable Name | Light Mode Value | Dark Mode Override | Description |
| :--- | :--- | :--- | :--- |
| `--brand` | `#4f46e5` | *Inherited* | Primary brand color (Indigo) |
| `--brand-2` | `#06b6d4` | *Inherited* | Secondary brand color (Cyan) |
| `--brand-grad` | `linear-gradient(135deg, #4f46e5, #06b6d4)` | *Inherited* | Gradient used for primary actions and highlights |
| `--bg` | `#f6f7fb` | `#0f1320` | Main application background |
| `--surface` | `#ffffff` | `#1a2032` | Card and container background |
| `--surface-2` | `#f1f3f9` | `#232b40` | Secondary container/input background |
| `--text` | `#1e2230` | `#e7eaf3` | Primary body text color |
| `--muted` | `#6b7280` | `#9aa3b7` | Secondary/disabled text color |
| `--border` | `#e5e7eb` | `#2c3550` | Border and divider color |
| `--success` | `#16a34a` | *Inherited* | Success state text color |
| `--success-bg` | `#dcfce7` | *Inherited* | Success state background |
| `--warn` | `#d97706` | *Inherited* | Warning state text color |
| `--warn-bg` | `#fef3c7` | *Inherited* | Warning state background |
| `--error` | `#dc2626` | *Inherited* | Error state text color |
| `--error-bg` | `#fee2e2` | *Inherited* | Error state background |

### Layout & Spacing Tokens
* `--radius`: `14px` (Standard container border-radius)
* `--radius-sm`: `10px` (Button and input border-radius)
* `--font`: `"Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif` (Primary sans-serif font stack)
* `--mono`: `"Cascadia Code", "Consolas", "SFMono-Regular", Menlo, monospace` (Monospace font stack for formulas and code blocks)
* `--shadow-sm`: `0 1px 2px rgba(16, 24, 40, 0.06)`
* `--shadow-md`: `0 8px 24px rgba(16, 24, 40, 0.10)` (Dark mode override: `0 8px 24px rgba(0, 0, 0, 0.4)`)
* `--shadow-lg`: `0 20px 50px rgba(16, 24, 40, 0.18)` (Dark mode override: `0 20px 50px rgba(0, 0, 0, 0.55)`)

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