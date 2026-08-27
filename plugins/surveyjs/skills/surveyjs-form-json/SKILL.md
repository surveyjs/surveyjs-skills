---
name: surveyjs-form-json
description: >
  Author, edit, or debug SurveyJS survey/form JSON — question types, pages, panels, choices,
  validators, conditional visibility (visibleIf / enableIf), expressions, triggers, matrices,
  dynamic panels, localization, and quiz scoring. Use whenever writing or changing a survey
  JSON definition, when a property seems to be ignored, when survey JSON fails to load, or
  when you are unsure whether a question type or property name exists.
---

# SurveyJS survey JSON

The JSON schema that `survey-core` loads. Same JSON everywhere: the Form Library renders it,
Survey Creator edits it, the PDF generator exports it, the Dashboard reads results produced
from it.

Not this skill:

- Installing and rendering the library → `surveyjs-integration`
- Statically checking finished JSON for broken references, dead conditions, and cycles →
  `surveyjs-linter` (`survey-core/linter`)
- Embedding the drag-and-drop builder → `surveyjs-creator-customization`
- Themes, colors, fonts, spacing → theming. A **theme JSON is not survey JSON**: it is a
  separate object of `cssVariables` passed to `survey.applyTheme()`, and it never belongs
  inside the survey definition.

## Never author survey JSON from memory

The library ships its own authoring guide and JSON Schema, regenerated from the source on
every release. Read them. This is not a fallback for hard cases — it is the normal path.

Two reasons memory is the worst available source here:

1. **Property names moved between majors, and the old names still parse.** `hasOther`,
   `optionsCaption`, `goNextPageAutomatic`, `isAllRowRequired` and ~44 others are accepted
   silently as legacy aliases. Nothing throws, nothing warns, and the form works — so the
   mistake never surfaces until someone reads the JSON.
2. **Capabilities were added.** Question types that genuinely did not exist a version ago do
   now. Answering "SurveyJS can't do that, use a custom widget" is a common and confident
   failure.

## Step 1 — resolve the shipped artifacts

Both files sit in the installed package, so they describe **the version this project actually
runs**:

| File | What it is |
| :-- | :-- |
| `survey-core/llms/survey-json-authoring.md` | Authoring guide — every question type, its properties, defaults and examples |
| `survey-core/surveyjs_definition.json` | JSON Schema (draft-07) of the whole survey JSON — the authority on names |
| `survey-core/llms.txt` | Short orientation on the library |

`survey-core` is usually a *transitive* dependency, pulled in by `survey-react-ui` /
`survey-angular-ui` / `survey-vue3-ui` / `survey-js-ui`, so do not assume a top-level folder.
Resolve the package directory, then read the files from disk by path:

```bash
node -p "require('path').dirname(require.resolve('survey-core'))"   # package directory
npm ls survey-core                                                  # installed version
```

The package declares an `exports` map that does not list these files, so
`require("survey-core/surveyjs_definition.json")` and `require.resolve("survey-core/package.json")`
both fail. That blocks the module resolver only — reading the paths off disk works normally,
which is what you want here anyway.

If the package is not installed, or the guide is missing from it, fetch the same files from the
CDN — **always pinned to an exact version**, never to a floating tag:

```
https://cdn.jsdelivr.net/npm/survey-core@<version>/llms/survey-json-authoring.md
https://cdn.jsdelivr.net/npm/survey-core@<version>/surveyjs_definition.json
```

Take the version from `package.json`. When there is no `survey-core` to pin to, resolve the
latest version first and substitute it — do not fetch `survey-core@latest`:

```bash
curl -s https://registry.npmjs.org/survey-core/latest    # -> {"version":"X.Y.Z", ...}
```

A floating tag is cached by the CDN as an alias (`s-maxage=43200`), so for up to half a day after
a release it still serves the **previous** version. The guide would at least admit it, on its
line-3 stamp; `surveyjs_definition.json` carries no version anywhere, so a stale schema is
indistinguishable from a current one. Resolving first also gives you the version number this
skill requires you to report.

`unpkg.com/survey-core@<version>/...` serves byte-identical files if jsDelivr is unreachable.
`app.unpkg.com` does **not**: it is the file-browser UI, and returns an HTML page with the
content escaped inside it rather than the raw file.

## Step 2 — check the version stamp before trusting the guide

Line 3 of the guide reads `Generated from survey-core X.Y.Z`. Compare it with the installed
version. They must match: the guide embeds a schema URL pinned to **its own** version, so a
mismatched copy sends you to validate against a different release.

| Situation | What to do |
| :-- | :-- |
| Both files present, stamp matches | Use both. Normal case. |
| Stamp disagrees with the installed version | Distrust the local guide — it is stale build output. Fetch the pinned URL instead. |
| Guide missing (predates its release) | Fetch the pinned URL. On 404, use the latest guide for shape and idiom, but validate against the **local** `surveyjs_definition.json`, which is version-exact. |
| No `survey-core` in the project | Resolve the latest version, fetch it pinned, and tell the user which version you assumed. |

The schema is the authority on *what exists*; the guide is the teaching text explaining *how
to use it*. When they disagree, the local schema wins.

## Step 3 — follow the guide's Output rules, minus the envelope

The guide opens with an **Output rules** section. Apply all of its content rules:

- Only the `type` strings the guide lists. There are no others.
- Only property names listed for that type; never invent one, never carry one over from
  another type.
- Enum values exactly as written.
- Omit any property whose value equals the documented default.
- Every question needs a `name`, unique across the document — it is the key in the result data.
- An expression may only reference the `name` of a question that exists in the document.

Ignore one rule: the guide says to reply with *one JSON object and nothing else*, because it
is written for a JSON-generation endpoint. In an interactive session, write the JSON to the
file it belongs in and explain what changed.

**When editing existing JSON, edit it** — do not regenerate the form from the request. A
follow-up like "now make the rating required" means one property changes and everything else
survives byte-for-byte.

## Step 4 — validate before you hand it back

Either route is fine; the second catches more.

**Against the shipped schema** — plain draft-07, so any JSON Schema validator works, and it
rejects unknown properties, including every legacy alias.

**Against the library itself:**

```js
import { Model } from "survey-core";

const survey = new Model();
survey.fromJSON(json, { validatePropertyValues: true });
console.log(survey.jsonErrors);   // null or empty when the JSON is clean
```

The options object goes to `fromJSON`, **not** to the `Model` constructor — `new Model(json)`
loads without validating property values.

Neither route catches one thing: a `visibleIf` / `enableIf` / `defaultValueExpression` that
references a question name which does not exist. Expressions are not resolved against the
document at load time, so that JSON validates cleanly and silently misbehaves at runtime.
Check every expression's referenced names by hand.

## When the guide covers the properties but not the pattern

The shipped guide and schema are the authority on *what exists*. They do not show how to
compose several properties into a behaviour — a cut-off date on a date question, copying a
value between matrices, requiring every row of a multi-select matrix, validating a total across
dynamic panels, scoring a quiz without JavaScript.

For those, read
[howtos-and-troubleshooting](https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting) —
its `expressions-and-triggers`, `matrices`, `dynamic-panel`, `dropdowns-checkboxes-radiogroups`
and `quizzes-and-scored-surveys` categories are worked examples of exactly these compositions.
Take the shape of the solution from there, then still check every property name against the
installed guide and validate as in Step 4: the articles are community-maintained and not
pinned to this project's version.

For the built-in **Other** choice, read [references/built-in-other-choice.md](references/built-in-other-choice.md). It covers
the correct JSON, result shape, and when to use `storeOthersAsComment`.

## Before you finish

- [ ] The guide and schema you used came from the installed version, stamp checked
- [ ] Every `type` appears in the guide's Question types section
- [ ] No property invented, and none borrowed from a different question type
- [ ] No legacy alias — the guide lists them explicitly as "never emit"
- [ ] Validated, with no `jsonErrors`
- [ ] Every expression references a `name` that exists in this document
- [ ] Names are unique across the whole survey
- [ ] No theme, styling, or backend properties mixed into the survey definition
