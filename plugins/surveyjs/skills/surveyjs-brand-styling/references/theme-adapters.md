# Theme adapters — Bootstrap / MUI / shadcn hosts

Adapter stylesheets restyle the survey using the host design system's own CSS variables.
All facts verified against `packages/survey-core/src/themes/adapters/` and
`rollup.adapters.config.mjs`. Runtime artifacts live at `survey-core/themes/adapters/` in
node_modules (`build/themes/adapters/` in this repo).

## How they work

- Every emitted `<name>.scss` compiles to `themes/adapters/<name>.css` + `<name>.min.css`.
  `bootstrap.scss` and `shadcn.scss` are **shared partials — not emitted** (each variant
  `@use`s them, so the compiled variant css already contains the base; import exactly ONE file).
- All rules are scoped under `.sjs-theme-overrides`. That class is part of the default
  survey root (`rootTheme: "sd-theme-root sjs-theme-overrides"` in
  `src/defaultCss/defaultCss.ts`), so the adapter restyles only the survey — and, being a
  stylesheet rule on the element itself, it **wins over tokens injected by `applyTheme`**
  under `:where(.sd-theme-root)` (lower specificity).
- Mapping: live host variables → `--sjs2-*` tokens (e.g. `--sjs2-color-utility-sheet:
  var(--mui-palette-background-paper)`, `--sjs2-base-unit-radius: var(--bs-border-radius)`).
  Because the mapping reads *live* variables, any host palette/scheme switch re-skins the
  survey automatically. State looks that variables can't express (pressed buttons, radio dot)
  are plain CSS overrides on survey descendants.
- Declared scope (see file header comments): adapters reproduce **stock host components
  only** (Bootstrap `.btn`/`.form-control`/`.form-check`…, stock MUI TextField/Select/
  Checkbox/Switch/Chip/Menu…, shadcn CLI registry components). App-specific layout —
  container padding, breakpoints, `sx`/utility-class spacing — belongs in a small host
  stylesheet loaded **after** the adapter (the demo apps' `/survey-overrides/<adapter>.css`
  pattern). See [custom-css.md](custom-css.md) for writing those overrides.
- MUI and shadcn adapters also set `--sjs-element-min-width: 0` so the host, not SurveyJS,
  controls min element width in multi-column rows.

## Inventory (emitted files)

| Adapter | Host theme | Notes |
| :-- | :-- | :-- |
| `bootstrap-default.css` | Stock Bootstrap 5 | pins Bootstrap's exact stock hex for hover/active shades |
| `bootstrap-cosmo/-flatly/-litera/-lux/-morph/-zephyr.css` | matching Bootswatch theme | derive shades from live `--bs-*` via `color-mix` |
| `bootstrap-darkly.css` | Bootswatch Darkly (dark) | dark chrome, but form controls forced light (Darkly convention); dark by default, no `[data-bs-theme]` toggle |
| `mui.css` | Material UI | reads `--mui-*` CSS theme variables |
| `shadcn-default.css` / `shadcn-new-york.css` | classic shadcn styles | legacy Card layout (p-6 header, border+shadow) |
| `shadcn-base-{luma,lyra,maia,mira,nova,rhea,sera,vega}.css` | shadcn "base" registry styles | dark mode handled via `:is(.dark *)` rules |

Choosing bootstrap variant: use the file matching the loaded Bootswatch theme; plain
Bootstrap → `bootstrap-default`. Unlisted Bootswatch theme → start from `bootstrap-default`
(shades derive from live `--bs-*` anyway) and pin helper hooks (below) if needed.

## Wiring

```js
import "survey-core/survey-core.css";                       // always FIRST
import "survey-core/themes/adapters/bootstrap-default.css"; // exactly ONE adapter
```

CDN: `https://unpkg.com/survey-core/themes/adapters/<name>.min.css` (after
`survey-core.min.css`). Do **not** call `survey.applyTheme(<predefined theme>)` when an
adapter is loaded — but note that adapter rules beat injected tokens anyway, so a stray
default theme is masked, which makes such conflicts hard to notice; keep one mechanism.

### Host prerequisites

- **Bootstrap**: Bootstrap ≥ 5.2 CSS (or a Bootswatch build) loaded — the adapter reads live
  `--bs-primary`, `--bs-border-radius`, `--bs-body-font-weight`, ….
- **MUI**: CSS theme variables must be enabled, else no `--mui-*` vars exist:

```jsx
const theme = createTheme({ cssVariables: true, palette: { /* app palette */ } });
<ThemeProvider theme={theme}>...</ThemeProvider>
```

- **shadcn/ui**: the app's `globals.css` token set must be present — the adapter reads
  `--background`, `--card`, `--primary`, `--muted`, `--border`, `--input`, `--ring`,
  `--radius`, `--spacing`, `--text-*`. Dark mode follows the standard `.dark` class.

## Icon adapters (optional, icon parity with the host)

Side-effect JS modules that re-register the check / radio / chevron icons via
`SvgRegistry.registerIcon("icon-check-16x16" | "icon-radio-16x16" | "icon-chevrondown-24x24", svg)`:

```js
import "survey-core/themes/adapters/icons/mui";     // Material icons
import "survey-core/themes/adapters/icons/lucide";  // Lucide (shadcn)
```

Exports map: ESM `fesm/themes/adapters/icons/*.mjs`, CJS/UMD `themes/adapters/icons/*.js`.
Use lucide with shadcn adapters, mui with the MUI adapter.

## Tunable helper hooks

Adapters expose their own intermediate vars — pin these (after the adapter import) instead
of re-deriving `--sjs2-*` tokens:

- **Bootstrap** (`--sjs-bs-*`): `on-primary`, `primary-hover-bg`, `primary-hover-border`,
  `primary-active-bg`, `primary-active-border`, `primary-focus-border`, `secondary-bg`,
  `on-secondary`, `secondary-hover-bg`, `light-bg`, `on-light`, `light-border`,
  `light-hover-bg`, `light-hover-border`, `action-font-weight`, `action-text-transform`,
  `action-letter-spacing`. Defaults derive from `--bs-primary` via `color-mix` (mirrors
  Bootstrap's shade/tint functions).
- **shadcn** (`--sjs2-shadcn-*`): `action-large-height`, `input-height`,
  `textarea-min-height`, `textarea-padding-vertical`, `table-header-height`,
  `tagbox-item-height`, `tagbox-item-clean-size`, `card-ring`, `card-border-width`,
  `card-shadow`, plus `--shadow-xs/sm/md`.

## Gap handling

Adapters deliberately do not cover app-level layout or widgets the host system lacks
(sliders, signature pad, ranking, matrix chrome keep SurveyJS looks driven by the mapped
tokens). For those, add a small override stylesheet loaded after the adapter, scoped under
`.sjs-theme-overrides` / the survey root — workflow and rules in [custom-css.md](custom-css.md);
per-control selectors and tokens in [controls/](controls/_shared.md).
