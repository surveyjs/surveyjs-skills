# UI presets — configuration per project

A preset is a **JSON configuration** describing how one Survey Creator instance should look and
behave: which tabs exist, what the toolbox offers, which properties the grid shows, which
languages are available, and general options. One Creator instance, many presets, no fork per
customer.

## Version gate — check this first

UI presets live in `survey-creator-core` **from v3.0.0**. They are **not present in v2.5.x** —
there is no preset code in that package at all, so an answer recommending presets to a v2 user
is recommending an API they cannot import. (An earlier, separate `creator-presets-core` package
existed in the v1 line on its own release track; it is not the same thing as the v3 API below.)

On v2, configure the Creator imperatively instead: `ICreatorOptions` for tabs and behaviour,
`creator.toolbox` for toolbox contents, `onPropertyShowing` for the property grid. That is the
pre-preset approach, and on v2 it is the correct answer rather than a dated one.

Confirm the installed major before recommending either.

## Shape

A preset JSON has one key per section:

| Key | Configures |
| :-- | :-- |
| `toolbox` | Toolbox contents, under a `definition` array |
| `tabs` | Which tabs exist and their order |
| `propertyGrid` | Property grid layout, under a `definition` array |
| `languages` | Available locales |
| `options` | Creator options |
| `localization` | Preset-specific UI strings |

```js
const clientPreset = {
  name: "acme",
  json: {
    toolbox: {
      definition: [
        { name: "radiogroup" },
        { name: "checkbox" },
        { name: "text", subitems: [] },
        { name: "email", title: "Email", json: { type: "text", inputType: "email" } }
      ]
    },
    tabs: { /* ... */ },
    propertyGrid: { /* ... */ }
  }
};
```

A toolbox entry can name an existing type, or define a variation by supplying `title`,
`iconName` and a `json` block — the same idea as `toolbox.addItem`, expressed declaratively.

## Applying one

```js
import { UIPreset } from "survey-creator-core";

const creator = new SurveyCreatorModel(creatorOptions);
new UIPreset(clientPreset).applyTo(creator);
```

`applyTo(creator)` is the public entry point. The constructor accepts either the `{ name, json }`
wrapper above or a bare configuration object. When the preset carries a `name`, it is recorded
on `creator.activePresetName`.

Pick the preset per request — by tenant, by user role, by whatever your app already knows — and
apply it to a freshly constructed Creator. Nothing here requires a second Creator build.

## Predefined presets

Three ship in the box, useful as starting points or as ready-made complexity tiers:

```js
import { Basic, Advanced, Expert } from "survey-creator-core/ui-presets";

new UIPreset(Basic).applyTo(creator);
```

`Basic` trims the toolbox to common question types and simplifies the tabs and property grid;
`Advanced` and `Expert` progressively expose more.

## The no-code preset editor

Presets are JSON, so they can be produced by hand — but `survey-creator-core/ui-preset-editor`
provides an editor for building and managing them without code, which is what makes
per-customer configuration something a non-developer can own.

## Current documentation

Presets are newer than most of the Creator documentation, and the package ships no generated
reference. When a detail matters, fetch:

`https://surveyjs.io/survey-creator/documentation/ui-preset-editor.md`

## What presets replace

An answer that reconfigures a single Creator imperatively at runtime — toggling `showLogicTab`
and `showTranslationTab`, looping over `creator.toolbox` to remove items, hiding properties
through `onPropertyShowing` — still works on v3, and every method in it still exists. It is
simply the v2 shape of the answer. On v3 with several client configurations to serve, a preset
is the intended structure.
