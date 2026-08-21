# Brandbook intake checklist

> The branding-info contract: what to extract from a brandbook / design system / existing
> app before touching theme code, where each value lands, and what happens when it is
> absent. Token targets verified against `packages/survey-core/src/default-theme/base-theme.ts`;
> recipes in [design-tokens.md](design-tokens.md).

## 1. Environment

- [ ] Framework: React / Angular / Vue3 / vanilla (survey-js-ui)
- [ ] Design system in use: Bootstrap / MUI / shadcn / Ant / Tailwind / custom
  - Bootstrap, MUI, shadcn → **theme adapter** (see [theming.md](theming.md#theme-adapters)), stop here for colors/fonts
- [ ] Where the survey renders: full page / modal / inside an existing card (→ `Panelless` variant)
- [ ] Light only / dark only / both (runtime switching)

## 2. Branding-info contract

**Minimal required input: one brand color.** Everything else has a sensible default.
Hover/pressed shades, 10% tints, and the focus color all derive from `brand-600`
automatically (relative color syntax — see [design-tokens.md](design-tokens.md#brand--accent-color--one-token-is-enough)).

| Brandbook item | Ask for | Maps to (verified tokens) | Default when absent |
| :-- | :-- | :-- | :-- |
| **Primary/brand color** (required) | one hex | `--sjs2-color-project-brand-600` | teal `#19B394` |
| Text-on-brand | only if brand is light | `--sjs2-color-fg-brand-on-primary` | white `#fff` |
| Explicit hover shade | only if hsl-derived is off-brand | `--sjs2-color-project-brand-700` | `hsl(from brand-600 h s calc(l*0.85))` |
| Page background | page bg hex | `--sjs2-color-utility-body` | `#fff` |
| Survey surface tint | optional | `--sjs2-color-utility-surface-survey` | `#EDF9F7` |
| Card background | question card bg | `--sjs2-color-bg-basic-primary` | `#fff` |
| Input fill | filled-control bg | `--sjs2-color-bg-basic-secondary` | `#F5F5F5` |
| Text colors | primary fg (secondary/disabled derive via opacity) | `--sjs2-color-fg-basic-primary` | gray-900 `#1C1B20` |
| Font family (text) | family + who loads it (host → use `survey-core.fontless.css`) | `--sjs2-typography-font-family-text` (all component families inherit) | "Open Sans" (bundled) |
| Font family (code) | optional | `--sjs2-typography-font-family-code` | "DM Mono" |
| Corner radius | one value, or per inputs/popups/cards | `--sjs2-radius-form` (inputs+buttons), `--sjs2-radius-component-drop` (popups), `--sjs2-radius-component-panel-simple` (cards); global: `--sjs2-base-unit-radius` | 8px scale |
| Density | compact / regular / spacious | `--sjs2-base-unit-spacing` (mild scale) or targeted layout tokens | 8px |
| Error color | hex | `--sjs2-palette-red-600` (tints derive) | `#E50A3E` |
| Success / warning / info | hex each | `--sjs2-palette-green-600` / `-yellow-600` / `-blue-600` | `#19B394` / `#FF9814` / `#437FD9` |
| Focus ring | only if brand specifies | `--sjs2-color-utility-a11y` | rgba(blue-400/60%) |
| Shadows / elevation | keep / soften / remove | pick base family instead (Soft / Flat / Borderless — [predefined-themes.md](predefined-themes.md)) + `--sjs2-border-effect-floating-default` for popups | Default family shadows |
| Light/dark | light / dark / both | `colorPalette` + base theme (`DefaultLight` / `DefaultDark`) | light |
| Embedded in host card? | yes/no | `isPanelless: true` or pick a `*Panelless` base | false |

## 3. Per-control specs

If the brandbook specifies individual controls (inputs, selects, sliders…), map each spec
to question types via [question-controls-map.md](question-controls-map.md).

## 4. Output: the theme object

Worked example. Input brandbook: *"Blue #085DE5 primary, near-white #FAFAFA page, Inter
font (self-hosted), 4px corners, red #D32F2F errors, light mode, survey rendered full-page."*

```js
import { Model } from "survey-core";
import { DefaultLight } from "survey-core/themes";
import "survey-core/survey-core.fontless.css";   // host loads Inter itself

const brandTheme = {
  themeName: "acme",
  colorPalette: "light",
  isPanelless: false,
  cssVariables: {
    "--sjs2-color-project-brand-600": "#085DE5",       // hover/tints/fg derive
    "--sjs2-color-utility-body": "#FAFAFA",
    "--sjs2-color-utility-surface-survey": "#FAFAFA",  // kill the default teal tint
    "--sjs2-typography-font-family-text": "Inter, sans-serif",
    "--sjs2-radius-form": "4px",                       // inputs + buttons
    "--sjs2-radius-component-drop": "4px",             // popups
    "--sjs2-palette-red-600": "#D32F2F"                // error bg/tint/erbox derive
  }
};

const survey = new Model(surveyJson);
survey.applyTheme(brandTheme, DefaultLight);   // layer brand over the base theme
```

Dark or dual mode: keep one `brandTheme` and switch the base —
`applyTheme({ ...brandTheme, colorPalette: "dark" }, DefaultDark)` (see
[design-tokens.md](design-tokens.md#dark-mode)).

**When to use the Theme Editor instead**: full visual rebrand with a designer in the loop,
or when the brandbook is an image/PDF without extractable values — Survey Creator's Theme
Editor exports the same theme-object format. Hand-written tokens are better for
version-controlled, minimal, reviewable diffs.

## 5. Verification checklist

- [ ] Render one of each question type used by the app (see controls map)
- [ ] Hover / focus / error / disabled / read-only states
- [ ] Light and dark (if both)
- [ ] Mobile width (density tokens differ on mobile)
- [ ] Popups (dropdown list, modals) — they render in overlays, verify tokens reach them
