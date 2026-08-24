# Predefined themes — applying a default SurveyJS style

How to apply one of the 32 built-in themes. All facts below verified against
`packages/survey-core` sources (`src/themes/`, `rollup.config.mjs`, `rollup.themes.config.mjs`).

## 1. Prerequisite: base stylesheet

The theme objects only override CSS variables — the base stylesheet must always be loaded first:

```js
import "survey-core/survey-core.css";
```

Emitted artifacts (rollup `createCssConfig`): `survey-core.css`, `survey-core.min.css`,
`survey-core.fontless.css` (+ `.min`) — fontless skips the bundled font-face, use it when the
host app loads its own fonts. Package export map: `"./*.css": "./*.css"`.
Legacy names `defaultV2.css` / `modern.css` are **not emitted** anymore — replace with
`survey-core.css` when migrating.

## 2. Import and apply

```js
import { Model } from "survey-core";
import { ContrastDark } from "survey-core/themes";

const survey = new Model(surveyJson);
survey.applyTheme(ContrastDark);
```

Verified entry points:

| Style | Path | Notes |
| :-- | :-- | :-- |
| Named ESM | `survey-core/themes` | all 32 named exports (`fesm/themes/index.mjs`) |
| Deep import | `survey-core/themes/default-dark` | default export per theme, kebab-case file names — best for tree-shaking |
| CDN / script tag | `https://unpkg.com/survey-core/themes/index.min.js` | global `SurveyTheme` with named exports: `survey.applyTheme(SurveyTheme.ContrastDark)` |
| CDN per theme | `.../themes/default-dark.min.js` | global `SurveyTheme.DefaultDark` |

Signature (typings): `applyTheme(theme: ITheme, baseTheme?: ITheme)` — the optional second
argument layers `theme` on top of a base (used for custom themes, not needed for predefined ones).
`applyTheme` can be called at any time, including on a rendered survey (runtime switching).

## 3. Choosing a family

Export names: `<Family><Light|Dark>[Panelless]`, e.g. `SoftDarkPanelless`. Family visual
signatures, derived from the theme objects' `cssVariables` diffs (`src/themes/*-light.ts`):

| Family | Brand default | Visual signature (what the cssVariables change) |
| :-- | :-- | :-- |
| `Default` | teal `#19B394` | Baseline: empty `cssVariables` — filled gray inputs, crisp 1px inset borders, white question cards |
| `Soft` | orange `#FF9814` | Crisp borders replaced by soft blurred shadows (2px blur, 1px y-offset, 0 spread); colored error text; gentlest look |
| `Contrast` | deep purple `#3A179E` | Heavier borders (gray-300), secondary text at 75% opacity (vs 60%), pronounced popup shadow — accessibility-oriented, high contrast |
| `Borderless` | azure blue | Input/card border spread forced to 0 → fields with no borders on blue-tinted backgrounds |
| `Flat` | green | Gray page + white fields (bg pair inverted), hairline `rgba(0,0,0,.12)` borders, outline-style shadows — flat design, no elevation |
| `Plain` | medium blue | All-white surfaces, 15%-black hairline borders, minimal tinting — the plainest look |
| `ThreeDimensional` | raspberry | Hard 2px solid-gray offset shadows (`0 2px 0 2px`) → raised, retro-3D edges |
| `Monochrome` | near-black `#1C1B20` | Brand color = gray-900, gray-500 borders — full grayscale |

Brand-matching heuristic: pick the family whose *shape language* (borders/shadows/contrast)
matches the host app, then recolor via tokens (case 2) — the family brand color is just
`--sjs2-color-project-brand-600` and is trivially overridable.

## 4. Dark and Panelless variants

- `*Dark` (`colorPalette: "dark"`): remaps backgrounds to gray-850/900, survey surface
  `#161519`, dims a11y ring, derives brand-700 via `lch()`. Pick when host is dark or via
  `prefers-color-scheme`:

```js
const themes = { light: DefaultLight, dark: DefaultDark };
const mq = matchMedia("(prefers-color-scheme: dark)");
survey.applyTheme(mq.matches ? themes.dark : themes.light);
mq.addEventListener("change", (e) => survey.applyTheme(e.matches ? themes.dark : themes.light));
```

- `*Panelless` (`isPanelless: true`): sets `--sjs2-is-panelless: true`, makes the question
  card (`panel-simple`) background/border transparent, radius 0, zero content padding.
  Pick when the survey is embedded inside an existing host card/panel/modal.

## 5. Framework notes

The CSS import and `applyTheme` call are identical across React / Angular / Vue3 / vanilla —
theming lives entirely in `survey-core`. Only where the import goes differs:

- **React / Vue3 / js-ui**: `import "survey-core/survey-core.css";` next to the component import.
- **Angular**: add to component/global styles or `angular.json` → `"styles": ["node_modules/survey-core/survey-core.css"]`.
- **Vanilla / CDN**: `<link href="https://unpkg.com/survey-core/survey-core.min.css" rel="stylesheet">` + the `SurveyTheme` script above.

## 6. Pitfalls

- `StylesManager.applyTheme("defaultV2")` — removed API; themes are objects now.
- Do not `applyTheme` a predefined theme when a **theme adapter** stylesheet is in use — it
  overrides the adapter's token mapping (see [theming.md](theming.md#theme-adapters)).
- Theme object ≠ stylesheet: the CSS file is always required; the theme object only sets variables.
- Tokens are injected under `:where(.sd-theme-root)` at runtime — relevant when combining
  with stylesheet overrides (see [custom-css.md](custom-css.md)).

## Intake questions (ask before choosing)

1. Host light, dark, or both (runtime switch)?
2. Is the survey embedded inside an existing card/panel/modal? → Panelless.
3. Which shape language matches the host: crisp borders (Default/Plain/Flat), soft shadows
   (Soft), no borders (Borderless), high contrast (Contrast/Monochrome), raised 3D (ThreeDimensional)?
4. Will the brand color be overridden afterwards? (If yes, family choice is about shape, not color.)
