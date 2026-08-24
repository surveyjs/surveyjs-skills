# Design tokens — catalog & override recipes

> Verified against `packages/survey-core/src/default-theme/base-theme.ts`.
> Authoritative docs: <https://surveyjs.io/documentation/design-tokens-css-customization.md>

## Layer model (recap)

Prefix `--sjs2-`. Override at the **highest layer that does the job**.

| Layer | Purpose | Example |
| :-- | :-- | :-- |
| 0 — Palette | Raw primitives | `--sjs2-palette-blue-600` |
| 1 — Base | Spacing/size/type foundations | `--sjs2-base-unit-size` |
| 2 — System | Generated scales | `--sjs2-spacing-x500` |
| 3 — Semantic | Intent-based | `--sjs2-color-bg-brand-primary` |
| 4 — Component | Per-component, per-state | `--sjs2-color-component-action-brand-primary-default-bg` |

## Recipes by brand requirement

All token names below exist verbatim in `base-theme.ts`.

### Brand / accent color — ONE token is enough

The ramp auto-derives from brand-600 via relative color syntax:
`brand-400 = hsl(from brand-600 h s calc(l * 1.2))`, `brand-700 = … * 0.85`, `brand-800 = … * 0.75`.
Downstream: `--sjs2-color-bg-brand-primary` → brand-600, `--sjs2-color-bg-brand-secondary` →
rgba(brand-600/10%), `--sjs2-color-fg-brand-primary` → brand-700.

```js
"--sjs2-color-project-brand-600": "#085DE5"          // hover/dim/tint shades derive automatically
// only if the brand color is LIGHT (text on it must be dark):
"--sjs2-color-fg-brand-on-primary": "#1C1B20"        // default: gray-000 (#fff)
// pin explicit hover shade only when the hsl-derived one is off-brand:
"--sjs2-color-project-brand-700": "<explicit hover/pressed shade>"
```

### Backgrounds & surfaces

| Surface | Token | Default |
| :-- | :-- | :-- |
| Page behind the survey | `--sjs2-color-utility-body` | gray-000 `#fff` |
| Survey surface tint | `--sjs2-color-utility-surface-survey` | `#EDF9F7` (brand-tinted) |
| Question cards | `--sjs2-color-bg-basic-primary` | gray-000 `#fff` |
| Inputs / filled controls | `--sjs2-color-bg-basic-secondary` | gray-100 `#F5F5F5` |
| Tracks / tertiary fills | `--sjs2-color-bg-basic-tertiary` | gray-150 `#EDEDED` |
| Popups / sheets | `--sjs2-color-utility-sheet` | gray-000 `#fff` |

Borderless-fill vs bordered-transparent inputs: hosts whose inputs are transparent with a
1px border (shadcn et al.) → `--sjs2-color-bg-basic-secondary: transparent` (also clears
unchecked checkbox/radio fills) + `--sjs2-color-component-formbox-default-border: <host
input-border color>`. Buttons and slider thumbs additionally carry a 1px ring via
`--sjs2-border-effect-trigger-default`; kill it with
`--sjs2-color-utility-shadow-trigger-default: transparent`.

### Typography

All ~19 `--sjs2-typography-font-family-component-*` tokens reference
`--sjs2-typography-font-family-text` — one override restyles everything:

```js
"--sjs2-typography-font-family-text": "Inter, sans-serif"   // default: "Open Sans"
"--sjs2-typography-font-family-code": "JetBrains Mono"      // default: "DM Mono"
```

Scale: `--sjs2-typography-font-size-small/default/large` → `--sjs2-font-size-x150/x200/x350`
(12/16/28px, derived from `--sjs2-base-unit-font-size: 8px`). Weights:
`--sjs2-font-weight-regular/medium/semibold/bold` = 400/500/600/700; semantic hooks
`--sjs2-typography-font-weight-basic/strong`. Per-element sizes: the
`--sjs2-typography-font-size-component-*` families (see [controls/_shared.md](controls/_shared.md)).

Compact hosts (14px base): override `--sjs2-typography-font-size-default: 0.875rem` +
`--sjs2-typography-line-height-default: 1.25rem` — question titles, descriptions, input
text, dropdown items and button labels all derive from this pair. `font-weight-strong`
(600) feeds question/panel titles AND button labels; set it to 500 for shadcn-like hosts.
Panel titles also derive from font-size-default — pin
`--sjs2-typography-font-size-component-panel-title` separately if the host card title is
larger than body text.
Web-font loading is the host app's job — pair custom fonts with `survey-core.fontless.css`.

### Corner radius

Hierarchy: `--sjs2-base-unit-radius: 8px` → `--sjs2-radius-x*` scale → semantic → component.

| Target | Token | Default |
| :-- | :-- | :-- |
| Everything at once | `--sjs2-base-unit-radius` | 8px (scales the whole x* ladder) |
| Inputs + buttons | `--sjs2-radius-form` | x100 (8px) — feeds `-component-formbox`, `-component-action` |
| Checkboxes, chips | `--sjs2-radius-form-item` | x050 (4px) |
| Popups | `--sjs2-radius-component-drop` | x200 (16px) |
| Question cards | `--sjs2-radius-component-panel-simple` | via `-component-panel` |
| Round elements | `--sjs2-radius-round` | 9999px (radio, rating pills, ranking) — leave alone |

Square-corner brand: set `--sjs2-radius-form: 0px` and `--sjs2-radius-component-drop: 0px`
rather than zeroing `base-unit-radius` (which would also flatten pills/avatars).

### Spacing / density

All spacing derives from `--sjs2-base-unit-spacing: 8px` (→ `--sjs2-spacing-x025…x800`,
plus semantic `--sjs2-spacing-medium-*` = x300, `--sjs2-spacing-large-*` = x500).
Sibling base units: `--sjs2-base-unit-size` (element sizes), `-font-size`, `-line-height`, all 8px.

- Mild density change: scale `--sjs2-base-unit-spacing` (e.g. `7px` ≈ 12% tighter). Risk:
  paddings that must stay in sync with fixed sizes (checkbox 24px boxes, 48px touch targets)
  drift — verify controls after changing; keep `base-unit-size` untouched to preserve
  hit-target sizes.
- Exact control heights: formbox height = 1lh + 2×`--sjs2-layout-component-input-medium-content-padding-vertical`
  (8px) + 2×`--sjs2-layout-component-formbox-medium-padding-vertical` (4px) = 48px by
  default. For a 32px host control: formbox padding 0, input content padding-vertical 6px
  (with a 20px line-height). Checkbox/radio boxes: `--sjs2-size-component-checkbox-box`
  / `-radio-box` (24px → e.g. 1rem) with `-checkbox-icon` / `-radio-icon` companions.
- Navigation buttons (Complete/Next/Prev) are `sd-action--large` → size via
  `--sjs2-layout-component-action-large-box-padding-vertical/-horizontal` and
  `-large-label-padding-horizontal`. The `action-medium` layout tokens style inline icon
  actions (dropdown chevron, clear buttons) — changing those distorts inputs, not buttons.
- Targeted density: override layout tokens instead — question card padding
  (`--sjs2-layout-component-panel-simple-content-area-padding-*`), gaps between questions
  (`--sjs2-layout-component-page-content-area-gap-*`) — see [controls/_shared.md](controls/_shared.md) §4.
- Vertical rhythm map (verified): `question-header-gap-vertical` = title→description,
  `question-box-gap-vertical` = header→input, `panel-content-area-gap-vertical` =
  question→question inside a panel, `page-content-area-gap-vertical` = between top-level
  panels/questions, `labeled-group-box-gap-vertical` = radio/checkbox row spacing (applied
  as ÷2 padding per row; `-box-padding-vertical` pads the group's first/last row).
- Panel cards: `.sd-panel` consumes the **`panel-*`** layout family
  (`panel-header-padding-top/bottom/left/right`, `panel-content-area-padding-*`,
  `panel-content-area-gap-*`) — NOT `panel-simple-*`, which styles framed standalone
  questions. Framed panels also draw a header divider via
  `--sjs2-color-component-panel-default-separator` (set transparent for divider-less host cards).
- Mobile: `.sd-root-modern--mobile` swaps several semantic paddings; test both widths.

### State colors (error / success / warning / info)

Semantic bg tokens derive `-secondary` (10% tint) and `-tertiary` (0%) from `-primary`
automatically via `rgba(from …)`; foregrounds have matching `--sjs2-color-fg-alert-primary` etc.

```js
"--sjs2-palette-red-600": "<brand error>"      // default #E50A3E — feeds bg-alert-primary + erbox tint
"--sjs2-palette-green-600": "<brand success>"  // default #19B394 → bg-positive-*
"--sjs2-palette-yellow-600": "<brand warning>" // default #FF9814 → bg-warning-*
"--sjs2-palette-blue-600": "<brand info>"      // default #437FD9 → bg-note-*
```

Focus ring: `--sjs2-color-utility-a11y` (rgba(blue-400/60%)) — override for a brand focus color.

### Dark mode

Do NOT hand-build dark overrides — layer the brand on the built-in dark theme:

```js
import { DefaultDark } from "survey-core/themes";
survey.applyTheme({ ...brandTheme, colorPalette: "dark" }, DefaultDark);
```

`DefaultDark` remaps the full palette (bg-basic → gray-850/900, utility-body → gray-999,
surface `#161519`, brand-700 re-derived via `lch()`, dimmer a11y ring). Your brand overrides
apply on top; re-check brand-600 contrast against gray-900 surfaces — if too dark, supply a
lighter dark-mode brand hex in the dark variant of `brandTheme`.

## Per-component tokens

See [question-controls-map.md](question-controls-map.md) — per-control token lists live
there next to each question type.

## Pitfalls

- Layer-4 token-by-token overrides do not scale; prefer Layer 3.
- Tokens are shared across Form Library, Creator, Dashboard, PDF — `:root` overrides
  restyle all of them.
- Legacy `--sjs-` (single-digit) variables are compat-only; new work uses `--sjs2-`.
- Runtime-applied themes inject tokens under `:where(.sd-theme-root)` — stylesheet overrides
  at `:root` will NOT win; target `.sjs-theme-overrides` (see [custom-css.md](custom-css.md)).
- Token definitions live in runtime-injected `<style>` elements (from `base-theme.ts`),
  even without `applyTheme` — `survey-core.css` only consumes them. Verify a token exists
  by reading the injected styles in the browser, not by grepping the shipped CSS
  ([custom-css.md](custom-css.md) has a snippet).
- Relative-color derivations (`hsl(from …)` / `rgba(from …)`) mean one brand hex fans out
  automatically — but also that pinning a downstream token (e.g. `bg-brand-primary`)
  disconnects it from the ramp; prefer overriding the source (`project-brand-600`).
- Known gaps: rating/file/signaturepad/ranking have no dedicated component color-token
  families; slider `-readonly-thumb-border` is referenced but undefined (see
  [controls/](controls/_shared.md) files).
