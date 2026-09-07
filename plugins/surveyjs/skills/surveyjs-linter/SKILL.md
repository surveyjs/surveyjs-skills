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

`survey-core/linter` statically analyzes survey JSON for logic defects. It ships **inside
`survey-core` (v3.0.3 and later)** as a separate entry point.

**Do not restate the official linter documentation.** Import, usage, result and finding
shapes, the rule list, severity and suppression options, custom variables/functions/components,
the Node file-linting script, and CI wiring are all at:

<https://surveyjs.io/form-library/documentation/survey-json-validation#use-the-surveyjs-linter>

Fetch the Markdown form when you need the current API:

`https://surveyjs.io/form-library/documentation/survey-json-validation.md`

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
before returning it.** For the real API, follow the official doc above, not memory.

| Never write | Write instead |
| :-- | :-- |
| `npm install survey-linter` / `@surveyjs/linter` / any separate package | Nothing to install. It is an entry point of `survey-core`: `import { lintSurvey } from "survey-core/linter"` (needs `survey-core@>=3.0.3`) |
| `import { lintSurvey } from "survey-core"` | The linter is **not** on the main entry: import from `"survey-core/linter"` |
| `npx survey-lint schema.json`, an ESLint plugin, a webpack loader | No CLI or plugin ships. Use the Node script in the official doc |
| `new SurveyModel(json)` plus `survey.jsonErrors` as the whole schema check | Complementary, not a substitute. `jsonErrors` names unknown properties and types; only `lintSurvey(json)` on the **raw** object reports broken references, dead conditions, and cycles |
| `survey.validate()` as a schema check | `validate()` checks a respondent's **answers** at runtime. It says nothing about the schema |
| `lintSurvey(jsonString)` or `lintSurvey(null)` | Throws `TypeError`. Pass a parsed, non-array **object**: `lintSurvey(JSON.parse(text))` |
| `lintSurvey(json, { severity: "error" })`, `{ ignore: [...] }`, `{ disableRules: [...] }` | `{ rules: { "reference/unknown": "off" } }` and `{ suppress: [{ ruleId, elementName, path }] }` |
| `finding.rule`, `finding.line`, `finding.column` | `finding.ruleId` and `finding.path`. There are no line numbers — the input is an object, not text |
| `lintSurvey(json, { functions: [...] })`, or registering a custom function or component *after* the call | Register with `FunctionFactory.Instance` / `Serializer` / `ComponentCollection` **first**. Linting outside the app process? Use `options.knownFunctions`, `options.knownVariables`, `options.components` |
| Reporting only `errorCount` and calling a survey clean | A `warning` is usually a condition that evaluates but can never hold. Read them |
| `if (result.errors.length)` | The array is `result.findings`; the counts are `errorCount` / `warningCount` / `infoCount` / `suppressedCount` |

Import `survey-core` from the **same copy** the application uses. The linter reads live
`settings`, `Serializer`, and `FunctionFactory.Instance` through that shared closure; two copies
in one bundle make the analysis wrong. A UMD build exists (`SurveyLinter` global, `Survey` loaded
first) — do not invent a separate package for it.

## Limits the docs do not dwell on

State these rather than implying the survey is defect-free:

- **Nothing at runtime.** Server-supplied choices (`choicesByUrl` responses), values set by the
  host application, and answer-level validation are outside its reach. A condition that is merely
  *wrong for the business* still passes.
- **No styling, localization, or accessibility checks.**
- **Unknown types are treated leniently**, so an unresolvable custom type quiets analysis of the
  paths through it. Pass `options.components` to get that coverage back — registering a component
  with `ComponentCollection` silences `element/unknown-type` but does **not** validate its inner
  field names.

## Working with results

1. **Lint every survey JSON you generate or edit before returning it.** Do not hand back JSON
   with `errorCount > 0`.
2. **Fix errors, explain warnings.** An error cannot evaluate at all. A warning is usually a
   condition that will silently never fire — worth a sentence even when intended.
3. **Prefer a fix over a suppression**, and when a suppression is right, scope it to the rule and
   element rather than switching a rule off globally.
4. **Use `finding.reproduction`** — it names the answers that demonstrate the defect, which is
   what to tell a user who insists the survey "looks fine".

## Routing

| Task | Read |
| :-- | :-- |
| Official import, usage, results, rules, options, Node/CI | [Survey JSON Validation](https://surveyjs.io/form-library/documentation/survey-json-validation#use-the-surveyjs-linter) |
| Example JSON, real `renderFindings` output, and the fix per rule | [references/rules.md](references/rules.md) |
| TypeScript shapes, `messageData`, `path`, `reproduction`, runtime coupling | [references/api.md](references/api.md) |
| Survey Creator save gate, untrusted API input, generated JSON | [references/workflows.md](references/workflows.md) |

## Fetching current docs

Every page on surveyjs.io is available as raw Markdown by appending `.md` to its URL:

- Linter (and complementary model / server validation) —
  `https://surveyjs.io/form-library/documentation/survey-json-validation.md`
- Other Form Library docs — `https://surveyjs.io/form-library/documentation/<page>.md`

Escalation order when stuck: official `.md` doc → this skill's reference files →
[howtos-and-troubleshooting](https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting)
→ [llms.txt](https://surveyjs.io/llms.txt) for orientation.

## Before you finish

- [ ] Import is `from "survey-core/linter"`, not `"survey-core"` and not a separate package
- [ ] Input is a parsed object, not a string; `survey-core@>=3.0.3`
- [ ] Generated or edited survey JSON was linted; `errorCount === 0` before handing it back
- [ ] Warnings were read, not only `errorCount`
- [ ] Custom functions, components, and runtime variables were registered or declared *before*
      the call
