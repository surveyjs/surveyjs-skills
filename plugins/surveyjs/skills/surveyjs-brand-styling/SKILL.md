---
name: surveyjs-brand-styling
description: >
  Style a SurveyJS application so it matches a custom app design, design system, or brandbook —
  applying one of the predefined themes, building a custom theme from brand colors and fonts,
  mapping a Bootstrap, MUI, or shadcn host through a theme adapter, or writing a custom CSS file
  with token overrides and scoped rules, plus per-question-type (per-control) styling references.
  Use when asked to style a survey, apply or customize a SurveyJS theme, add a dark theme, match
  a survey to a brand or brandbook, fit a survey into a Bootstrap, MUI, or shadcn app, override
  survey colors or fonts, restyle an individual control such as a dropdown, input, or slider, or
  when a survey looks different from the rest of the application.
---

# SurveyJS brand styling

Help the developer restyle a SurveyJS form so it matches the host application's design or
brandbook. Operate case-driven: route the request to ONE of the four cases below, collect
the missing inputs via that case's intake script, then complete the case's deliverable in a
single pass and check it against the acceptance criteria.

Not this skill:

- Installing the Form Library, rendering a model, wiring events or backend saving →
  `surveyjs-integration`
- Theming the form **builder** UI (Creator chrome, property grid, toolbox) →
  `surveyjs-creator-customization`
- Theming charts and tables of collected responses → `surveyjs-dashboard`
- Themes and layout of exported PDF documents → `surveyjs-pdf-generator`
- Question types, choices, or conditional logic in the survey JSON → `surveyjs-form-json`

## Core principle

Three levels, cheapest first. Do not skip to writing CSS.

1. **Predefined theme** — pick the closest of 32 built-in variations.
2. **Design tokens** — override `--sjs2-*` CSS variables for brand colors, fonts, spacing.
3. **Theme adapter** — map an existing Bootstrap / MUI / shadcn design system.

Overriding SurveyJS CSS classes (`.sd-*`, `.sv_*`) is the **last resort**: class names are internal and change between versions; token overrides do not.

Generated custom theme JSON must include `"headerView": "advanced"`. When that theme is
applied, omit `headerView` from the survey JSON (see `surveyjs-form-json`).

## Step 0 — route to a case

Detect the case from the user's request using the signal table. **If no row matches
unambiguously, ask this one question first** (single-select) and wait for the answer:

> Which task do you want to accomplish?
> 1. **Apply a default SurveyJS theme** — pick one of the 32 built-in looks
> 2. **Build a custom theme from branding info** — brandbook / brand colors / fonts → theme object
> 3. **Match the host app via a theme adapter** — host uses Bootstrap, MUI, or shadcn/ui
> 4. **Match the host app via a custom CSS file** — token overrides + scoped CSS rules

| Signals in the user's request | Case |
| :-- | :-- |
| "default/built-in/predefined theme", a theme name (Contrast, Flat, Soft…), "dark theme", "quick restyle" | 1 |
| brandbook/brand guide, concrete brand colors/fonts/radii supplied, "our corporate style" | 2 |
| host app uses Bootstrap / Bootswatch / MUI / Material UI / shadcn (even if not asking for an adapter) | 3 |
| "match our app" with a custom design system, host CSS/vars provided, asks for CSS overrides, no adapter-supported system | 4 |

Tiebreakers: adapter-supported host → prefer 3 over 4. Brand info given but host uses an
adapter-supported system → 3, then layer 2 on top only if the survey must diverge from the host.
Never start with raw CSS if a cheaper case applies.

## Case 1 — apply a predefined theme

Procedure: [references/predefined-themes.md](references/predefined-themes.md).

**Intake script** — ask only what the request doesn't already answer:
1. Light, dark, or both (runtime switch)?
2. Is the survey embedded inside an existing host card/panel/modal? (yes → `*Panelless`)
3. Which shape language fits: crisp borders (Default/Plain/Flat), soft shadows (Soft), no borders (Borderless), high contrast (Contrast/Monochrome), raised 3D (ThreeDimensional)? Offer the family table if unsure.
4. Framework (React/Angular/Vue3/vanilla) and npm-or-CDN? (usually detectable from the workspace — don't ask if visible)

**One-pass deliverable**: base CSS import + theme import + `applyTheme` call (+ runtime
switch listener if "both") placed in the user's actual entry file.

**Acceptance criteria**:
- [ ] `survey-core/survey-core.css` (or `.fontless.css`) imported before anything theme-related
- [ ] Theme imported from `survey-core/themes` (or `SurveyTheme.*` via CDN) — name exists in the 32-export list
- [ ] Variant matches answers: `*Dark` iff dark, `*Panelless` iff embedded
- [ ] Applied via `survey.applyTheme(...)`; no `StylesManager`, no adapter stylesheet loaded simultaneously
- [ ] Survey renders with the theme (verify in browser or ask user to confirm)

## Case 2 — custom theme from branding info

Procedure: [references/brandbook-intake.md](references/brandbook-intake.md) (branding-info
contract + worked example) and [references/design-tokens.md](references/design-tokens.md) (recipes).

**Intake script** — the contract's only *required* input is one brand color; ask for what's
missing, offering the default as the fallback:
1. Brand/primary color (hex)? Is it light (→ need text-on-brand color)?
2. Page background, card background, input fill — or "keep defaults"?
3. Font family? Who loads it — host app (→ `survey-core.fontless.css`) or bundled default?
4. Corner radius (one value, or per inputs/popups/cards)? Density (compact/regular/spacious)?
5. State colors (error/success/warning/info) — or keep defaults?
6. Light/dark/both? Embedded in a host card (panelless)?

**One-pass deliverable**: a complete `brandTheme = { themeName, colorPalette, isPanelless,
headerView: "advanced", cssVariables }` object + `applyTheme(brandTheme, <base theme>)`
wiring in the entry file. Always include `"headerView": "advanced"` on generated theme JSON;
omit `headerView` from the survey JSON when this theme is applied.

**Acceptance criteria**:
- [ ] Every provided branding value is mapped to a token from the intake table; nothing invented — token names exist in `base-theme.ts`
- [ ] Only source tokens overridden (e.g. `project-brand-600`, not downstream `bg-brand-primary`) unless a derived shade was explicitly supplied
- [ ] Layered over a base theme via two-arg `applyTheme`; dark variant (if requested) layers over `DefaultDark`, not hand-built
- [ ] Default teal surface tint addressed (`--sjs2-color-utility-surface-survey`) if backgrounds were specified
- [ ] Verification pass done: representative question types, hover/focus/error/disabled, mobile width, popups (checklist in brandbook-intake.md §5)
- [ ] Generated theme JSON includes `"headerView": "advanced"`; survey JSON omits `headerView`

## Case 3 — theme adapter (Bootstrap / MUI / shadcn)

Procedure: [references/theme-adapters.md](references/theme-adapters.md).

**Intake script**:
1. Which system and flavor: plain Bootstrap or a Bootswatch theme (which one)? MUI? shadcn (which style — default / new-york / base-\*)? (Often detectable from package.json / globals.css — check before asking.)
2. MUI only: is the theme created with `cssVariables: true`? (If not, that change is part of the deliverable.)
3. shadcn only: dark mode via `.dark` class in use?
4. Icon parity wanted (mui/lucide icon adapters)?

**One-pass deliverable**: adapter CSS import (after base CSS) + host-prerequisite fix if
needed (MUI `cssVariables: true`) + optional icon adapter import; removal of any conflicting
`applyTheme(<predefined>)` calls.

**Acceptance criteria**:
- [ ] Exactly ONE adapter file imported, and it is an emitted artifact (e.g. `bootstrap-default.css`, `mui.css`, `shadcn-base-nova.css` — never `bootstrap.css`/`shadcn.css`)
- [ ] Import order: `survey-core.css` → adapter → (optional) app override file
- [ ] Host prerequisite satisfied: live `--bs-*` vars / MUI `cssVariables: true` / shadcn token set present
- [ ] No predefined-theme `applyTheme` call remains alongside the adapter
- [ ] Survey visually follows the host palette; host theme/scheme switch re-skins the survey without code changes

## Case 4 — custom CSS file (token overrides + scoped rules)

Procedure: [references/custom-css.md](references/custom-css.md).

**Intake script**:
1. Source of truth for the host look: a stylesheet/vars file I can read, a running page to inspect, or values you'll dictate? (Collect: input bg/border/radius, focus ring, primary color, font, page/card bg.)
2. Which question types does the survey use? (Limits the per-control work — [references/question-controls-map.md](references/question-controls-map.md).)
3. Is a theme applied at runtime (`applyTheme` anywhere)? (Decides `.sjs-theme-overrides` vs `:root` scoping — when unsure, scope to `.sjs-theme-overrides`.)
4. Light/dark/both?

**One-pass deliverable**: one `survey-brand.css` — token-override block scoped to
`.sjs-theme-overrides` first, then per-control scoped rules only for verified token gaps —
plus its import as the last stylesheet. When the host exposes CSS variables, reference them
(`var(--primary)`) instead of copying values so host theme switches propagate.

**Acceptance criteria**:
- [ ] Everything expressible as a token IS a token override; custom rules exist only for documented gaps (rating colors, signaturepad focus, etc.)
- [ ] Token block scoped to `.sjs-theme-overrides` (never bare `:root` when a theme is applied)
- [ ] Every custom rule scoped under the survey root; single BEM-class hooks; no `!important`, no DOM-mirroring descendant chains, no shared system tokens (`--sjs2-radius-x100`, `--sjs2-base-unit-*`) bent for one control
- [ ] File loaded after `survey-core.css` (and after any adapter); survey-core version noted in a header comment
- [ ] Type scale, control heights, checkbox/radio sizes, vertical rhythm (label/input/field gaps, choice-row spacing), and panel/card chrome (padding, header divider) matched to the host (custom-css.md §Step 1b), not just colors
- [ ] Visual parity confirmed against the host for the used question types incl. hover/focus/error states

## Fine-tuning (any case)

Read [references/controls/_shared.md](references/controls/_shared.md) first — title, description,
the `.sd-formbox` input surface, question spacing, error box, and focus ring are shared by all
types. Then open the file for the question type in question (verified selectors + token chains
for text, spacing, borders, focus/hover); [references/question-controls-map.md](references/question-controls-map.md)
maps a brandbook's widget names ("inputs", "selects", "sliders") to these types.

- Text inputs — [`text`](references/controls/text.md), [`comment`](references/controls/comment.md), [`multipletext`](references/controls/multipletext.md)
- Selects — [`dropdown`](references/controls/dropdown.md), [`tagbox`](references/controls/tagbox.md)
- Choice controls — [`radiogroup`](references/controls/radiogroup.md), [`checkbox`](references/controls/checkbox.md), [`boolean`](references/controls/boolean.md), [`buttongroup`](references/controls/buttongroup.md), [`imagepicker`](references/controls/imagepicker.md)
- Ranges & scales — [`slider`](references/controls/slider.md), [`rating`](references/controls/rating.md)
- Other widgets — [`file`](references/controls/file.md), [`signaturepad`](references/controls/signaturepad.md), [`ranking`](references/controls/ranking.md)
- Composite — [`matrix`](references/controls/matrix.md), [`matrixdropdown`](references/controls/matrixdropdown.md), [`matrixdynamic`](references/controls/matrixdynamic.md), [`paneldynamic`](references/controls/paneldynamic.md)
- Display content (`html`, `image`, `expression`, `imagemap`) — [display-content.md](references/controls/display-content.md)

## References

- [references/theming.md](references/theming.md) — themes, `applyTheme`, token layers, adapters (authoritative overview)
- [references/predefined-themes.md](references/predefined-themes.md) — applying a built-in theme: verified imports (ESM/deep/CDN), family selection table, dark/panelless variants, framework notes
- [references/theme-adapters.md](references/theme-adapters.md) — Bootstrap/MUI/shadcn adapters: emitted file inventory, `.sjs-theme-overrides` scoping, host prerequisites, icon adapters, tunable hooks
- [references/design-tokens.md](references/design-tokens.md) — token catalog and override recipes
- [references/question-controls-map.md](references/question-controls-map.md) — question types ↔ standard web controls, links to per-control styling files
- [references/controls/_shared.md](references/controls/_shared.md) — surfaces shared by all question types (title, description, `.sd-formbox` input surface, spacing, error box, focus ring)
- [references/controls/](references/controls/) — one file per question type (indexed under **Fine-tuning** above): verified selectors + token chains for text colors/sizes, spacings, borders, focus/hover states
- [references/brandbook-intake.md](references/brandbook-intake.md) — what to extract from a brandbook and how it maps to tokens
- [references/custom-css.md](references/custom-css.md) — custom stylesheet workflow: `.sjs-theme-overrides` scoping (why `:root` fails), token overrides + scoped rules for token gaps, `onUpdateQuestionCssClasses`, anti-patterns
