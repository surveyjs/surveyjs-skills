---
name: surveyjs-creator-presets
description: >
  Author, apply, and manage SurveyJS Survey Creator UI presets — the JSON configuration
  (survey-creator-core v3+) that decides which tabs, toolbox items, property grid settings,
  languages, and options one form-builder instance exposes. Covers writing a preset from
  requirements, the predefined Basic/Advanced/Expert presets, UIPreset.applyTo, registerUIPreset,
  the no-code UI Preset Editor, saving and loading presets per tenant or user role, and
  localizing preset labels. Use when the builder must show only certain question types or tabs,
  hide or regroup property grid settings, look different per customer, or when code imports
  UIPreset, UIPresetEditor, survey-creator-core/ui-presets, or survey-creator-core/ui-preset-editor.
---

# Survey Creator UI presets

A UI preset is a JSON object that describes one Survey Creator configuration: the tabs, the
toolbox, the property grid, the languages, general options, and UI strings. Apply it to a
freshly built Creator and that instance looks and behaves the way the preset says. One Creator
build, many presets, no fork per customer.

The source of truth is the official guide,
[UI Preset Editor](https://surveyjs.io/survey-creator/documentation/ui-preset-editor), and its
demos. This skill condenses it and adds the behaviour the guide leaves implicit; when the two
disagree, the guide wins and this skill needs an update.

Not this skill:

- Installing and rendering the Creator, saving survey JSON, creator events, builder theming →
  `surveyjs-creator-customization`
- Imperative one-off tweaks on a single Creator (`creator.toolbox.removeItem`,
  `onPropertyShowing`) → `surveyjs-creator-customization`. When the configuration differs per
  project, role, or tenant, or has to be stored, the answer is a preset and belongs here.
- The survey JSON the builder produces → `surveyjs-form-json`
- Styling the form being designed → `surveyjs-brand-styling`

## Version gate — check this first

Presets ship inside `survey-creator-core` **from v3.0.0**. There is no preset code in v2.x, so
recommending `UIPreset` to a v2 project points at an import that does not exist. On v2, configure
the Creator imperatively (`ICreatorOptions`, `creator.toolbox`, `onPropertyShowing`), which
`surveyjs-creator-customization` covers. Confirm the installed major before answering.

## Licensing

Survey Creator is a commercial product; `setLicenseKey(key)` activates it, and the key comes
from <https://surveyjs.io/remove-alert-banner>. Applying presets in code needs nothing beyond
the Creator license. The **UI Preset Editor** (the no-code tool) is a **PRO and Enterprise**
feature; a Basic-tier license shows an alert banner when it is attached — see
[Activate a SurveyJS License](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#activate-a-surveyjs-license).
Say so when suggesting the editor, never invent a key, and never add code that hides a banner.

## The mental model: a preset is the whole UI, not a patch

`applyTo()` walks every section, and a **missing section resets that part of the UI to its
default** — it does not leave it alone. The one exception is the property grid.

| Section | When present | When absent from the preset |
| :-- | :-- | :-- |
| `tabs` | Exactly these tabs, in this order | Tabs recomputed from `showXxxTab` options |
| `toolbox` | Only the listed items and categories | Full default toolbox |
| `propertyGrid` | Uses `definition`; `null` restores the default grid | **Left as it was** |
| `languages` | Creator locale and survey locale list | Locale cleared, survey locale list emptied |
| `options` | Each key assigned onto the Creator | Nothing assigned; earlier values stay |
| `localization` | Override strings per locale | Overrides removed |

Consequences: write a complete preset rather than a delta; do not mix a preset with imperative
toolbox or tab code, because the next `applyTo()` undoes it; switching presets at runtime is
safe because every apply starts from defaults. Details per section: `references/preset-json.md`.

## Shape

```js
const hrPreset = {
  name: "hr-basic",                       // optional; recorded on creator.activePresetName
  json: {
    tabs: { items: [{ name: "designer" }, { name: "preview" }], activeTab: "designer" },
    toolbox: {
      definition: [
        { name: "text", subitems: [] },
        { name: "email", title: "Email", iconName: "icon-toolbox-email-24x24",
          json: { type: "text", inputType: "email" } },
        { name: "dropdown" },
        { name: "comment" }
      ],
      categories: [{ category: "general", items: ["text", "email", "dropdown", "comment"] }]
    },
    propertyGrid: {
      definition: {
        generateOtherTab: false,
        classes: {
          question: { properties: ["name", "title", "isRequired", { name: "visibleIf", tab: "logic" }],
                      tabs: [{ name: "logic", index: 100 }] },
          selectbase: { properties: [{ name: "choices", tab: "choices" }],
                        tabs: [{ name: "choices", index: 10 }] }
        }
      }
    },
    languages: { creator: "en", surveyLocales: ["en", "de"], useEnglishNames: true },
    options: { allowZoom: false },
    localization: { en: { qt: { comment: "Long answer" } } }
  }
};
```

`toolbox.definition` names either a built-in toolbox item (a question type) or a new item
defined by its `json`. `propertyGrid.definition.classes` is keyed by survey-core class name and
merges down the class hierarchy (`question` → `selectbase` → `checkbox`).

## Applying

```js
import { SurveyCreatorModel, UIPreset } from "survey-creator-core";

const creator = new SurveyCreatorModel(creatorOptions);
new UIPreset(hrPreset).applyTo(creator);
```

`UIPreset` accepts the `{ name, json }` wrapper or the bare `json` object. `applyTo(creator)` is
the public entry point
([Apply a UI Preset](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#apply-a-ui-preset),
[`UIPreset` API](https://surveyjs.io/survey-creator/documentation/api-reference/uipreset)).
Apply right after construction, before rendering; re-apply another preset at any time to switch.

Predefined presets: `import { Basic, Advanced, Expert } from "survey-creator-core/ui-presets"`,
then `new UIPreset(Basic).applyTo(creator)`. To offer them (or your own) as choices inside the
Creator, call `registerUIPreset(...)` **before** constructing the Creator; see
`references/predefined-presets.md`.

## Read this first: corrections

| Never write | Write instead |
| :-- | :-- |
| `import { Basic } from "survey-creator-core"` | `from "survey-creator-core/ui-presets"` |
| `import { UIPresetEditor } from "survey-creator-core"` | `from "survey-creator-core/ui-preset-editor"` |
| `creator-presets-core` package | Nothing to install — presets are inside `survey-creator-core` v3 |
| `options: { showLogicTab: false }` to hide a tab | `tabs: { items: [...] }` listing the tabs to keep |
| `options: { saveSurveyFunc: ... }` or any function | Functions and event handlers stay in code; a preset is JSON |
| `autoGenerateProperties: false` in `propertyGrid.definition` | Drop it; v3.0.x never reads it. Listing `classes` already restricts the grid, and `generateOtherTab` controls unlisted properties |
| `registerUIPreset()` after `new SurveyCreatorModel()` | Register first — the preset selector in Creator Settings is built during construction |
| Preset applied, then `creator.toolbox.removeItem()` | Put the change in the preset; the next `applyTo()` rebuilds the toolbox |
| `preset.apply(creator)` | `preset.applyTo(creator)` — `apply` is internal and skips `activePresetName` |
| `toolbox.definition` with custom items and no `categories` | Add `categories` (or `categories: []` for one flat list); auto-derived categories only know built-in items |

## Routing

| Task | Read |
| :-- | :-- |
| Every section, every key, and what each one resets | `references/preset-json.md` |
| Basic / Advanced / Expert: contents, importing, extending, registering | `references/predefined-presets.md` |
| The no-code editor, saving and loading presets, the settings dropdown | `references/preset-editor.md` |
| Worked examples: per-tenant, role-based, custom items, relabeling | `references/recipes.md` |

## Official docs and demos

Every surveyjs.io page below is also available as Markdown by appending `.md` to its URL
(for a demo, `<demo-url>documentation.md`). Fetch these before answering from memory.

| Topic | Official page |
| :-- | :-- |
| The guide | [UI Preset Editor](https://surveyjs.io/survey-creator/documentation/ui-preset-editor) |
| What a preset configures | [Create a Custom Preset](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#create-a-custom-preset) |
| Applying | [Apply a UI Preset](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#apply-a-ui-preset) · [`UIPreset`](https://surveyjs.io/survey-creator/documentation/api-reference/uipreset) · [`IPreset`](https://surveyjs.io/survey-creator/documentation/api-reference/ipreset) |
| Predefined presets | [Predefined UI Presets](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#predefined-ui-presets) · [Register Predefined Presets](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#register-predefined-presets) |
| Themes and Translations tabs | [Configure Themes and Translations](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#configure-themes-and-translations) |
| The no-code editor | [Enable the UI Preset Editor](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#enable-the-ui-preset-editor) · [`UIPresetEditor`](https://surveyjs.io/survey-creator/documentation/api-reference/uipreseteditor) |
| Persisting presets | [Save and Load Custom Presets](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#save-and-load-custom-presets) |
| Demos | [UI Preset Editor](https://surveyjs.io/survey-creator/examples/ui-preset-editor/) · [Basic](https://surveyjs.io/survey-creator/examples/basic-ui-preset/) · [Advanced](https://surveyjs.io/survey-creator/examples/advanced-ui-preset/) · [Expert](https://surveyjs.io/survey-creator/examples/expert-ui-preset/) |
| Toolbox and property grid concepts behind the sections | [Toolbox Customization](https://surveyjs.io/survey-creator/documentation/toolbox-customization) · [Property Grid Customization](https://surveyjs.io/survey-creator/documentation/property-grid-customization) |

The package ships no generated authoring guide for presets, and the guide does not spell out
every JSON key. For a key name the docs are silent on, read the shipped `Basic`/`Advanced`
presets (`src/ui-presets/`) or `src/ui-presets-creator/` in the
[survey-creator](https://github.com/surveyjs/survey-creator) repository rather than guessing.

## Before you finish

- [ ] Installed `survey-creator-core` is v3.0.0 or later
- [ ] The preset is complete for every section the customer cares about — nothing relies on
      "leave the default", except the property grid when `propertyGrid` is omitted on purpose
- [ ] Every `tabs.items[].name` is one of `designer`, `preview`, `theme`, `logic`, `json`,
      `translation`; the `theme` and `translation` tabs have their registrations in place
- [ ] Custom toolbox items carry a `json` with a `type`, and every item appears in a category
- [ ] Property grid `classes` keys are survey-core class names; `tab` values match a declared tab
- [ ] `options` holds only JSON values that are settable Creator properties
- [ ] No imperative toolbox or property grid code runs after `applyTo()`
- [ ] `registerUIPreset()`, if used, runs before the Creator is constructed
- [ ] The answer states that Survey Creator is commercial and the UI Preset Editor is PRO/Enterprise
