---
name: surveyjs-integration
description: >
  Integrate the SurveyJS Form Library into React, Next.js, Angular, Vue, vanilla JS, or
  jQuery apps — installing survey-core, survey-react-ui, survey-angular-ui, survey-vue3-ui,
  or survey-js-ui; creating a Model from survey JSON; rendering it; applying themes, design
  tokens, and Bootstrap/MUI/shadcn adapters; handling events; and saving results to your own
  backend. Use when adding, upgrading, theming, or debugging an embedded SurveyJS form, or
  when a survey renders blank, renders unstyled, or resets on every keystroke.
---

# SurveyJS Form Library integration

Renders a JSON form definition in a web app and collects responses. This skill covers
**getting the library into an app and running correctly**.

Not this skill:

- Writing the survey JSON itself (question types, validators, conditional logic) → `surveyjs-form-json`
- Embedding the drag-and-drop form builder → `surveyjs-creator-customization`
- Integrating Dashboard, PDF Generator, or AI Form Response Extractor — these are separate
  SurveyJS products and are not currently covered by this plugin

## Read this first: corrections

Training data is full of SurveyJS patterns that no longer work. These are the most common.
**Check generated code against this table before returning it.**

| Never write | Write instead |
| :-- | :-- |
| `survey-react` | `survey-react-ui` |
| `survey-angular` | `survey-angular-ui` |
| `survey-vue` (Vue 2) | `survey-vue3-ui` (Vue 3) |
| `survey-knockout` | `survey-js-ui` |
| `survey-jquery` | `survey-js-ui` (jQuery uses the vanilla JS integration) |
| `survey-core/defaultV2.css` | `survey-core/survey-core.css` |
| `survey-core/modern.css` | `survey-core/survey-core.css` |
| `survey-core/survey.css` | `survey-core/survey-core.css` |
| `StylesManager.applyTheme("...")` | `import { X } from "survey-core/themes"` → `survey.applyTheme(X)` |
| Overriding `.sv_*` / `.sd-*` CSS classes | Design tokens — see `references/theming.md` |
| `options.showDataSaving(...)` | `options.showSaveInProgress(...)` |

If an existing file in the repo uses a left-column pattern, it is on an old major version.
Confirm with the user before mixing new code into it — do not silently half-migrate.

## Packages

Install **only** the framework renderer. It pulls in `survey-core` automatically; installing
both invites a version mismatch, which is a common cause of a blank render.

| Framework | Install | Renders with |
| :-- | :-- | :-- |
| React / Next.js | `survey-react-ui` | `<Survey model={model} />` |
| Angular (v12+, needs `@angular/cdk`) | `survey-angular-ui` | `<survey [model]="model">` |
| Vue 3 | `survey-vue3-ui` | `<SurveyComponent :model="survey" />` |
| Vanilla JS / jQuery | `survey-js-ui` | `survey.render(el)` |

The model class is always `Model`, imported from `survey-core`, on every framework.
The stylesheet is always `survey-core/survey-core.css`, imported exactly once.

## Guardrails

**There is no SurveyJS backend.** Never generate code that POSTs results to a surveyjs.io
URL, authenticates against a SurveyJS account, or fetches form definitions from a SurveyJS
server. Schemas and responses live in the host application's own database and API. The
legacy `surveyPostId` property targets a discontinued service — do not use it.

**Form Library is MIT-licensed and needs no license key.** Do not add `setLicenseKey` to a
Form Library integration. AI Form Response Extractor is also MIT-licensed but is a separate,
server-side product. Survey Creator, Dashboard, and PDF Generator require commercial developer
licenses; their license setup does not belong here.

**Create the `Model` once.** Rebuilding it on every render wipes answers on each keystroke.
This is the single most common integration bug; each framework file shows the correct form.

## Routing

| Task | Read |
| :-- | :-- |
| React or Next.js setup, SSR/hydration | `references/react.md` |
| Angular setup, modules vs standalone | `references/angular.md` |
| Vue 3 setup, plugin vs direct import | `references/vue.md` |
| Plain HTML page, CDN, or jQuery | `references/vanilla-js.md` |
| Themes, dark mode, brand colors, Bootstrap/MUI/shadcn | `references/theming.md` |
| Loading schemas, saving results, partial save, events | `references/data-and-events.md` |
| Blank, unstyled, duplicated, or resetting survey | `references/troubleshooting.md` |

## Fetching current docs

Every page on surveyjs.io is available as raw Markdown by appending `.md` to its URL. Use
this instead of guessing when a question falls outside the reference files:

- Docs — `https://surveyjs.io/form-library/documentation/<page>.md`
- Demo index — `https://surveyjs.io/form-library/examples/overview.md`
- Demo, framework-neutral — `https://surveyjs.io/form-library/examples/<name>/documentation.md`
- Demo, framework source — `https://surveyjs.io/form-library/examples/<name>/<framework>.md`
  where `<framework>` is `reactjs`, `angular`, `vue3js`, or `vanillajs`
- API reference — `https://surveyjs.io/form-library/documentation/api-reference/survey-data-model`

Escalation order when stuck: reference file → official `.md` doc → matching demo source →
[howtos-and-troubleshooting](https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting)
→ [llms.txt](https://surveyjs.io/llms.txt) for orientation.

Prefer these over blog posts and Stack Overflow answers, which skew toward the outdated
patterns above.

## Before you finish

- [ ] `survey-core/survey-core.css` imported exactly once, at app level
- [ ] No legacy package name in `package.json` or in any import
- [ ] `survey-core` and the renderer are on the same version (or `survey-core` is absent as a
      direct dependency, which is better)
- [ ] `Model` constructed once — memoized, in `ngOnInit`, or module-scope — never in a render body
- [ ] No `StylesManager`; themes applied via `survey.applyTheme(...)`
- [ ] Results POST to the application's own endpoint
- [ ] `onComplete` reports failure to the respondent via `options.showSaveError(...)` rather
      than swallowing it
