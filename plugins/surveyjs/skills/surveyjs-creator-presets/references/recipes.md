# Recipes — from a requirement to a preset

Each recipe is a complete preset (or the relevant sections of one). Merge the sections you
need, remembering that an absent section resets to defaults.

The recipes build on the official
[UI Preset Editor](https://surveyjs.io/survey-creator/documentation/ui-preset-editor) guide and
its demos ([UI Preset Editor](https://surveyjs.io/survey-creator/examples/ui-preset-editor/),
[Basic](https://surveyjs.io/survey-creator/examples/basic-ui-preset/),
[Advanced](https://surveyjs.io/survey-creator/examples/advanced-ui-preset/),
[Expert](https://surveyjs.io/survey-creator/examples/expert-ui-preset/)). Where a recipe goes
beyond what the guide shows, the linked section is the fact to check first.

## 1. "Non-technical authors: only simple fields, no logic, no JSON"

```js
export const simpleAuthor = {
  name: "simple-author",
  json: {
    tabs: { items: [{ name: "designer" }, { name: "preview" }], activeTab: "designer" },
    toolbox: {
      definition: [
        { name: "text", subitems: [] },
        { name: "comment" },
        { name: "radiogroup" },
        { name: "checkbox" },
        { name: "dropdown" },
        { name: "boolean" },
        { name: "rating" }
      ],
      categories: []                                   // one flat list
    },
    propertyGrid: {
      definition: {
        generateOtherTab: false,
        classes: {
          survey:     { properties: ["title", "description"] },
          panelbase:  { properties: ["title", "description"] },
          question:   { properties: ["title", "description", "isRequired"] },
          selectbase: { properties: [{ name: "choices", tab: "choices" }],
                        tabs: [{ name: "choices", index: 10 }] },
          rating:     { properties: ["rateMin", "rateMax"] },
          comment:    { properties: ["maxLength"] }
        }
      }
    },
    options: { allowZoom: false, showSurveyTitle: true, allowModifyPages: false }
  }
};
```

`name` is hidden from the grid on purpose; the Creator still generates unique names. Remove
`allowModifyPages` if the customer wants multi-page forms.

## 2. "Custom field types with our own labels and defaults"

Promote configured variants to first-class toolbox items. Each custom item needs a `json` with
a `type`; anything else in the `json` becomes the default for new elements.

```js
toolbox: {
  definition: [
    { name: "employee-id", title: "Employee ID", iconName: "icon-toolbox-singleline-24x24",
      json: { type: "text", maskType: "pattern", maskSettings: { pattern: "EMP-99999" }, isRequired: true } },
    { name: "start-date", title: "Start date", iconName: "icon-toolbox-calendar-24x24",
      json: { type: "text", inputType: "date" } },
    { name: "manager", title: "Manager", iconName: "icon-toolbox-dropdown-24x24",
      json: { type: "dropdown", choicesByUrl: { url: "/api/managers", valueName: "id", titleName: "name" } } },
    { name: "yes-no", title: "Yes / No", json: { type: "radiogroup", choices: ["Yes", "No"] } },
    { name: "comment" }
  ],
  categories: [
    { category: "hr", title: "HR fields", items: ["employee-id", "start-date", "manager"] },
    { category: "general", items: ["yes-no", "comment"] }
  ],
  showCategoryTitles: true
}
```

Icon names come from the Creator's SVG registry, and an unknown name renders empty, so reuse
an existing one. Built-in items use `icon-<type>` (`icon-text`, `icon-dropdown`, …). The
toolbox also ships a 24x24 set named `icon-toolbox-<name>-24x24` with these names: boolean,
calendar, checkbox, customquestion, dropdown, dynamicmatrix, dynamicpanel, email, expression,
file, html, image, imagepicker, longtext, matrix, multimatrix, multipletext, panel, phone,
radiogroup, ranking, rating, signature, singleline, slider, tagbox. The shipped `Basic` preset
uses `calendar`, `email`, and `phone` from that set.

## 3. "Same builder, different tenants"

Keep one preset per tenant in your database, choose at request time, apply before render
([Apply a UI Preset](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#apply-a-ui-preset);
the demo's `documentation.md` has the Angular, Vue, jQuery, and vanilla JS variants).

```js
// React
import { useMemo } from "react";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { UIPreset } from "survey-creator-core";

export function TenantBuilder({ preset }) {            // preset: { name, json } fetched by the page
  const creator = useMemo(() => {
    const c = new SurveyCreator({ autoSaveEnabled: true });
    new UIPreset(preset).applyTo(c);
    return c;
  }, [preset]);
  return <SurveyCreatorComponent creator={creator} />;
}
```

Angular and Vue are the same two lines inside the component that owns the model; only the
template binding differs (`[model]` / `:model`). Construct the Creator once per preset — do not
rebuild it on every render — and apply inside the same synchronous block so the first paint is
already configured.

Two tenants on one page (rare) share `localization` and `languages.surveyLocales`, because
those are process-wide; give each its own page or accept that the last applied wins.

## 4. "Switch presets by role at runtime"

```js
import { registerUIPreset, UIPreset, CreatorPresets } from "survey-creator-core";
import { Basic, Expert } from "survey-creator-core/ui-presets";

registerUIPreset(Basic, Expert, reviewerPreset);       // before new SurveyCreatorModel()
const creator = new SurveyCreatorModel(options);

function applyRole(role) {
  const name = role === "admin" ? "expert" : role === "reviewer" ? "reviewer" : "basic";
  new UIPreset(CreatorPresets[name]).applyTo(creator);  // keeps the settings dropdown in sync
}
```

Registration is documented in
[Register Predefined Presets](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#register-predefined-presets).
Because every apply resets tabs, toolbox, and localization, switching back and forth is clean.
Only `options` keys accumulate: if `reviewerPreset` sets `allowZoom: false`, give the other
presets `allowZoom: true` explicitly.

## 5. "Rename things without touching the JSON schema"

Renaming a question type in the toolbox does not change the produced survey JSON — a
`comment` is still `type: "comment"`. Use `localization` so the rename follows the UI language:

```js
localization: {
  en: {
    tabs: { designer: "Build", preview: "Try it" },
    qt: { comment: "Long answer", text: "Short answer", radiogroup: "Single choice" },
    toolboxCategories: { general: "Fields" },
    pe: { isRequired: "Mandatory", title: "Label", tabs: { logic: "Rules" } }
  },
  de: {
    tabs: { designer: "Erstellen", preview: "Testen" },
    qt: { comment: "Langtext" }
  }
}
```

For a single-language builder, `definition[].title` on a toolbox item does the same for that
item only.

## 6. "Multilingual forms, German builder"

```js
languages: { creator: "de", surveyLocales: ["de", "en", "fr"], useEnglishNames: false },
tabs: { items: [{ name: "designer" }, { name: "preview" }, { name: "translation" }] }
```

plus, in code, the dictionaries the preset assumes:

```js
import "survey-core/i18n/german";
import "survey-core/i18n/french";
import "survey-creator-core/i18n/german";
```

Without the Creator dictionary `creator.locale = "de"` falls back to English strings; without
the survey dictionaries the Translations tab has nothing to offer for those locales. The
official setup is
[Translations Tab](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#translations-tab).

## 7. "Show only these properties for one question type"

Class-level definitions merge, so restrict at the level that matches the requirement:

```js
propertyGrid: {
  definition: {
    classes: {
      question: { properties: ["name", "title", "isRequired", { name: "visibleIf", tab: "logic" }],
                  tabs: [{ name: "logic", index: 200 }] },
      file:     { properties: ["acceptedTypes", "maxSize", "allowMultiple"] },   // adds to question's list for file questions
      signaturepad: { properties: [] }                                          // nothing beyond the question-level list
    }
  }
}
```

An empty `properties` array is a valid way to say "inherit only". A missing class key means
the same thing — the class simply contributes nothing.

## 8. "Bring the property grid back to default but keep my toolbox"

```js
json: {
  toolbox: { /* as before */ },
  tabs: { /* as before */ },
  propertyGrid: { definition: null }
}
```

`null` restores the stock grid explicitly. Omitting `propertyGrid` would keep whatever an
earlier preset set, which is the one place a preset behaves like a patch.
