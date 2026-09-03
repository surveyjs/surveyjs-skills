# UI presets — configuration per project

A preset is a **JSON configuration** describing how one Survey Creator instance should look and
behave: which tabs exist, what the toolbox offers, which properties the grid shows, which
languages are available, and general options. One Creator instance, many presets, no fork per
customer.

Authoring that JSON, the predefined Basic/Advanced/Expert presets, `registerUIPreset`, the
no-code UI Preset Editor, and saving and loading presets are covered by the dedicated
**`surveyjs-creator-presets`** skill. This page holds only what an embedding answer needs.

## Version gate — check this first

UI presets live in `survey-creator-core` **from v3.0.0**. They are **not present in v2.5.x** —
there is no preset code in that package at all, so an answer recommending presets to a v2 user
is recommending an API they cannot import. (An earlier, separate `creator-presets-core` package
existed in the v1 line on its own release track; it is not the same thing as the v3 API below.)

On v2, configure the Creator imperatively instead: `ICreatorOptions` for tabs and behaviour,
`creator.toolbox` for toolbox contents, `onPropertyShowing` for the property grid. That is the
pre-preset approach, and on v2 it is the correct answer rather than a dated one.

Confirm the installed major before recommending either.

## Applying one

```js
import { SurveyCreatorModel, UIPreset } from "survey-creator-core";
import { Basic } from "survey-creator-core/ui-presets";   // or your own { name, json }

const creator = new SurveyCreatorModel(creatorOptions);
new UIPreset(Basic).applyTo(creator);
```

Apply right after construction and before rendering. `applyTo()` describes the **whole** UI: a
section missing from the preset resets that part of the Creator to its defaults, and any
imperative toolbox or tab changes made earlier are undone. Do not combine the two approaches
on one instance — pick a preset, or pick code.

## What presets replace

An answer that reconfigures a single Creator imperatively at runtime — toggling `showLogicTab`
and `showTranslationTab`, looping over `creator.toolbox` to remove items, hiding properties
through `onPropertyShowing` — still works on v3, and every method in it still exists. It is
simply the v2 shape of the answer. On v3 with several client configurations to serve, a preset
is the intended structure; hand the authoring to `surveyjs-creator-presets`.

## Current documentation

[UI Preset Editor](https://surveyjs.io/survey-creator/documentation/ui-preset-editor) (append
`.md` for the Markdown version) and the
[UI Preset Editor demo](https://surveyjs.io/survey-creator/examples/ui-preset-editor/).
