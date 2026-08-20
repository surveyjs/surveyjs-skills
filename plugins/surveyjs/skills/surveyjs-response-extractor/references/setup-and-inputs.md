# Setup, configuration, and inputs

## Install

```bash
npm install ai-form-response-extractor
# plus the SDK for the provider you use:
npm install openai              # OpenAI provider
npm install @anthropic-ai/sdk   # Anthropic provider
#                               # Ollama provider needs no SDK
npm install sharp               # optional: preprocessing + QR pixel decoding
```

- Requires **Node.js ≥ 18**, ships CommonJS and ESM builds, and has no browser build —
  keep every import server-side.
- `jsqr` and `zod` are regular dependencies and install automatically.
- `openai`, `@anthropic-ai/sdk`, and `sharp` are *optional* peer dependencies. A provider
  whose SDK is missing throws at call time with the exact install command. Without `sharp`,
  preprocessing silently no-ops and QR codes cannot be decoded from pixels.

## Core flow

```ts
import { createExtractor } from "ai-form-response-extractor";
import { openai } from "ai-form-response-extractor/providers";
import { readFileSync } from "fs";

const extractor = createExtractor({
  provider: openai("gpt-4o"),
  adapter: "surveyjs",                 // "surveyjs" | "json-schema" | "custom"
  options: {
    confidenceThreshold: 0.75,
    maxRetries: 2,
  },
});

const result = await extractor.extractFromImage({
  image: readFileSync("./scanned-form.png"),
  formDefinition: surveyJson,          // the same JSON the Form Library renders
});

result.data;         // structured responses keyed by question name
result.uniqueId;     // detected QR / unique ID, or null
result.confidence;   // per-field FieldConfidence[]
```

`formDefinition` is the original schema object — for the `surveyjs` adapter, the same JSON
authored with `surveyjs-form-json` and rendered by `surveyjs-integration`.

## Input types

`image` accepts one input or an array (an array = one form spanning multiple pages):

- a `Buffer` or `Uint8Array` with the file bytes (the usual case — `readFileSync(...)`)
- a `string` file path, an `https?://` URL (fetched by *your* server; 10 MB / 10 s limits),
  or a base64 `data:` URL

Formats are detected from magic bytes, not file extension: **PNG, JPEG, WebP, GIF, and
PDF**. Anything else throws `Unsupported image format`. PDFs — both digital (text-based)
and scanned-image — are forwarded to the provider as raw bytes, never rasterized locally;
OpenAI and Anthropic accept them natively, **Ollama throws on PDF input** (see
`providers-and-privacy.md`).

## Single call vs pages

```ts
// One form spread over several scanned pages — every page in ONE model call:
const result = await extractor.extractFromPages({
  pages: [
    readFileSync("./page-1.png"),
    readFileSync("./page-2.png"),
  ],
  formDefinition: surveyJson,
});
```

Prefer `extractFromPages` for multi-page forms. A per-page `extractFromImage` loop makes
each page report the sections it lacks as high-confidence blanks, which a naive merge then
uses to overwrite real answers from other pages. If token limits genuinely force per-page
calls, combine the results with `mergeExtractionResults` (see `review-and-merge.md`), which
merges by the non-empty-beats-empty rule.

Both methods take an optional `uniqueIdHint` string, used as the fallback when no QR code or
printed ID is detected on the document.

## Options (`ExtractionOptions`)

| Option | Default | Notes |
| :-- | :-- | :-- |
| `confidenceThreshold` | `0.75` | Fields whose confidence is below this arrive `flagged` for review |
| `maxRetries` | `2` | Re-prompts after invalid JSON, truncation, or schema-validation failure (so up to 3 attempts total) |
| `preprocessImage` | `true` | With `sharp`: downscale to ≤ 2048 px, normalize contrast, re-encode PNG. PDFs pass through untouched; without `sharp` it is a no-op |
| `logCosts` | `false` | Adds `result.usage` with prompt/completion/total token counts when the provider reports them |

## Result shape (`ExtractionResult`)

```ts
interface ExtractionResult {
  data: Record<string, unknown>;   // responses keyed by field name; unread fields are null
  uniqueId: string | null;         // QR / printed ID / uniqueIdHint, or null
  confidence: FieldConfidence[];   // one entry per schema field — see schemas-and-validation.md
  rawResponse?: string;            // raw LLM output, for debugging — keep out of logs
  usage?: { promptTokens: number; completionTokens: number;
            totalTokens: number; estimatedCost?: number };  // only with logCosts
}
```

## Error handling

The extractor already retries internally (`maxRetries`); when attempts are exhausted it
throws one `Error` listing every attempt's failure — invalid JSON from the model, a
truncated response (token limit), or Zod schema-validation failure. Other throws are
immediate: unsupported input format, PDF sent to Ollama, missing provider SDK, missing API
key env var.

```ts
try {
  const result = await extractor.extractFromImage({ image, formDefinition });
  await store(result);
} catch (err) {
  // Unreadable or unsupported document, provider outage, or persistently invalid output.
  // Queue the ORIGINAL document for manual entry — never substitute guessed data.
  await queueForManualEntry(documentId, String(err));
}
```

Do not log the document bytes or `result.rawResponse` in production — both contain
everything written on the form.
