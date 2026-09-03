# Preset JSON — every section

Official sources: the five configuration categories are introduced in
[Create a Custom Preset](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#create-a-custom-preset);
the wrapper object is the [`IPreset`](https://surveyjs.io/survey-creator/documentation/api-reference/ipreset)
interface; the toolbox and property grid sections express the same concepts as
[Toolbox Customization](https://surveyjs.io/survey-creator/documentation/toolbox-customization)
and [Property Grid Customization](https://surveyjs.io/survey-creator/documentation/property-grid-customization).
The shipped [Basic](https://surveyjs.io/survey-creator/examples/basic-ui-preset/) and
[Advanced](https://surveyjs.io/survey-creator/examples/advanced-ui-preset/) presets are the
canonical worked examples of the JSON.

The shape is `ICreatorPresetData` in `survey-creator-core` (v3.0.x). `UIPreset` accepts either
the bare object below or an `IPreset` wrapper `{ name, visible?, json }`. `name` is what
`registerUIPreset` and the UI Preset Editor key on, and what `applyTo()` records on
`creator.activePresetName`; `visible` only controls whether the editor's preset list shows it.

```ts
interface ICreatorPresetData {
  languages?:    { creator?: string; surveyLocales?: string[]; useEnglishNames?: boolean };
  tabs?:         { items?: Array<{ name: string; iconName?: string }>; activeTab?: string };
  toolbox?:      { definition?: ToolboxItem[]; categories?: Category[]; showCategoryTitles?: boolean };
  propertyGrid?: { definition?: PropertyGridDefinition | null };
  options?:      { [creatorProperty: string]: any };
  localization?: { [locale: string]: PartialCreatorStrings };
}
```

Sections are applied in this order: languages, tabs, toolbox, property grid, options, then
localization. Order matters only for `options` — a key there overrides what an earlier section
set, but it does not protect anything from the next `applyTo()`.

## Reset semantics, section by section

Every section object is applied even when the key is missing; a missing key becomes `{}` and
`{}` means "defaults". So a preset is a full description. The table in `SKILL.md` summarizes
this; the exact behaviour is:

| Key missing | What happens |
| :-- | :-- |
| `languages` | `creator.locale = ""`, `surveyLocalization.supportedLocales = []`, `useEnglishNames = false` |
| `tabs` | Tabs rebuilt from `creator.initialTabs()`, i.e. the `showXxxTab` options; active tab unchanged |
| `toolbox` | Default toolbox: all items, default categories, `showCategoryTitles` falsy |
| `propertyGrid` | **Not applied** — the grid keeps whatever definition it had |
| `options` | Nothing assigned — values set by an earlier preset survive |
| `localization` | `editorLocalization.presetStrings` cleared |

Two of these are global rather than per-Creator: `surveyLocalization.supportedLocales` and
`useEnglishNames` live in `survey-core`, and `presetStrings` lives in `survey-creator-core`.
Two Creators on one page share them; the last preset applied wins.

## `tabs`

```json
{ "tabs": { "items": [{ "name": "designer", "iconName": "icon-config" }, { "name": "preview" }],
            "activeTab": "designer" } }
```

- Valid names: `designer`, `preview`, `theme`, `logic`, `json`, `translation`. Unknown names are
  skipped silently. An empty `items` array is ignored and the default tab set stays.
- Order in `items` is the order on screen.
- Listing a tab shows it **regardless** of `showThemeTab`, `showTranslationTab`, or
  `showJSONEditorTab` options — the preset replaces that logic. Omitting a tab hides it.
- `activeTab` must be one of the listed tabs; otherwise the first item becomes active.
- `iconName` swaps the tab icon (any registered SVG icon name). Tab titles are not set here;
  use `localization.<locale>.tabs.<name>`.
- Hiding `designer` also hides the property grid sidebar and the settings button, because
  those belong to the designer tab.
- `theme` needs `registerSurveyTheme(SurveyTheme)` with `SurveyTheme` from
  `survey-core/themes`; `translation` needs survey-core i18n dictionaries
  (`import "survey-core/survey.i18n"` or individual `survey-core/i18n/<lang>`). Presets do not
  import anything for you. The official setup for both is
  [Configure Themes and Translations](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#configure-themes-and-translations).
- The UI Preset Editor's own hidden `presets` tab survives any preset.

## `toolbox`

```json
{
  "toolbox": {
    "definition": [
      { "name": "radiogroup" },
      { "name": "text", "subitems": [] },
      { "name": "email", "title": "Email", "tooltip": "Email address",
        "iconName": "icon-toolbox-email-24x24",
        "json": { "type": "text", "inputType": "email", "placeholder": "name@example.com" } },
      { "name": "radiogroup", "json": { "type": "radiogroup", "choices": ["Yes", "No"] } }
    ],
    "categories": [
      { "category": "general", "title": "Fields", "items": ["text", "email"] },
      { "category": "choice",  "items": ["radiogroup"] }
    ],
    "showCategoryTitles": true
  }
}
```

**`definition`** is the list of items the toolbox offers. Each entry:

| Key | Meaning |
| :-- | :-- |
| `name` | A built-in item name (the question type: `text`, `checkbox`, `matrixdynamic`, `panel`, …) or a new name for a custom item |
| `json` | The element JSON dropped onto the design surface. Required for custom items; must include `type`. On a built-in item it overrides the default JSON (the last example makes every new radiogroup start with Yes/No) |
| `title`, `tooltip`, `iconName` | Display overrides. Titles here are not localized — for multi-language builders prefer `localization.<locale>.qt.<name>` |
| `subitems` | `[]` removes the built-in variants (the text item's input-type menu, the rating item's variants); a non-empty array replaces them with items of the same shape |

When `definition` is present, items not in it do not appear. A definition made only of
built-in names can omit `categories`; the default categories are filtered down to those
names. **Custom items must be placed by `categories`**, because the auto-derived categories only
know built-in items.

**`categories`** groups items. Built-in category ids and their English titles are `general`
(General), `choice` (Choice Questions), `text` (Text Input Questions), `containers`
(Containers), `matrix` (Matrix Questions), and `misc` (Misc). A new id needs a `title`, or a
string under `localization.<locale>.toolboxCategories.<id>`. Items are names or
`{ name, title }`. `categories: []` collapses everything into one `general` category with every
item from `definition` (or every default item when there is no `definition`).

`showCategoryTitles` defaults to `false`; without it categories are separated by a divider and
cannot be collapsed. The compact toolbox never shows categories.

## `propertyGrid`

```json
{
  "propertyGrid": {
    "definition": {
      "generateOtherTab": false,
      "classes": {
        "question": {
          "properties": ["name", "title", "description", "isRequired",
                         { "name": "visibleIf", "tab": "logic", "index": 100 },
                         { "name": "validators", "tab": "validation" }],
          "tabs": [{ "name": "logic", "index": 200 }, { "name": "validation", "index": 400 }]
        },
        "selectbase": {
          "properties": [{ "name": "choices", "tab": "choices" }, { "name": "showOtherItem", "tab": "choices" }],
          "tabs": [{ "name": "choices", "index": 10 }]
        },
        "checkbox": { "properties": [{ "name": "showSelectAllItem", "tab": "choices" }] },
        "survey":   { "properties": ["title", "description", { "name": "showProgressBar", "tab": "navigation" }],
                      "tabs": [{ "name": "navigation", "index": 100 }] },
        "panelbase": { "properties": ["name", "title"] },
        "itemvalue[]@choices": { "properties": ["visibleIf"], "tabs": [{ "name": "general" }] }
      }
    }
  }
}
```

- `definition` is the same object `creator.setPropertyGridDefinition()` takes. `null` restores
  the stock grid (that is all the `Expert` preset does).
- `classes` keys are survey-core class names. Definitions merge down the inheritance chain, so
  `question` applies to every question, `selectbase` to checkbox/radiogroup/dropdown/tagbox/
  ranking/imagepicker, `matrixdropdownbase` to `matrixdropdown` and `matrixdynamic`, `panelbase`
  to `panel` and `page`. Keys of the form `itemvalue[]@choices`, `itemvalue[]@rows`,
  `choiceitem[]@choices`, `imageitemvalue[]@choices` configure the popup editors for array
  items.
- A property is a name (lands in the `general` tab) or `{ name, tab?, index?, title? }`.
- `tabs` declares the tab a property points at: `{ name, index?, title?, visible?, iconName?,
  parent? }`. `index` orders tabs. `general` is implicit with index `-1`, so it comes first
  unless you list it with a larger index (`{ "name": "general", "index": 30 }` after a
  `logic` tab at `10` puts Logic first). Listing `general` is also how to give it an icon. A
  property whose `tab` is not declared still creates that tab, unindexed.
- Properties not listed anywhere are hidden — unless `generateOtherTab: true`, which collects
  them into an `Other` tab. The shipped Basic and Advanced presets also carry
  `autoGenerateProperties: false`; v3.0.x never reads that flag, so leave it out.
- Property titles come from `localization.<locale>.pe.<propertyName>`; tab titles from
  `localization.<locale>.pe.tabs.<tabName>`; a `title` on the entry is an unlocalized override.
- Property grid definitions are static: they do not depend on the selected element's values.
  Dynamic hiding (`onPropertyShowing`) is code, not preset, and it is fine to combine the two
  because `applyTo()` does not touch event handlers.

## `languages`

```json
{ "languages": { "creator": "de", "surveyLocales": ["en", "de", "fr"], "useEnglishNames": true } }
```

- `creator` sets `creator.locale`, the language of the builder UI. The dictionary must be
  loaded: `import "survey-creator-core/survey-creator-core.i18n"` (all) or
  `survey-creator-core/i18n/<language>`. `""` means English.
- `surveyLocales` becomes `surveyLocalization.supportedLocales` — the locales offered in the
  Translations tab and the survey `locale` dropdown. Empty means "every loaded locale".
- `useEnglishNames: true` lists locales as "German" rather than "Deutsch".

## `options`

```json
{ "options": { "allowZoom": false, "pageEditMode": "single", "showSurveyTitle": false,
               "maxNestedPanels": 0, "expandCollapseButtonVisibility": "never" } }
```

Each key is assigned as `creator[key] = value`, nothing more. That means:

- Only runtime-settable properties of `SurveyCreatorModel` work. Most `ICreatorOptions` also
  exist as properties (`allowModifyPages`, `showSidebar`, `previewOrientation`,
  `showSurveyTitle`, `questionTypes`, …). Constructor-only options — anything the Creator reads
  once in its constructor — do not.
- Tab visibility belongs in `tabs`, not here.
- Values must be JSON: no functions, no event subscriptions, no class instances. `saveSurveyFunc`,
  `onPropertyShowing`, and friends stay in code.
- Keys are never "un-set": a later preset without the key leaves the value in place. Put the
  default back explicitly (`"allowZoom": true`) when a preset must undo another.

## `localization`

```json
{
  "localization": {
    "en": { "tabs": { "designer": "Build" }, "qt": { "comment": "Long answer" },
            "toolboxCategories": { "general": "Fields" }, "pe": { "isRequired": "Mandatory" } },
    "de": { "tabs": { "designer": "Erstellen" } }
  }
}
```

Keyed by locale, each value a partial copy of the survey-creator-core dictionary. Lookup order
is preset strings for the current locale → the locale's dictionary → English. Useful groups:

| Group | Strings for |
| :-- | :-- |
| `tabs` | Tab titles (`designer`, `preview`, `theme`, `logic`, `json`, `translation`) |
| `qt` | Question type names, which are also the toolbox item titles |
| `toolboxCategories` | Category titles |
| `pe` | Property grid property titles; `pe.tabs.<tab>` for tab titles |
| `pehelp` | Property help texts |
| `pv` | Property value display names |
| `ed` | The rest of the editor UI (buttons, placeholders, messages) |

The override is global to the page (`editorLocalization.presetStrings`) and is replaced
wholesale by the next preset. Renaming a built-in toolbox item for one preset is cleaner here
than through `definition[].title`, because it follows the Creator's locale.
