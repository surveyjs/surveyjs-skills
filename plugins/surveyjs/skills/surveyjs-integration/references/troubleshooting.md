# Troubleshooting

Symptom-first. Check the cheap causes before reading the framework file.

## The survey renders, but is completely unstyled

Raw stacked inputs with no cards, spacing, or buttons: the stylesheet is missing or wrong.

1. Is `survey-core/survey-core.css` imported at all?
2. Is it one of the removed paths — `defaultV2.css`, `modern.css`, `survey.css`? All three
   were replaced by `survey-core.css`.
3. Angular: is it listed in `angular.json` → `styles`, *or* imported in a standalone
   component? Adding it to a lazily-loaded module's `styleUrls` scopes it away.
4. CDN: the file is `survey-core.min.css`, not `survey-core.css`.

## Nothing renders — blank container, no error

- **Version mismatch.** `survey-core` and the renderer must be the same version. This
  happens when both are direct dependencies and only one was upgraded. Check
  `npm ls survey-core`. The fix is usually to remove `survey-core` from `package.json`
  entirely and let the renderer bring it in.
- **Legacy package.** `survey-react`, `survey-vue`, `survey-angular`, `survey-knockout`, and
  `survey-jquery` are discontinued and will not render against a current `survey-core`.
- **Vanilla:** was `render()` called, and did the target element exist yet? Wrap in
  `DOMContentLoaded`.
- **Vanilla CDN:** both scripts must load, with `survey.core.min.js` before
  `survey-js-ui.min.js`.

## Answers disappear as the respondent types

The model is being reconstructed on every render. This is the most common integration bug.

- **React:** `new Model(json)` in the component body → wrap in `useMemo(..., [])`, or move to
  module scope. If the memo has `[surveyJson]` as its dependency and `surveyJson` is an object
  literal inside the component, the reference changes every render and the memo never holds —
  key on a stable id instead.
- **Angular:** the template binds a getter or method (`[model]="buildModel()"`) that runs on
  every change-detection pass → assign once in `ngOnInit`.
- **Vue:** the model is wrapped in `ref()` or `reactive()` → use the raw instance, or
  `shallowRef` if the reference must be swappable.

See the relevant framework reference file for the corrected shape.

## Results POST several times on one submit

`onComplete.add(...)` is running on every render, stacking subscribers. Register handlers
once — in React, inside the `useMemo` that creates the model; in Angular, in `ngOnInit`.
An inline arrow function is a new reference each render and will always duplicate.

## `document is not defined` at build time, or a hydration mismatch

Form Library v3 supports SSR. This error usually comes from application code or another
browser-only dependency, rather than from rendering a standard SurveyJS form.

- **Next.js:** mark the component that renders `<Survey>` with `"use client"`. Do not read
  `window`, `document`, `localStorage`, or other browser APIs while constructing the model;
  perform that work in an effect or event handler. Ensure the schema and initial data are the
  same on the server and client.
- **Custom questions or third-party widgets:** make their server rendering safe, or defer only
  that browser-dependent code until after mount.
- **Hydration mismatch:** avoid non-deterministic initial values such as `Date.now()`, random
  IDs, locale-dependent formatting, or data that differs between the server and client.

## Two surveys appear

The container already held a rendered survey when `render()` was called again — common on
SPA route changes. Clear it first:

```js
container.innerHTML = "";
survey.render(container);
```

## A license or trial banner appears

The Form Library is MIT-licensed and never shows one. A banner means Survey Creator,
Dashboard, or PDF Generator is also in the bundle — that is where the license key belongs.
See <https://surveyjs.io/remove-alert-banner>.

## Angular: `@angular/cdk` not found

`survey-angular-ui` depends on it and it is not always already present:

```bash
npm install @angular/cdk
```

Angular v12 is the minimum supported version.

## The theme does not apply

- `StylesManager.applyTheme()` is obsolete and silently does nothing. Import the theme
  object from `survey-core/themes` and call `survey.applyTheme(theme)`.
- A theme adapter (Bootstrap/MUI/shadcn) and a predefined theme conflict — `applyTheme`
  overwrites the adapter's tokens. Use one or the other.
- The adapter stylesheet must be imported *after* `survey-core.css`.

## Custom CSS stopped working after an upgrade

Overriding `.sd-*` / `.sv_*` class names is unsupported; those names change between
versions. Move the customization to design tokens — see `theming.md`.

## Still stuck

1. The matching demo's source: `https://surveyjs.io/form-library/examples/<name>/<framework>.md`
   where `<framework>` is `reactjs`, `angular`, `vue3js`, or `vanillajs`
2. <https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting> — problem/solution pairs
   for issues not covered in the docs
3. <https://surveyjs.io/stay-updated/release-notes> — if the behavior changed after an upgrade
4. <https://surveyjs.answerdesk.io/> — support forum
