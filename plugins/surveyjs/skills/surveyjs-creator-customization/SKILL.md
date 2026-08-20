---
name: surveyjs-creator-customization
description: >
  Embed and customize SurveyJS Survey Creator (the drag-and-drop form builder) in React,
  Angular, Vue, or vanilla JS — installing survey-creator-core and the renderer, rendering the
  designer, saving the survey JSON back to your API, configuring the toolbox and property grid,
  handling creator events, applying UI presets per project, and theming the builder chrome.
  Use when adding a form builder to an admin app, when the builder needs to look or behave
  differently per customer, or when creator code stops working after an upgrade.
---

# SurveyJS Survey Creator

The drag-and-drop builder that produces survey JSON. It edits the same JSON the Form Library
renders — Creator is an authoring surface on top of it, not a separate format.

Not this skill:

- Rendering a finished form for respondents → `surveyjs-integration`
- The survey JSON itself — question types, validators, expressions → `surveyjs-form-json`
- Styling the *form* → theming. Styling the *builder* is here, and they are different systems.

## Survey Creator is commercial

The Form Library is MIT. **Survey Creator is not.** Any answer that embeds the builder should
say so rather than leaving a licensing surprise for later.

Activating a license is `setLicenseKey(key)`. The old `haveCommercialLicense` property was
dropped in v1.9.101 and now only logs a warning — setting it does nothing. The key and its
placement are documented at <https://surveyjs.io/remove-alert-banner>; check there rather than
guessing an import path, and never invent a key.

Without a key the builder still runs, with a banner. Do not add code that hides the banner.

## Packages

Install **only** the renderer — `survey-creator-core` arrives as its dependency. The Form
Library packages come too, because the designer surface renders a live survey.

| Framework | Install | Render with |
| :-- | :-- | :-- |
| React | `survey-creator-react` | `<SurveyCreatorComponent creator={creator} />` |
| Angular | `survey-creator-angular` | `<survey-creator [model]="creatorModel">` |
| Vue 3 | `survey-creator-vue` | `<SurveyCreatorComponent :model="creator" />` |
| Vanilla JS | `survey-creator-js` | `renderSurveyCreator(creator, element)` |

Two stylesheets, both required, imported once:

```js
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
```

**The React prop is `creator`; Angular and Vue use `model`.** They are not interchangeable, and
this is the most common copy-paste failure when porting a snippet between frameworks.

The model class is `SurveyCreatorModel` from `survey-creator-core`. `survey-creator-react`
re-exports it as `SurveyCreator`; both names construct the same thing.

## Read this first: corrections

Creator's API was renamed wholesale on a `<subject><Verb>` convention, and **every old name
still resolves through an alias**. Nothing throws, so stale code and stale answers look fine
until someone reads them.

| Never write | Write instead |
| :-- | :-- |
| `survey-creator` (the Knockout build) | `survey-creator-core` + a renderer package |
| `creator.render(element)` | The framework component, or `renderSurveyCreator()` |
| `isAutoSave` | `autoSaveEnabled` |
| `onShowingProperty` | `onPropertyShowing` |
| `onGetPropertyReadOnly` | `onPropertyGetReadOnly` |
| `onSelectedElementChanged` / `onSelectedElementChanging` | `onElementSelected` / `onElementSelecting` |
| `onDesignerSurveyCreated` / `onPreviewSurveyCreated` / `onPropertyGridSurveyCreated` | `onSurveyInstanceCreated` (branch on `options.area`) |
| `onDefineElementMenuItems` | `onElementGetActions` |
| `onGetObjectDisplayName` | `onElementGetDisplayName` |
| `makeNewViewActive(tab)` | `switchTab(tab)` |
| `showPropertyGrid` | `showSidebar` |
| `haveCommercialLicense` | `setLicenseKey(key)` |

The full 38-entry map is in `references/renamed-api.md`. Check any creator API you did not
just read from the docs against it.

## Two theme systems, not one

The single fact most answers get wrong. The builder chrome and the form on the design surface
are styled independently:

| What | API | Namespace |
| :-- | :-- | :-- |
| Builder UI — toolbox, tabs, property grid | `creator.applyCreatorTheme(theme)` | creator theme |
| The form being designed, and what respondents see | the survey theme, as in `survey.applyTheme()` | survey theme |

They take different objects. Passing one to the other does nothing useful. See
`references/theming.md`.

## Routing

| Task | Read |
| :-- | :-- |
| Install, render, save JSON back to an API | `references/setup.md` |
| An API name that may have moved | `references/renamed-api.md` |
| Toolbox contents, property grid, custom properties | `references/customization.md` |
| Different toolbox/tabs/properties per customer | `references/ui-presets.md` |
| Styling the builder, or the design surface | `references/theming.md` |

## Fetching current docs

Every page on surveyjs.io is available as Markdown by appending `.md`:

- `https://surveyjs.io/survey-creator/documentation/<page>.md`
- Get started, per framework — `get-started-react`, `get-started-angular`, `get-started-vue`,
  `get-started-html-css-javascript`
- API reference — `https://surveyjs.io/survey-creator/documentation/api-reference/survey-creator`

Unlike `survey-core`, the Creator packages ship **no** generated authoring guide or JSON schema,
so there is no version-exact artifact on disk to read. When a detail matters, fetch the doc.

Escalation order when stuck: reference file → official `.md` doc →
[howtos-and-troubleshooting](https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting)
→ [llms.txt](https://surveyjs.io/llms.txt) for orientation. Check that repository's
`design-time` and `custom-question-types` categories early — they carry design-surface recipes
the docs do not cover, such as property grid editors and their validation, question adorner
actions, in-place editing, restricting designer operations on a question, and the translation
tab. Prefer them over blog posts and Stack Overflow answers.

## Before you finish

- [ ] Only the renderer package installed; `survey-creator-core` left implicit
- [ ] Both stylesheets imported, exactly once
- [ ] Correct prop for the framework — `creator` in React, `model` in Angular and Vue
- [ ] No API from the corrections table above
- [ ] Saving goes through `saveSurveyFunc`, and calls the callback with the save status
- [ ] The answer states that Survey Creator is a commercial product
- [ ] No code that suppresses the unlicensed banner
