# Adapters, hints, validation, and confidence

## Choosing an adapter

The adapter turns the form definition into the extraction prompt and into the Zod schema
that validates the model's output. `createExtractor` takes
`adapter: "surveyjs" | "json-schema" | "custom"`.

- **`surveyjs`** — first-class support for SurveyJS JSON. Walks pages, panels, and dynamic
  panels; understands choices, matrices, ratings, boolean/checkbox items; maps a choice's
  display text back to its `value` when the model returns the label it saw printed on
  paper. Output keys are question `name`s — the same shape an online submission produces.
- **`json-schema`** — standard JSON Schema form definitions.
- **`custom`** — pass your own implementation via `customAdapter` (required with this
  adapter, otherwise `createExtractor` throws):

```ts
import type { FormAdapter } from "ai-form-response-extractor";

const myAdapter: FormAdapter = {
  name: "my-format",
  toPrompt(formDefinition) { /* describe fields, types, choices as text */ },
  toOutputSchema(formDefinition) { /* return a Zod schema for the output */ },
  normalizeResponseData(formDefinition, data) { /* optional pre-validation cleanup */ },
};
```

The repository's `examples/custom-adapter/` shows a complete working one.

## Questions the SurveyJS adapter skips

`signature`, `signaturepad`, `html`, `image`, and `file` questions are excluded from both
the prompt and the output schema — they never appear in `result.data`. A signature is
treated as visual document evidence, not as a structured answer; keep the original scan if
you need proof of signature. Do not promise extraction of these types or post-process them
in.

## `aiHint` — extraction hints in the schema

Any field may carry an `aiHint` string that guides the model without being shown to
respondents (unlike `description`, which the Form Library renders):

```json
{
  "type": "radiogroup",
  "name": "insurance_type",
  "aiHint": "Box 1 has 7 checkboxes in a row. Each sits left of its label. Return the label next to the marked box."
}
```

A schema-root `aiHint` gives document-wide instructions:

```json
{
  "aiHint": "CMS-1500 form: all checkboxes are marked with X.",
  "pages": [ ... ]
}
```

The SurveyJS adapter emits hints as `Hint:` lines in the prompt; the JSON Schema adapter
accepts `aiHint` on any property and prefers it over `description`. Hints are the right fix
when a specific field extracts poorly — more precise than raising `maxRetries` or swapping
models.

## Validation — built in, don't bypass it

Every model response goes through a pipeline: JSON is pulled out of the raw text (code
fences and prose stripped), the adapter normalizes values, and the result is validated
against the adapter's Zod schema. A parse or validation failure triggers a corrective
re-prompt up to `maxRetries` times, then throws. Consequences:

- `result.data` is already schema-valid — do not re-parse `rawResponse` yourself.
- A field the model could not read is `null`. **Leave it null.** Filling defaults or
  guessing values silently corrupts collected data; unreadable required fields are a review
  case, not a coding problem.

## The confidence model

`result.confidence` has one `FieldConfidence` entry per schema field:

```ts
interface FieldConfidence {
  fieldName: string;
  value: unknown;
  confidence: number | null;  // 0–1, or null = "no signal"
  flagged: boolean;           // confidence !== null && confidence < confidenceThreshold
}
```

- A **0–1 number** is the model's self-reported confidence; `1.0` also stands in when a
  value is present but the model gave no score.
- **`null` means "no signal"** — the field came back blank with no score. That usually
  means the field is genuinely empty on the paper, *not* that the model is uncertain.
  `null` fields are never `flagged`.
- The model is prompted to score blanks too: a *confident* blank gets a high score, an
  "I'm not sure whether something was written here" blank gets a low one and is flagged.

Aggregate by excluding `null`, never by coercing it to 0:

```ts
const scored = result.confidence.filter((c) => c.confidence !== null);
const overall = scored.length
  ? scored.reduce((s, c) => s + (c.confidence as number), 0) / scored.length
  : null;
const needsReview = result.confidence.filter((c) => c.flagged);
```

Treating `null` as 0 punishes forms with legitimately empty optional fields and floods the
review queue. What to do with `needsReview` is covered in `review-and-merge.md`.
