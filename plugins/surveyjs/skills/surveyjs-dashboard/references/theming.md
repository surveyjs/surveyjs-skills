# Theming

Since v3, Dashboard uses the **same theme system as every other SurveyJS product**: a theme
is a JSON object of CSS variables, and you apply it with `applyTheme`. There is no
Dashboard-specific theme format, and no Plotly `layout`/`config` styling — that was the old
architecture.

## Predefined themes

The theme objects ship in `survey-core` (which Dashboard already depends on). Every theme
has dark and panelless variants — 32 combinations total.

```js
import { FlatDarkPanelless } from "survey-core/themes";

const dashboard = new Dashboard({ /* ... */ });
dashboard.applyTheme(FlatDarkPanelless);
```

Script-tag apps load the theme script and use the `SurveyTheme` global:

```html
<script src="https://unpkg.com/survey-core/themes/flat-dark-panelless.min.js"></script>
<script>
  dashboard.applyTheme(SurveyTheme.FlatDarkPanelless);
</script>
```

The Default Light theme applies automatically with the stylesheet — call `applyTheme` only
to use something else. Theme JSON definitions:
<https://github.com/surveyjs/survey-library/tree/master/packages/survey-core/src/themes>.

## Matching the form

Because the format is shared, applying the **same theme object** to the survey and the
dashboard gives a consistent look:

```js
survey.applyTheme(brandTheme);
dashboard.applyTheme(brandTheme);
```

## Custom themes

A custom theme is the same shape — `cssVariables` plus metadata:

```js
const brandTheme = {
  cssVariables: { /* --sjs-... variables */ },
  themeName: "brand",
  colorPalette: "light",   // or "dark"
  isPanelless: false
};
dashboard.applyTheme(brandTheme);
```

Two ways to produce one:

- **Theme Editor** — visual editor in Survey Creator (or the all-in-one demo at
  <https://surveyjs.io/create-free-survey>); export the JSON when done.
- **By hand** — copy a predefined theme object and change variables. The variable system is
  documented at <https://surveyjs.io/documentation/design-tokens-css-customization.md>.

Prefer theme variables over overriding `.sa-*`/`.sv-*` CSS classes — class names are
internal and move between releases.

## Dark mode switching

Import both variants and re-apply on toggle:

```js
import { ContrastDark, ContrastLight } from "survey-core/themes";

dashboard.applyTheme(prefersDark ? ContrastDark : ContrastLight);
```
