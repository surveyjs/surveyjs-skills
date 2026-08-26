---
name: surveyjs-linter
description: >
  Statically analyze SurveyJS survey JSON for logic defects with the SurveyJS linter — the
  `survey-core/linter` entry point and its `lintSurvey`, `renderFindings`, and `getRules`
  functions. It catches broken `{question}` references in `visibleIf`/`enableIf`/expressions,
  typos in question and trigger target names, duplicate names, self-referencing conditions,
  calculated-value and trigger cycles, conditions compared against values that are not among a
  question's choices, value-type mismatches, dead `choicesFromQuestion` sources, unparseable
  expressions, and empty pages. Use after writing or editing survey JSON, before returning
  generated JSON to a user, when a `visibleIf` never fires or a question never appears, when
  wiring survey-JSON validation into a build, CI job, or form-builder save step, and when
  configuring rule severities, suppressions, `knownVariables`, `knownFunctions`, or custom
  component definitions for the linter.
---

# SurveyJS linter

`survey-core/linter` is a static analyzer for survey JSON. It reads the JSON as written and
reports logic defects that a survey only reveals at runtime — a `visibleIf` pointing at a
misspelled question, a trigger that sets the value it reacts to, a condition compared against a
choice that does not exist.

It ships **inside `survey-core` (v3.0.2 and later)** as a separate entry point, is MIT-licensed
like the Form Library itself, and is a pure function: it takes JSON, returns findings, and
mutates nothing.

**It never builds a survey model, and that is the point.** Deserializing survey JSON normalizes
it — unknown properties are dropped, an unrecognized `type` is replaced — which swallows exactly
the defects worth reporting. Loading the JSON into a `Model` and reading `survey.jsonErrors` is a
useful complement (it names unknown properties and types), not a substitute: a `visibleIf`
pointing at a question that does not exist loads without a single error.

Not this skill:

- Writing the survey JSON, question types, validators, expression syntax → `surveyjs-form-json`
- Rendering a survey in React/Angular/Vue/vanilla JS → `surveyjs-integration`
- Embedding the drag-and-drop builder → `surveyjs-creator-customization` (linting a builder's
  saved JSON belongs here; the builder's own UI does not)
- Charts and tables from responses → `surveyjs-dashboard`
- PDF export → `surveyjs-pdf-generator`
- Reading answers off scanned paper forms → `surveyjs-response-extractor`

## Read this first: corrections

The linter is newer than most training data, so the failure mode is invention — plausible
packages, CLIs, and option names that do not exist. **Check generated code against this table
before returning it.**

| Never write | Write instead |
| :-- | :-- |
| `npm install survey-linter` / `@surveyjs/linter` / any separate package | Nothing to install. It is an entry point of `survey-core`: `import { lintSurvey } from "survey-core/linter"` (needs `survey-core@>=3.0.2`) |
| `import { lintSurvey } from "survey-core"` | The linter is **not** on the main entry: import from `"survey-core/linter"` |
| `npx survey-lint schema.json`, an ESLint plugin, a webpack loader | No CLI or plugin ships. Write a small Node script — see [references/workflows.md](references/workflows.md) |
| `new SurveyModel(json)` plus `survey.jsonErrors` as the whole schema check | The two are complementary. `jsonErrors` reports unknown properties and types at load time; only `lintSurvey(json)` — on the raw object — reports broken references, dead conditions, and cycles, which load without complaint |
| `survey.validate()` as a schema check | `validate()` checks a respondent's **answers** at runtime. It says nothing about the schema |
| `lintSurvey(jsonString)` or `lintSurvey(null)` | Throws `TypeError`. Pass a parsed, non-array **object**: `lintSurvey(JSON.parse(text))` |
| `lintSurvey(json, { severity: "error" })`, `{ ignore: [...] }`, `{ disableRules: [...] }` | `{ rules: { "reference/unknown": "off" } }` and `{ suppress: [{ ruleId, elementName, path }] }` |
| `finding.rule`, `finding.line`, `finding.column` | `finding.ruleId` and `finding.path` (a JSON path such as `pages[0].elements[1].visibleIf`). There are no line numbers — the input is an object, not text |
| `lintSurvey(json, { functions: [...] })`, or registering a custom function or component *after* the call | The linter reads the live `survey-core` registries, so `FunctionFactory.Instance` / `Serializer` / `ComponentCollection` must be set up **first**. Linting outside the app's process instead? Declare them with `options.knownFunctions`, `options.knownVariables`, `options.components` |
| Reporting only `errorCount` and calling a survey clean | A `warning` is usually a condition that evaluates but can never hold — a `visibleIf` that never fires. Read them |
| `if (result.errors.length)` | The array is `result.findings`; the counts are `errorCount` / `warningCount` / `infoCount` / `suppressedCount` |

## Import

```js
// ESM (bundler, Node ESM)
import { lintSurvey, renderFindings, getRules } from "survey-core/linter";

// CommonJS
const { lintSurvey, renderFindings, getRules } = require("survey-core/linter");
```

A UMD build is also published: it exposes the global `SurveyLinter` and expects the `Survey`
global (survey-core) to be loaded first. Import `survey-core` itself from the **same copy** the
application uses — the linter reads the live `settings`, `Serializer`, and
`FunctionFactory.Instance` through that shared closure, so two copies of survey-core in one
bundle make the analysis wrong.

## Quick start

```js
import { lintSurvey, renderFindings } from "survey-core/linter";

const result = lintSurvey({
  pages: [{
    name: "page1",
    elements: [
      { type: "radiogroup", name: "hasInsurance", choices: ["yes", "no"] },
      { type: "text", name: "provider", visibleIf: "{hasInsurnce} = 'yes'" }
    ]
  }]
});

if (result.errorCount > 0) console.log(renderFindings(result));
```

`renderFindings` produces a plain-text report — the format below is the actual output of the
snippet above:

```
ERROR  reference/unknown
  "hasInsurnce" is not found - no question, panel, page, calculated value, or variable with that name exists. Did you mean "hasInsurance"? (in "{hasInsurnce} = 'yes'")

  visibleIf: {hasInsurnce} = 'yes'
  at pages[0].elements[1].visibleIf

  No case: the reference cannot be evaluated.

1 error, 0 warnings, 0 info
```

Findings are also available structurally in `result.findings`; each carries `ruleId`, `severity`,
`message`, `path`, and often `suggestion`, `related`, and a `reproduction` (concrete steps that
demonstrate the defect). See [references/api.md](references/api.md) for the full shape.

## Rules

Fourteen rules, all on by default. `getRules()` returns this list at runtime.

| Rule id | Default | Catches |
| :-- | :-- | :-- |
| `expression/syntax` | error | An expression that cannot be parsed |
| `reference/unknown` | error | `{name}` that resolves to no question, panel, page, calculated value, or variable — including scoped forms (`{row.x}`, `{panel.x}`), `choicesByUrl` URLs, and `bindings` |
| `reference/self` | error | A `visibleIf`/`enableIf`/`requiredIf` that references its own element |
| `name/duplicate` | error | Two elements — or a calculated value and an element — sharing a name |
| `element/unknown-type` | info | A `type` no registered class or declared component matches |
| `expression/unknown-function` | warning | A function call that is not registered |
| `cycle/calculated-value` | error | Calculated values that depend on each other |
| `cycle/trigger` | warning | Triggers that react to the values they set |
| `expression/unknown-choice` | warning | A condition compared against a value that is not among the question's choices |
| `expression/type-mismatch` | warning | An operator applied to a value shape it cannot work on (`=` against a checkbox array, `>` against a boolean) |
| `choices/dead-source` | error | `choicesFromQuestion` pointing at a missing question, at itself, or at one that supplies no choices |
| `trigger/unknown-target` | error | A trigger targeting a question, page, or variable that does not exist |
| `trigger/unknown-type` | warning | An unknown or missing trigger `type` |
| `page/empty` | warning | A page or panel with nothing that can ever render |

Each rule — with an example that triggers it, the real rendered finding, and the fix — is in
[references/rules.md](references/rules.md). Read that file before explaining or suppressing a
finding.

## Options

```js
lintSurvey(json, {
  rules: { "page/empty": "off", "expression/type-mismatch": "error" },
  suppress: [{ ruleId: "reference/unknown", elementName: "legacyField" }],
  knownVariables: ["userRole", "tenant.plan"],
  knownFunctions: ["myCustomFunc"],
  components: { fullname: { elementsJSON: [{ type: "text", name: "firstName" }] } },
  reportSuppressed: true
});
```

- `rules` — per-rule severity: `"error"`, `"warning"`, `"info"`, or `"off"`.
- `suppress` — silence specific findings by `ruleId`, `elementName` (case-insensitive), and/or
  `path` (exact, or a `"pages[0].*"` prefix). Suppressed findings are counted, not lost.
- `knownVariables` — names the application sets at runtime (`survey.setVariable`, a trigger's
  `setToName` target that is not a question).
- `knownFunctions` — custom functions that are not registered in this process.
- `components` — definitions for custom/composite question types, so their inner fields are
  resolved instead of skipped.
- `reportSuppressed` — also return the suppressed findings in `result.suppressed`.

Semantics of each option, exact matching rules, and every interface are in
[references/api.md](references/api.md).

## What the linter does not do

State these limits rather than implying the survey is defect-free:

- **No misspelled-property detection.** `visiblIf: "{q1} notempty"` produces no finding — only
  element `type` values are checked, not property names. That is what `survey.jsonErrors` is for:
  `new Model(json).jsonErrors` returns `Unknown property in class 'text': 'visiblIf'.` Run both
  when spelling matters.
- **Nothing at runtime.** Server-supplied choices (`choicesByUrl` responses), values set by the
  host application, and answer-level validation are outside its reach. A condition that is merely
  *wrong for the business* still passes.
- **No styling, localization, or accessibility checks.**
- **Unknown types are treated leniently**, so an unresolvable custom type quiets analysis of the
  paths through it. Pass `options.components` to get that coverage back — registering a component
  with `ComponentCollection` silences `element/unknown-type` but does **not** validate its inner
  field names.

## Working with results

1. **Lint every survey JSON you generate or edit before returning it.** It is a single function
   call; do not hand back JSON with `errorCount > 0`.
2. **Fix errors, explain warnings.** An error cannot evaluate at all. A warning is usually a
   condition that will silently never fire — worth a sentence to the user even when intended.
3. **Prefer a fix over a suppression**, and when a suppression is right, scope it to the rule and
   element rather than switching a rule off globally.
4. **Use `finding.reproduction`** — it names the answers that demonstrate the defect, which is
   what to tell a user who insists the survey "looks fine".

Wiring it into a Node script, an npm script, CI, a Survey Creator save handler, or a batch over
many JSON files: [references/workflows.md](references/workflows.md).
