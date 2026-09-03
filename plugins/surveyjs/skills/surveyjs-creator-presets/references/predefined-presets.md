# Predefined presets — Basic, Advanced, Expert

Three presets ship in `survey-creator-core/ui-presets`. They are ordinary `IPreset` objects
(`{ name, json }`) and the best available reference for how a real preset is written.

Official sources:
[Predefined UI Presets](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#predefined-ui-presets)
describes the three tiers; each has a live demo —
[Basic](https://surveyjs.io/survey-creator/examples/basic-ui-preset/),
[Advanced](https://surveyjs.io/survey-creator/examples/advanced-ui-preset/),
[Expert](https://surveyjs.io/survey-creator/examples/expert-ui-preset/) — whose
`documentation.md` shows the import for every framework.

```js
import { UIPreset } from "survey-creator-core";
import { Basic, Advanced, Expert } from "survey-creator-core/ui-presets";
// or: import SurveyCreatorUIPreset from "survey-creator-core/ui-presets";  → { Basic, Advanced, Expert }

new UIPreset(Basic).applyTo(creator);
```

Classic script: `<script src="https://unpkg.com/survey-creator-core/ui-presets/index.min.js">`
defines the `SurveyCreatorUIPreset` global; single files exist as `ui-presets/basic.min.js`,
`advanced.min.js`, `expert.min.js`.

## What each one contains (v3.0.x)

| | Basic | Advanced | Expert |
| :-- | :-- | :-- | :-- |
| Tabs | Designer, Preview | Designer, Preview, Translation, Theme, Logic | Designer, Preview, Theme, Logic, JSON, Translation |
| Toolbox | 14 items: radiogroup, rating, slider, checkbox, dropdown, boolean, file, text (no subitems), custom `date`/`email`/`tel` text variants, comment, matrix, image — in four categories (`choice`, `text`, `matrix`, `misc`) | Default toolbox (section absent) | Default toolbox |
| Property grid | A short whitelist per class, everything in the `general` tab, no logic/layout tabs | A curated definition with `layout`, `logic`, `data`, `validation`, and per-type tabs (`choices`, `rateValues`, `mask`, …) | `definition: null` — the stock grid |
| Languages / options / localization | Absent, so defaults | Absent | Absent |

Practical reading:

- **Basic** is a demonstration of a locked-down builder for non-technical authors: no logic,
  no JSON, three input-type variants promoted to top-level toolbox items. Its property grid
  hides `visibleIf` entirely.
- **Advanced** is the model to copy for a "reasonable defaults" grid. Its `propertyGrid`
  definition is ~350 lines and is the most complete public example of `classes` keys, tab
  indexes, and array-editor keys such as `itemvalue[]@choices`.
- **Expert** is "everything on", including the JSON tab. The JSON tab uses Ace when
  `ace-builds` is loaded on the page and a textarea otherwise.

Because Advanced and Expert omit `toolbox` and `languages`, applying either one resets those
to defaults — the same rule as any preset.

## Extending a shipped preset

The exports are plain objects declared `as const`. Deep-copy before editing, then build your
own `IPreset`:

```js
import { Advanced } from "survey-creator-core/ui-presets";

const acme = {
  name: "acme",
  json: {
    ...structuredClone(Advanced.json),
    tabs: { items: [{ name: "designer" }, { name: "preview" }, { name: "logic" }], activeTab: "designer" },
    toolbox: {
      definition: [{ name: "text" }, { name: "dropdown" }, { name: "checkbox" }, { name: "comment" }],
      categories: []
    },
    options: { allowZoom: false }
  }
};
```

The Advanced property grid definition can be pruned per class the same way — copy `classes`,
delete or shorten the `properties` arrays you do not want, keep the `tabs` entries that the
remaining properties point at.

## Registering presets

Official section:
[Register Predefined Presets](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#register-predefined-presets).

```js
import { registerUIPreset } from "survey-creator-core";
import SurveyCreatorUIPreset from "survey-creator-core/ui-presets";

registerUIPreset(SurveyCreatorUIPreset);          // Basic, Advanced, Expert
registerUIPreset(acme, { name: "acme-lite", json: { /* ... */ } });   // your own, one or many
```

`registerUIPreset` accepts individual `IPreset` objects and/or the module object from
`ui-presets`. It stores them in the `CreatorPresets` registry and the `PredefinedCreatorPresets`
name list, ordered `basic`, `advanced`, `expert` first and then registration order.

Registration has two effects, both requiring the call to run **before** the Creator is
constructed:

1. The Designer tab's **Creator Settings** panel (gear icon) gains a **Preset** dropdown listing
   every registered preset. Picking one applies it and sets `creator.activePresetName`.
   Selecting a preset in code with `applyTo()` on a named preset keeps the dropdown in sync.
2. The UI Preset Editor lists registered presets as starting points and in **Manage Presets**.

The dropdown label for a preset is looked up as `preset.names.<name>` in the Creator
localization. Basic, Advanced, and Expert are translated; a custom name falls back to the raw
`name`, so add a display string when it should read differently:

```js
import { editorLocalization } from "survey-creator-core";
editorLocalization.getLocale("en").preset.names.acme = "Acme standard";
```

Registration alone changes nothing on the Creator. Apply the preset you want as the starting
state explicitly, or the Creator starts with its defaults and an empty dropdown.
