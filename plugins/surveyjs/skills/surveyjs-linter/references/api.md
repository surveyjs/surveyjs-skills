# API reference

Public function signatures, result and finding fields, rule severity, suppressions, and the
`knownVariables` / `knownFunctions` / `components` options are documented at
<https://surveyjs.io/form-library/documentation/survey-json-validation#use-the-surveyjs-linter>
(Markdown: `https://surveyjs.io/form-library/documentation/survey-json-validation.md`).
Fetch that page rather than restating those tables.

Everything below is **not** on that page: TypeScript shapes as shipped, `messageData`, how
`path` / `reproduction` work, and the live `survey-core` registries the analysis reads.

The TypeScript interfaces ship with `survey-core`. The shapes here are the declared ones.

## Functions

```ts
function lintSurvey(json: any, options?: ISurveyLintOptions): ISurveyLintResult;
function renderFindings(input: ISurveyLintResult | Array<ILintFinding>, options?: IRenderOptions): string;
function getRules(): Array<ILintRuleInfo>;
```

### `lintSurvey(json, options?)`

- `json` must be a **parsed, non-array object**. A string, `null`, or an array throws
  `TypeError`; parse text with `JSON.parse` first.
- Accepts both the `pages` form and the legacy top-level `elements` form (treated as one
  implicit page).
- **Does not mutate the input.** Nothing is normalized, defaulted, or written back.
- Runs every rule that is not `"off"`, then sorts findings by `path`, then by `ruleId`.

### `renderFindings(input, options?)`

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

The rule registry as `{ id, defaultSeverity }` pairs, in **execution order**. Use it to build a
severity config or to check a rule id before referencing it — do not hardcode a list that can
drift from the installed version.

## Options the docs omit

```ts
interface ISurveyLintOptions {
  rules?: { [ruleId: string]: LintSeverity };   // "error" | "warning" | "info" | "off"
  suppress?: Array<ISuppression>;
  knownVariables?: Array<string>;
  knownFunctions?: Array<string>;
  components?: { [typeName: string]: IComponentDef };
  reportSuppressed?: boolean;
}

interface ISuppression {
  ruleId?: string;
  elementName?: string;
  path?: string;      // exact path, or a prefix ending in ".*"
}

interface IComponentDef {
  questionJSON?: any;              // single-question component
  elementsJSON?: Array<any>;       // composite component
}
```

- An unrecognized `rules` value is ignored and the default applies; an unrecognized rule id is
  simply never matched. `"off"` skips the rule entirely — no findings and no suppressed entries.
- A suppression matches when **every** field it sets matches the finding (AND). An entry with no
  fields matches nothing — a guard against `{}` silencing the run. `elementName` never matches a
  finding that has none.
- `knownVariables` also feed typo suggestions. Dotted names work: `"user.role"` resolves
  `{user.role}`.
- Registering with `FunctionFactory.Instance` is better than `knownFunctions` when linting
  inside the app: registered functions are known automatically **and** contribute to
  "Did you mean …?" suggestions.
- Expressions **inside** an `options.components` definition are linted too, with
  `components.<name>.elementsJSON[i].<prop>` paths and a scope where `{composite.x}` resolves
  against the sibling fields. A component registered only through `ComponentCollection.add`
  silences `element/unknown-type` but does **not** expose inner field names — pass
  `options.components` as well when you want that coverage.

## Finding fields the docs omit

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

There are **no line or column numbers**. To point at a source location, resolve the path against
the file yourself (a JSON source-map parser, or a search for the element name).

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
