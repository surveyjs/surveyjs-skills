# API reference

Everything below is exported from `survey-core/linter`. The TypeScript interfaces ship with the
package; the shapes here are the declared ones.

## Functions

```ts
function lintSurvey(json: any, options?: ISurveyLintOptions): ISurveyLintResult;
function renderFindings(input: ISurveyLintResult | Array<ILintFinding>, options?: IRenderOptions): string;
function getRules(): Array<ILintRuleInfo>;
```

### `lintSurvey(json, options?)`

- `json` must be a **parsed, non-array object** — the survey JSON as written. A string, `null`,
  or an array throws `TypeError`; parse text with `JSON.parse` first.
- Accepts both the `pages` form and the legacy top-level `elements` form (which is treated as one
  implicit page).
- **Does not mutate the input.** Nothing is normalized, defaulted, or written back.
- Runs every rule that is not `"off"`, then sorts findings by `path`, then by `ruleId`. The order
  is stable across runs, which makes the output diffable in CI.

### `renderFindings(input, options?)`

Formats findings as plain text: one block per finding, then a summary line
(`2 errors, 1 warning, 0 info`, plus `(N suppressed)` when a result carries suppressions).
Accepts either the whole result or a plain array of findings — filter first to render a subset.

```ts
interface IRenderOptions { includeSuppressed?: boolean }
```

`includeSuppressed` only applies when passing a full result that was produced with
`reportSuppressed: true`.

A block carries, in order: `SEVERITY  ruleId`, the message, the offending expression (labelled
with the property name), `at <path>`, `related:` paths when there is more than one, and either the
reproduction steps as JSON or the finding's note.

### `getRules()`

The rule registry as `{ id, defaultSeverity }` pairs, in execution order. Use it to build a
severity config or to check a rule id before referencing it — do not hardcode a list that can
drift from the installed version.

## Options

```ts
interface ISurveyLintOptions {
  rules?: { [ruleId: string]: LintSeverity };   // "error" | "warning" | "info" | "off"
  suppress?: Array<ISuppression>;
  knownVariables?: Array<string>;
  knownFunctions?: Array<string>;
  components?: { [typeName: string]: IComponentDef };
  reportSuppressed?: boolean;
}
```

### `rules`

Overrides a rule's default severity. An unrecognized value is ignored and the default applies; an
unrecognized rule id is simply never matched. `"off"` skips the rule entirely — it produces no
findings and no suppressed entries.

```js
lintSurvey(json, { rules: { "page/empty": "off", "expression/type-mismatch": "error" } });
```

### `suppress`

```ts
interface ISuppression {
  ruleId?: string;
  elementName?: string;
  path?: string;      // exact path, or a prefix ending in ".*"
}
```

A suppression matches when **every** field it sets matches the finding — the fields are ANDed. An
entry with no fields at all matches nothing (a guard against `{}` silencing the run).

- `ruleId` — exact match.
- `elementName` — case-insensitive; never matches a finding that has no `elementName`.
- `path` — exact, or a prefix form: `"pages[0].*"` matches `pages[0]` itself and everything
  beneath it.

Suppressed findings leave `findings` and are counted in `suppressedCount`; with
`reportSuppressed: true` they are also returned in `result.suppressed`. Prefer a narrow
suppression (rule + element) over turning a rule off.

### `knownVariables`

Names the host application supplies at runtime — `survey.setVariable("userRole", …)`, a value
injected into `survey.data`, a trigger target that is a variable rather than a question. They
resolve as references and as trigger targets, and they feed typo suggestions. Dotted names work:
`"user.role"` resolves `{user.role}`.

### `knownFunctions`

Custom functions that are not registered in the process doing the linting. When the linter runs
inside the application, registering with `FunctionFactory.Instance` is better: registered
functions are known automatically **and** contribute to "Did you mean …?" suggestions.

### `components`

Definitions for custom question types, in the shape `ComponentCollection.add` takes:

```ts
interface IComponentDef {
  questionJSON?: any;              // single-question component
  elementsJSON?: Array<any>;       // composite component
}
```

```js
lintSurvey(json, {
  components: {
    fullname: { elementsJSON: [
      { type: "text", name: "firstName" },
      { type: "text", name: "lastName" }
    ]}
  }
});
```

Two effects: the type stops being "unknown", and paths into it (`{fn.firstName}`) are resolved
against the declared fields instead of being skipped. Expressions **inside** the definition are
linted too, with `components.<name>.elementsJSON[i].<prop>` paths and a scope where
`{composite.x}` resolves against the sibling fields.

A component registered through `ComponentCollection.add` is visible to the linter as a known type
— it lands in the `Serializer` — but its **inner field names are not validated**, because the
definition is not exposed as JSON. Pass `options.components` as well when you want that coverage.

## Results

```ts
interface ISurveyLintResult {
  findings: Array<ILintFinding>;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  suppressedCount: number;
  suppressed?: Array<ILintFinding>;   // only with reportSuppressed: true
}
```

The three counts partition `findings`; `suppressedCount` counts what was filtered out and is
**not** included in them.

```ts
interface ILintFinding {
  ruleId: string;
  severity: "error" | "warning" | "info";
  message: string;
  messageData: { [key: string]: any };
  path: string;
  elementName?: string;
  elementType?: string;
  suggestion?: string;
  related?: Array<{ path: string; elementName?: string }>;
  reproduction?: ILintReproduction;
}
```

A real finding, as returned:

```json
{
  "ruleId": "reference/unknown",
  "severity": "error",
  "message": "\"firstNme\" is not found in fullname \"fn\" ({fn.firstNme}). Did you mean \"firstName\"? (in \"{fn.firstNme} notempty\")",
  "messageData": {
    "name": "fn.firstNme",
    "segment": "firstNme",
    "segmentIndex": 1,
    "expression": "{fn.firstNme} notempty",
    "refKind": "expression",
    "note": "No case: the reference cannot be evaluated."
  },
  "path": "elements[1].visibleIf",
  "elementName": "q",
  "elementType": "text",
  "suggestion": "firstName"
}
```

- `message` is prose meant for a human. `messageData` is the same information in parts — use it
  for custom formatting, grouping, or an editor integration; its keys vary by rule.
- `elementName`/`elementType` describe the element the finding **sits on**, not the element the
  message is about. In the example above the broken reference names `fn`, but the finding belongs
  to `q`, whose `visibleIf` contains it.
- `suggestion` is a single closest-match name (Levenshtein), present only when one is close
  enough. Do not apply it automatically — offer it.
- `related` lists every path involved in a multi-site defect (cycle members, all duplicates of a
  name).

### `path`

A JSON path into the linted object, using dots for properties and `[i]` for array indices —
`pages[0].elements[1].visibleIf`, `elements[0].columns[0].minValueExpression`,
`elements[0].items[0].validators[0].expression`, `triggers[0].setToName`,
`calculatedValues[1].expression`, `elements[1].choicesByUrl.url`, `elements[1].bindings.rowCount`,
`components.fullname.elementsJSON[1].visibleIf`.

There are **no line or column numbers** — the input is an object, not text. To point at a source
location, resolve the path against the file yourself (a JSON source-map parser, or a search for
the element name).

### `reproduction`

Present on the rules that can name a concrete failing case:

```ts
interface ILintReproduction {
  description?: string;
  steps: Array<{ set: { [name: string]: any } } | { expect: ILintReproductionExpect }>;
}
interface ILintReproductionExpect {
  visible?: { [name: string]: boolean };
  calculatedValue?: { [name: string]: any };
}
```

`set` steps are answers to apply; the `expect` step states what the survey author presumably
intended and what does not happen. This is the material for explaining a finding to someone who
believes the survey is correct.

## Runtime coupling

The linter is built with `survey-core` as an external dependency: both share one module closure,
and the analysis reads the **live** registries and settings of the process it runs in. Anything
the application customizes must therefore be applied **before** `lintSurvey` is called.

Read per run (a fresh snapshot each call, so runtime changes between calls are picked up):

| Source | Effect on the analysis |
| :-- | :-- |
| `Serializer` (`addClass`, `addProperty`, `ComponentCollection.add`) | Which types exist, and which properties are scanned as expressions — a custom `isExpression` property is analyzed like `visibleIf` |
| `FunctionFactory.Instance` | Which functions are known, and typo suggestions for them |
| `settings.expressionVariables` | The names of scope prefixes (`row`, `panel`, `item`, …) |
| `settings.commentSuffix`, `settings.matrix.totalsSuffix` | Which data keys resolve (`{q1-Comment}`, `{m-total.col}`) |
| `settings.noneItemValue`, `refuseItemValue`, `dontKnowItemValue` | Which special choice values are accepted |
| `settings.matrix.defaultCellType` | The value type of a column with no `cellType` |
| `settings.comparator` | Case sensitivity and trimming in choice comparisons |

Two consequences worth stating to users:

- Linting in a **separate process** (a CI script) that does not run the application's setup code
  will report the application's custom functions, types, and variables as unknown. Either import
  that setup module first, or pass `knownFunctions` / `components` / `knownVariables`.
- Two copies of `survey-core` in one bundle break the coupling — the linter would read a different
  registry than the app configured. Deduplicate the dependency.
