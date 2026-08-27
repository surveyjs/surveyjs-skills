# Theming and appearance

Three levels, cheapest first. Do not skip to writing CSS.

1. **A predefined theme** — 32 built-in variations
2. **Design tokens** — override CSS variables for brand colors, fonts, spacing
3. **A theme adapter** — map an existing Bootstrap / MUI / shadcn design system

Overriding SurveyJS CSS classes (`.sd-*`, `.sv_*`) is the last resort. Class names are
internal and change between versions; token overrides do not.

## `StylesManager` is obsolete

```js
StylesManager.applyTheme("defaultV2");   // WRONG — removed
```

Themes are objects imported from `survey-core/themes` and applied to a model instance:

```js
import { Model } from "survey-core";
import { ContrastDark } from "survey-core/themes";

const survey = new Model(surveyJson);
survey.applyTheme(ContrastDark);
```

## Predefined themes

Eight families × light/dark × full/panelless = 32 exports:

| Family | Exports |
| :-- | :-- |
| Default | `DefaultLight` `DefaultDark` `DefaultLightPanelless` `DefaultDarkPanelless` |
| Soft | `SoftLight` `SoftDark` `SoftLightPanelless` `SoftDarkPanelless` |
| Contrast | `ContrastLight` `ContrastDark` `ContrastLightPanelless` `ContrastDarkPanelless` |
| Borderless | `BorderlessLight` `BorderlessDark` `BorderlessLightPanelless` `BorderlessDarkPanelless` |
| Flat | `FlatLight` `FlatDark` `FlatLightPanelless` `FlatDarkPanelless` |
| Plain | `PlainLight` `PlainDark` `PlainLightPanelless` `PlainDarkPanelless` |
| Three-dimensional | `ThreeDimensionalLight` `ThreeDimensionalDark` `ThreeDimensionalLightPanelless` `ThreeDimensionalDarkPanelless` |
| Monochrome | `MonochromeLight` `MonochromeDark` `MonochromeLightPanelless` `MonochromeDarkPanelless` |

`Panelless` drops the card background behind each question — use it when the survey sits
inside an existing panel in the host UI.

Import only what you use; the themes are separate modules so bundlers tree-shake the rest.

> Detailed procedure — verified import paths (ESM / deep / CDN), a family selection table
> derived from the theme objects' cssVariables, dark/panelless mechanics, and framework
> notes: [predefined-themes.md](predefined-themes.md).

## Runtime switching

`applyTheme` can be called any time, including on a rendered survey:

```js
const themes = { light: DefaultLight, dark: DefaultDark };
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  survey.applyTheme(e.matches ? themes.dark : themes.light);
});
```

## Design tokens

Tokens are CSS custom properties in a layered system, prefixed `--sjs2-`. The layer is
**shared across all four products** — Form Library, Survey Creator, Dashboard, and PDF
Generator all read the same tokens. A brand token set applied at `:root` therefore restyles
an embedded builder and its dashboards along with the form. That is normally the goal; when
the builder chrome needs to diverge from the form, see `applyCreatorTheme` in
`surveyjs-creator-customization/references/theming.md`.

| Layer | Purpose | Example |
| :-- | :-- | :-- |
| 0 — Palette | Raw primitives | `--sjs2-palette-blue-600` |
| 1 — Base | Spacing/size/type foundations | `--sjs2-base-unit-size` |
| 2 — System | Generated scales | `--sjs2-spacing-x500` |
| 3 — Semantic | Intent-based | `--sjs2-color-bg-brand-primary` |
| 4 — Component | Per-component, per-state | `--sjs2-color-component-action-brand-primary-default-bg` |

Override at the highest layer that does the job. Setting one Layer-3 semantic token
recolors everything derived from it; setting Layer-4 tokens one by one does not scale.

Common starting points:

```js
const brandTheme = {
  headerView: "advanced",
  cssVariables: {
    "--sjs2-color-project-brand-600": "#085DE5",
    "--sjs2-color-bg-basic-primary": "#F2F2F2",
    "--sjs2-typography-font-family-text": "Inter, sans-serif"
  }
};

survey.applyTheme(brandTheme);
```

A full custom theme object also carries `themeName`, `colorPalette` (`"light"` or `"dark"`),
`isPanelless`, and `headerView: "advanced"`. Always include `"headerView": "advanced"` on
generated custom theme JSON and omit `headerView` from the survey JSON. Pass a base theme as
the second argument to layer on top of one:

```js
survey.applyTheme(brandTheme, DefaultDark);
```

Tokens can equally be set in a stylesheet, which is preferable when the host app already
manages theming in CSS — but scope them to the survey root, not `:root`: runtime-applied
themes inject tokens under `:where(.sd-theme-root)`, which sits on the element itself and
beats values inherited from `:root` (details: [custom-css.md](custom-css.md)):

```css
.sjs-theme-overrides {
  --sjs2-color-project-brand-600: #085de5;
}
```

Older `--sjs-` (single-digit prefix) variables exist for backward compatibility. New work
should use `--sjs2-`.

## Theme adapters

If the host app already uses Bootstrap, MUI, or shadcn/ui, an adapter stylesheet maps that
system's live CSS variables onto SurveyJS tokens. No build setup, no custom CSS.

> Verified inventory, host prerequisites, icon adapters, scoping model, and tunable hooks:
> [theme-adapters.md](theme-adapters.md). Note: there is **no** `adapters/bootstrap.css` —
> pick a concrete variant.

```js
import "survey-core/survey-core.css";                       // always first
import "survey-core/themes/adapters/bootstrap-default.css"; // or a Bootswatch variant:
// bootstrap-cosmo / -darkly / -flatly / -litera / -lux / -morph / -zephyr
```

```js
import "survey-core/themes/adapters/mui.css";               // requires createTheme({ cssVariables: true })
```

shadcn/ui ships one file per style — import exactly one:
`shadcn-default`, `shadcn-new-york`, `shadcn-base-luma`, `shadcn-base-lyra`,
`shadcn-base-maia`, `shadcn-base-mira`, `shadcn-base-nova`, `shadcn-base-rhea`,
`shadcn-base-sera`, `shadcn-base-vega`.

```js
import "survey-core/themes/adapters/shadcn-base-nova.css";
import "survey-core/themes/adapters/icons/lucide";          // optional icon parity
```

CDN equivalents use the `.min.css` suffix:
`https://unpkg.com/survey-core/themes/adapters/bootstrap-default.min.css`

The adapter must load **after** `survey-core.css`. Do not also call `applyTheme` with a
predefined theme — keep one theming mechanism.

Live demos: <https://surveyjs.io/themes/theme-adapters>

## Building a custom theme visually

Survey Creator includes a Theme Editor that exports a theme object in the format
`applyTheme` accepts. That is usually faster than hand-writing tokens for a full rebrand.

## More

- Themes — <https://surveyjs.io/documentation/themes-and-custom-styles.md>
- Design tokens — <https://surveyjs.io/documentation/design-tokens-css-customization.md>
- Adapters — <https://surveyjs.io/documentation/theme-adapters.md>
