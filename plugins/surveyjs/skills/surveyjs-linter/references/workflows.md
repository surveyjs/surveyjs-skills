# Workflows

No CLI ships with the linter — it is a function. Everything below is a small amount of glue
around `lintSurvey`.

## Lint files from Node

```js
// scripts/lint-surveys.mjs
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { lintSurvey, renderFindings } from "survey-core/linter";

const DIR = "surveys";
const entries = await readdir(DIR, { recursive: true });
let failed = 0;

for (const entry of entries.filter((name) => name.endsWith(".json"))) {
  const file = join(DIR, entry);
  const json = JSON.parse(await readFile(file, "utf8"));
  const result = lintSurvey(json);
  if (result.findings.length === 0) continue;

  console.log(`\n${file}`);
  console.log(renderFindings(result));
  if (result.errorCount > 0) failed++;
}

process.exit(failed > 0 ? 1 : 0);
```

```json
{ "scripts": { "lint:surveys": "node scripts/lint-surveys.mjs" } }
```

Choices worth making explicitly rather than by accident:

- **What fails the build.** Failing on `errorCount` and printing warnings is the usual split.
  Promote a rule instead of tightening the whole gate: `rules: { "expression/type-mismatch":
  "error" }`.
- **Where the config lives.** One shared options object imported by the script, the app, and any
  editor integration — so a name in `knownVariables` does not have to be repeated.
- **Guard the parse.** `JSON.parse` throws before the linter sees the file; report that as its own
  failure, not as a lint finding.

## Run it inside the application's setup

The linter reads the live `Serializer`, `FunctionFactory.Instance`, and `settings` (see
[api.md](api.md)). A standalone script that skips the app's registration code will report its
custom functions and question types as unknown.

```js
import "../src/survey-setup.js";   // registers functions, components, settings — must come first
import { lintSurvey } from "survey-core/linter";
```

When importing that setup is impractical — it pulls in browser globals, say — declare the
same facts to the linter instead:

```js
const LINT_OPTIONS = {
  knownFunctions: ["scoreSection", "ageFrom"],
  knownVariables: ["userRole", "tenant.plan"],
  components: {
    fullname: { elementsJSON: [
      { type: "text", name: "firstName" },
      { type: "text", name: "lastName" }
    ]}
  }
};
```

## CI

```yaml
- run: npm ci
- run: npm run lint:surveys
```

Findings are sorted by `path`, then `ruleId`, so the output is stable between runs and diffs
cleanly. For a machine-readable artifact, write `result.findings` as JSON instead of rendering it —
`messageData` carries the message in parts.

## Validate on save in Survey Creator

Gate the builder's save on the JSON being clean, so a broken condition never reaches storage:

```js
creator.saveSurveyFunc = (saveNo, callback) => {
  const result = lintSurvey(creator.JSON, LINT_OPTIONS);
  if (result.errorCount > 0) {
    console.warn(renderFindings(result));
    // surface the findings in your own UI, then:
    callback(saveNo, false);
    return;
  }
  fetch("/api/surveys/1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creator.JSON)
  })
    .then(() => callback(saveNo, true))
    .catch(() => callback(saveNo, false));
};
```

For live feedback while editing, run the same call from `creator.onModified` — the linter is a
pure function over the JSON, so calling it on every change is safe. Show `finding.message` and
`finding.suggestion`; use `finding.path` to jump to the element.

Blocking a save on **warnings** is usually wrong: an author mid-edit trips
`reference/unknown` constantly. Warn inline, block on errors.

## Validate JSON arriving from an API

Survey JSON that a client or a third party submits is untrusted input. `lintSurvey` throws
`TypeError` on anything that is not a plain object, so guard the call:

```js
function checkSurveyJson(json) {
  let result;
  try {
    result = lintSurvey(json, LINT_OPTIONS);
  } catch (error) {
    return { ok: false, reason: "not a survey JSON object" };
  }
  return { ok: result.errorCount === 0, findings: result.findings };
}
```

A clean lint is not an authorization check and not a schema guarantee — it reports logic defects,
not everything that could be wrong with a document.

## Suppressions that survive review

Suppressions belong next to the config, with a reason, not scattered through the JSON:

```js
const LINT_OPTIONS = {
  suppress: [
    // "legacyPatientId" is injected by the intake system before the survey loads
    { ruleId: "reference/unknown", elementName: "legacyPatientId" },
    // imported 2019 questionnaire, page 3 is intentionally a placeholder
    { ruleId: "page/empty", path: "pages[2].*" }
  ],
  reportSuppressed: true
};
```

`reportSuppressed: true` keeps them visible (`result.suppressed`, and `(N suppressed)` in the
rendered summary) so a stale suppression is noticed rather than inherited forever.

## As a check on generated survey JSON

When producing or editing survey JSON for someone, lint it before handing it back:

```js
const result = lintSurvey(generated);
if (result.findings.length > 0) console.log(renderFindings(result));
```

Fix everything at `error`. For warnings, decide and say which: `expression/unknown-choice` and
`expression/type-mismatch` usually mean the condition will never fire — a real bug in generated
logic — while `page/empty` on a deliberately empty placeholder page is fine to keep and mention.
