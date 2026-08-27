# Rule catalog

Fourteen rules, all enabled by default. Every rendered block below is real `renderFindings`
output for the JSON above it.

Severity means: **error** — the construct cannot evaluate at all; **warning** — it evaluates but
cannot produce the intended outcome; **info** — the linter lacks the information to be sure.

---

## `expression/syntax` — error

The expression parser could not read the text. Every other expression rule skips a site that
fails to parse, so fix these first: one syntax error can mask a dozen reference errors.

```json
{ "elements": [{ "type": "text", "name": "q1", "visibleIf": "{q1} = = 2" }] }
```

```
ERROR  expression/syntax
  The expression "{q1} = = 2" cannot be parsed (at position 7).

  visibleIf: {q1} = = 2
  at elements[0].visibleIf
```

**Fix:** correct the operator. Common causes: `==` instead of `=`, `&&`/`||` instead of
`and`/`or`, an unclosed `{`, a stray quote inside a string constant.

A trigger written in the legacy `name`/`operator`/`value` form has no `expression` property of its
own — the linter synthesizes one and says so in the message (`It was built from the trigger's
legacy name/operator/value properties.`). Fix the legacy properties, not a literal string.

---

## `reference/unknown` — error

`{name}` resolves to nothing: no question, panel, page, calculated value, variable, or — inside a
scope — no member of that scope. This is the highest-value rule: a `visibleIf` with a typo does
not error at runtime, it silently never fires.

Resolution is **case-insensitive** and covers `valueName`, comment keys (`{q1-Comment}`), matrix
total keys (`{m-total.col}`), built-in variables (`{pageNo}`, `{questionCount}`), calculated
values, and `options.knownVariables`.

Sites scanned go well beyond `visibleIf`: every serializer property registered as an expression or
condition (including ones added with `Serializer.addProperty`), validator expressions,
`completedHtmlOnCondition`, trigger expressions, `bindings`, and `{...}` placeholders inside a
`choicesByUrl.url`.

```json
{
  "pages": [{ "name": "page1", "elements": [
    { "type": "radiogroup", "name": "hasInsurance", "choices": ["yes", "no"] },
    { "type": "text", "name": "provider", "visibleIf": "{hasInsurnce} = 'yes'" }
  ]}]
}
```

```
ERROR  reference/unknown
  "hasInsurnce" is not found - no question, panel, page, calculated value, or variable with that name exists. Did you mean "hasInsurance"? (in "{hasInsurnce} = 'yes'")

  visibleIf: {hasInsurnce} = 'yes'
  at pages[0].elements[1].visibleIf
```

### Scope forms

`{row.x}` / `{panel.x}` / `{item}` and their neighbours are only valid inside the scope that
provides them, and the message says which scope is missing:

```json
{ "elements": [{ "type": "text", "name": "q1", "visibleIf": "{row.price} > 1" }] }
```

```
ERROR  reference/unknown
  "row.price" is not found - ... "row." references are only available inside a matrix cell or a matrix detail panel. (in "{row.price} > 1")
```

The inverse — using a bare name where a scope prefix is required — is caught too, with the
prefixed name as the suggestion:

```json
{ "elements": [{ "type": "matrixdynamic", "name": "m", "columns": [
  { "name": "price" },
  { "name": "qty", "visibleIf": "{price} > 1" }
]}]}
```

```
ERROR  reference/unknown
  "price" is not found - ... Did you mean "row.price"? "price" is a column of this matrix - reference it as {row.price}. (in "{price} > 1")
```

**Fix:** correct the name, add the scope prefix, or — when the name is supplied by the host
application at runtime — list it in `options.knownVariables`.

**Deliberately lenient**, so these never produce findings: `{survey.x}`, `{self}`, `{parent.x}`,
`$`-prefixed element property references, JSON-object literal keys, string constants, and any path
into a question whose type the linter could not resolve.

---

## `reference/self` — error

A `visibleIf`, `enableIf`, or `requiredIf` that references its own element. When the element hides,
its value is cleared, which re-evaluates the condition — the classic never-settles loop.

```json
{ "elements": [{ "type": "text", "name": "q1", "visibleIf": "{q1} notempty" }] }
```

```
ERROR  reference/self
  The visibleIf of "q1" references the element itself ({q1} in "{q1} notempty").

  visibleIf: {q1} notempty
  at elements[0].visibleIf

  Reproduction: Answering "q1" re-evaluates its own visibleIf; if the element becomes hidden its value is cleared, which flips the condition again.
```

**Fix:** condition on the question that should drive visibility, not on the element itself.

**Not flagged** (legitimate patterns): a choice's or rate value's own `visibleIf`/`enableIf`
referencing the owning question — the exclusive-"none" idiom — because only the item hides and the
question's value survives. Comparison is by element identity, so a matrix column that happens to
share a name with a top-level question is not a self-reference.

---

## `name/duplicate` — error

Two elements sharing a name within one namespace, or a calculated value colliding with an element
name. `{name}` then resolves to one of them, arbitrarily.

```json
{ "elements": [{ "type": "text", "name": "q1" }, { "type": "text", "name": "q1" }] }
```

```
ERROR  name/duplicate
  The name "q1" is used by 2 elements (question, question) - element names must be unique.
  at elements[1]
  related: elements[0], elements[1]
```

The shadowing form is reported separately:

```json
{ "calculatedValues": [{ "name": "q1", "expression": "1" }],
  "elements": [{ "type": "text", "name": "q1" }] }
```

```
ERROR  name/duplicate
  The calculated value "q1" shares its name with a question - both are referenced as {q1}, so one of them shadows the other.
  at calculatedValues[0]
```

**Fix:** rename one. `related` lists every colliding path, so the rename target is unambiguous.

---

## `element/unknown-type` — info

A `type` that matches no registered class and no `options.components` entry. Info, not error,
because the type may be a component this process has not registered.

```json
{ "elements": [{ "type": "chekbox", "name": "q1" }] }
```

```
INFO  element/unknown-type
  "q1" has an unknown type "chekbox". Did you mean "checkbox"?
  at elements[0]
```

Without a close match the message instead says to pass the definition through
`options.components`.

**Fix:** correct the typo, or make the component known — register it with `ComponentCollection` /
`Serializer` before linting, or pass `options.components`. Note the difference: registering
silences this rule but leaves inner field names unchecked; `options.components` also validates
paths like `{fn.firstName}`.

---

## `expression/unknown-function` — warning

A function call the `FunctionFactory` does not know. At runtime it returns `undefined`, so the
condition around it quietly collapses.

```json
{ "elements": [
  { "type": "text", "name": "q1" },
  { "type": "expression", "name": "e", "expression": "myCalc({q1})" }
]}
```

```
WARN  expression/unknown-function
  The function "myCalc" is not registered (in "myCalc({q1})"). Register it with FunctionFactory.Instance before linting, or list it in options.knownFunctions.

  expression: myCalc({q1})
  at elements[0].expression
```

**Fix:** register the function before linting (`FunctionFactory.Instance.register("myCalc", fn)`)
— which also feeds typo suggestions — or, when linting outside the app process, list it in
`options.knownFunctions`.

---

## `cycle/calculated-value` — error

Calculated values whose expressions depend on each other, directly or through a chain.

```json
{ "calculatedValues": [
  { "name": "a", "expression": "{b} + 1" },
  { "name": "b", "expression": "{a} + 1" }
]}
```

```
ERROR  cycle/calculated-value
  Calculated values "a", "b" depend on each other.
  at calculatedValues[0].expression
  related: calculatedValues[0].expression, calculatedValues[1].expression
```

A one-member cycle gets its own message (`... references itself in its own expression`). Diamond
dependencies without a cycle are clean.

**Fix:** break the loop — derive one value from questions instead of from the other calculated
value.

---

## `cycle/trigger` — warning

Triggers that react to values other triggers set, forming a loop. Warning rather than error
because the loop may be unreachable if the conditions never hold together — which the message
says.

```json
{ "elements": [{ "type": "text", "name": "q1" }, { "type": "text", "name": "q2" }],
  "triggers": [
    { "type": "setvalue", "expression": "{q1} = 1", "setToName": "q2", "setValue": 2 },
    { "type": "setvalue", "expression": "{q2} = 2", "setToName": "q1", "setValue": 1 }
  ]}
```

```
WARN  cycle/trigger
  Triggers form a loop through the values they set: triggers[0] (setvalue -> q2) -> triggers[1] (setvalue -> q1). The loop may be unreachable if the trigger conditions never hold together - verify the expressions.
  at triggers[0]
  related: triggers[0], triggers[1]
```

Cycles through a question's `valueName`, through an indexed `setToName`, and through legacy-form
triggers are all detected. A single trigger reacting to its own set value reports as a self-loop.

**Fix:** narrow one condition so it cannot re-fire, or set the value once from a
`calculatedValue`/`expression` question instead.

---

## `expression/unknown-choice` — warning

A condition compares a choice question against a value none of its choices can produce — the
condition is dead.

```json
{ "elements": [
  { "type": "radiogroup", "name": "satisfaction", "choices": ["low", "medium", "high"] },
  { "type": "comment", "name": "followUp", "visibleIf": "{satisfaction} = 'poor'" }
]}
```

```
WARN  expression/unknown-choice
  The condition compares "satisfaction" to "poor" - not among its choices. Available: "low", "medium", "high". (in "{satisfaction} = 'poor'")

  visibleIf: {satisfaction} = 'poor'
  at elements[1].visibleIf

  Reproduction: No selectable choice of "satisfaction" equals "poor".
```

Comparison uses the runtime's own operator implementation, so numeric coercion (`'2'` against a
numeric choice), `settings.comparator` (case sensitivity, trimming), and the array semantics of
`contains` behave exactly as they do in a running survey. `anyof`/`allof`/`noneof` report only the
missing members. `showOtherItem`, `showNoneItem`, refuse/don't-know items, and `defaultValue` are
all accepted values.

**Skipped** (no static answer possible): `choicesByUrl`, carry-forward choices
(`choicesFromQuestion`), lazy-loaded choices, boolean constants, and comparisons against another
variable or a function result.

**Fix:** use a real choice value, or `contains`/`anyof` if the intent was a multi-select match.

---

## `expression/type-mismatch` — warning

An operator applied to a value shape it cannot work on.

```json
{ "elements": [
  { "type": "checkbox", "name": "toppings", "choices": ["a", "b"] },
  { "type": "text", "name": "note", "visibleIf": "{toppings} = 'a'" }
]}
```

```
WARN  expression/type-mismatch
  The condition applies "equal" to "toppings": "toppings" holds an array of selected values - "=" compares the whole array. Consider: use "contains" or "anyof" for multi-select values. (in "{toppings} = 'a'")
```

The other reported shapes: ordering or arithmetic on an array, an object, a boolean, or an element
with no value (`html`); a date compared to a number; a numeric question compared to a non-empty
string. A plain text question in a numeric comparison is reported with a fix suggestion rather
than as a certainty:

```
WARN  expression/type-mismatch
  The condition applies "greater" to "age": "age" is a text question - its value is a string, so numeric comparison relies on implicit conversion. Consider: set inputType: "number" on "age" if it collects numbers. (in "{age} > 18")
```

Guards keep it quiet where it cannot be sure: variable-vs-variable, function results, unknown
question types, `empty`/`notempty`, comparisons to `""`, and non-condition expression sites are
never flagged. A matrix cell's type comes from the column's `cellType`.

**Fix:** the suggested operator, or the `inputType`/`cellType` that matches the data.

---

## `choices/dead-source` — error

`choicesFromQuestion` (carry-forward) pointing somewhere that cannot supply choices, so the
question renders empty.

```json
{ "elements": [
  { "type": "checkbox", "name": "picked", "choices": ["a", "b"] },
  { "type": "dropdown", "name": "one", "choicesFromQuestion": "pickd" }
]}
```

```
ERROR  choices/dead-source
  "one" copies its choices from "pickd", but no question with that name exists.
  at elements[1].choicesFromQuestion
```

Also reported: copying from itself; copying from a question type that supplies neither choices nor
an array of values (a `text` question); and a `choiceValuesFromQuestion` /
`choiceTextsFromQuestion` field that the array source does not have:

```
ERROR  choices/dead-source
  "d" reads choiceValuesFromQuestion "prce" from "m", but matrixdynamic "m" has no such column.
  at elements[1].choiceValuesFromQuestion
```

Omitting `choiceValuesFromQuestion` entirely is **not** a defect — the runtime falls back to the
first key of each row/panel value.

**Fix:** point at a select-type question (any `selectbase` descendant), a `matrixdynamic`,
`matrixdropdown`, or `paneldynamic`, and name a column or template question that exists.

---

## `trigger/unknown-target` — error

A trigger naming a question, page, or variable that does not exist. Validated for every target
property the trigger class declares — `setToName`, `fromName`, `gotoName`, and the `questions` /
`pages` arrays of a `visible`/`complete` trigger.

```json
{ "elements": [{ "type": "text", "name": "q1" }],
  "triggers": [{ "type": "setvalue", "expression": "{q1} = 1", "setToName": "q2", "setValue": "x" }] }
```

```
ERROR  trigger/unknown-target
  The setvalue trigger sets "q2", but no question or variable with that name exists. If it is a variable set at runtime, list it in options.knownVariables.
  at triggers[0].setToName

  Reproduction: This fires the trigger, which then targets the missing element "q2".
```

Targets are kind-aware: a value target accepts questions, `valueName`s, calculated values, comment
and total data keys, built-in and known variables; a navigation target (`gotoName`) must be a real
question, so a page or panel name is reported. Suggestions are filtered to the right kind — a page
target is never offered a question name.

**Fix:** correct the name, or declare the runtime variable in `options.knownVariables`.

---

## `trigger/unknown-type` — warning

A trigger `type` that matches no registered trigger class, or none at all. The trigger is simply
never created at runtime.

```json
{ "elements": [{ "type": "text", "name": "q1" }],
  "triggers": [{ "type": "setvlue", "expression": "{q1} = 1", "setToName": "q1", "setValue": "x" }] }
```

```
WARN  trigger/unknown-type
  The trigger type "setvlue" is not known. Did you mean "setvalue"?
  at triggers[0]
```

A legacy type carrying the class suffix (`"setvaluetrigger"`) is normalized and accepted.

---

## `page/empty` — warning

A page or panel with nothing that can ever render, or a dynamic panel with an empty template.

```json
{ "pages": [
  { "name": "page1", "elements": [{ "type": "text", "name": "q1" }] },
  { "name": "page2", "elements": [] }
]}
```

```
WARN  page/empty
  The page "page2" has no elements.
  at pages[1]
```

"Can ever render" is static: an element with `visible: false` and no `visibleIf` never renders,
while `visible: false` **with** a `visibleIf` does count as renderable. Panels resolve
transitively, so an empty panel chain flags both the panel and its page:

```
WARN  page/empty
  The page "p1" has no elements that can ever render (every element is statically hidden or empty).
  at pages[0]
```

`html`/`image` elements and unknown types count as rendering.

**Fix:** add content, remove the page, or replace `visible: false` with a `visibleIf` if the
element is meant to appear conditionally.
