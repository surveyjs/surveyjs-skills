# Theming the builder vs. theming the form

Survey Creator has **two independent theme systems**. Most wrong answers use one API for both.

| Layer | What it styles | API | Object type |
| :-- | :-- | :-- | :-- |
| Creator theme | The builder chrome: toolbox, tabs, property grid, headers | `creator.applyCreatorTheme(theme)` | `ICreatorTheme` |
| Survey theme | The form on the design surface, in Preview, and for respondents | `creator.theme` | `ITheme` |

They use different variable namespaces. Passing an `ITheme` to `applyCreatorTheme()` — or a
creator theme to `survey.applyTheme()` — does not work, and does not report an error.

Symptom mapping, since users describe these in terms of what looks wrong:

- "The builder doesn't match our admin app's dark chrome" → **creator theme**
- "The form in the designer doesn't look like what respondents see" → **survey theme**

## Creator theme

Four ship in the box: **Light**, **Dark**, **Contrast** and **Survey Creator 2020**. Light is
what `survey-creator-core.css` already applies; the other three are JSON objects of CSS
variables that override it.

```js
import { SC2020 } from "survey-creator-core/themes";
// import { DefaultDark, DefaultContrast } from "survey-creator-core/themes";

const creator = new SurveyCreatorModel(creatorOptions);
creator.applyCreatorTheme(SC2020);
```

Importing all of them at once also works:

```js
import SurveyCreatorTheme from "survey-creator-core/themes";
creator.applyCreatorTheme(SurveyCreatorTheme.DefaultDark);
```

### Letting users pick

By default users can customise only the Light theme. To offer the others in the settings UI,
register them:

```js
import SurveyCreatorTheme from "survey-creator-core/themes";
import { registerCreatorTheme } from "survey-creator-core";

registerCreatorTheme(SurveyCreatorTheme);           // all of them
// registerCreatorTheme(SC2020);                    // or one at a time
```

`showCreatorThemeSettings` controls whether users may modify the creator theme at all. It
defaults to `true` but **applies only when `propertyGridNavigationMode` is `"buttons"`** — if
the settings UI is missing, check that first rather than assuming the option is broken.

### Persisting a user's customisations

The current creator theme is `creator.creatorTheme`. Save it yourself; nothing is stored for
you:

```js
creator.onCreatorThemePropertyChanged.add(() => {
  localStorage.setItem("creatorTheme", JSON.stringify(creator.creatorTheme));
});

const saved = localStorage.getItem("creatorTheme");
if (saved) creator.applyCreatorTheme(JSON.parse(saved));
```

## Survey theme

The theme applied to the form itself is `creator.theme`, and it is the same kind of object
`survey.applyTheme()` takes — so a theme exported from the Theme editor drops straight in.
`creator.themeForPreview` covers the Preview tab specifically.

When `autoSaveEnabled` is on, theme changes are persisted through `saveThemeFunc`, the theme
counterpart to `saveSurveyFunc`. Survey JSON and theme JSON are separate objects with separate
lifecycles: store them separately, and apply the theme per form or globally as your product
requires.

## Design tokens and design-system adapters

Below both theme APIs sits one shared token layer. It is **not** Form-Library-only: Creator
reads the same `--sjs2-` custom properties, and `creator.getRootCss()` puts `sd-theme-root`
and `sjs-theme-overrides` on the Creator root — the selector every adapter stylesheet targets.

Two consequences worth knowing before reaching for either theme API:

- **A brand token set styles the builder too.** Overriding a semantic token such as
  `--sjs2-color-project-brand-600` recolours the Creator chrome and the form together. Reach
  for tokens when the goal is "match our product's brand"; reach for `applyCreatorTheme` when
  the goal is a distinct chrome treatment, such as a dark builder around a light form.
- **A Bootstrap, MUI, or shadcn adapter restyles the whole Creator**, not just the survey on
  the design surface. That is usually what you want when embedding the builder in an admin app
  already built on one of those systems, and it means you do not also need a creator theme.

Creator's older `--sjs-*` variables still resolve — `survey-creator-core/src/themes/legacy-vars.ts`
maps each one onto its `--sjs2-` replacement — but new work should use `--sjs2-`.

Token layers, naming conventions, the full adapter list, and import order are documented once,
in the Form Library integration skill: `surveyjs-integration/references/theming.md`.
Read it rather than re-deriving them here.

## Not the answer

Overriding Creator's internal CSS class names. Both layers have a supported theme API, and
class names are internal; a stylesheet written against them breaks on upgrade with no warning.
