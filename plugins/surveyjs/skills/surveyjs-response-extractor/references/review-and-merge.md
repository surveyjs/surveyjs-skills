# Human review, unique IDs, and merging

## Reviewing flagged fields

Extraction is uncertain by nature — the workflow is *extract → review → store*, not
*extract → store*. Fields with `flagged: true` (confidence below the threshold) need a
human decision. The documented review pattern reuses the Form Library: send `result.data`
to the browser, assign it to a rendered survey, and let a reviewer verify and correct
before the response is accepted:

```ts
// client side — plain surveyjs-integration territory
const survey = new Model(surveyJson);       // the SAME schema used for extraction
survey.data = extractionResultData;          // pre-fill with extracted answers
// reviewer fixes flagged/incorrect fields, then onComplete stores the verified data
```

Store the confidence array (and which fields a human corrected) alongside the response if
the application needs an audit trail. What travels to the browser is extracted *data* —
the extractor package itself stays on the server.

Accuracy expectations to set with users: results are best with flat, well-lit scans and
printed text; handwriting, skewed photos, and unusual layouts lower confidence. Digital
PDFs extract more reliably than photos because providers can use the document's internal
text.

## Unique IDs and QR codes

To match a paper response to a person or an online record, print a unique ID or QR code on
the form (generating that printable PDF is `surveyjs-pdf-generator`'s job). During
extraction the library detects it automatically and sets `result.uniqueId`; the
`uniqueIdHint` input is the fallback when nothing is detected on the document.

Standalone detection, without running an extraction:

```ts
import { detectUniqueId } from "ai-form-response-extractor";

const { id, source, confidence } = await detectUniqueId(imageBuffer);
// source: "qr" (needs sharp installed; confidence 1.0)
//         "text" — a UUID (0.7) or an "ID: 12345"-style printed number (0.5) found in the data
//         null — nothing detected
```

QR decoding reads pixels via `sharp` + `jsqr` — without `sharp` installed only the text
fallbacks run.

## Merging paper and online responses

`mergeResponses` unifies both channels into one dataset, matching records by unique ID:

```ts
import { mergeResponses } from "ai-form-response-extractor";

const merged = mergeResponses(onlineResponses, paperExtractions, {
  conflictResolution: "prefer-online",   // default; or "prefer-paper" | "highest-confidence"
});
```

- `onlineResponses` is an array of plain response objects; each is matched through its
  `uniqueId` property (the `uniqueId` key itself is dropped from the merged output).
- `paperExtractions` is an array of `ExtractionResult`s; several scans carrying the same ID
  are combined before merging.
- Records with no ID on either side pass through unmatched rather than being guessed
  together.

Each merged record reports its provenance:

```ts
interface MergedRecord {
  [field: string]: unknown;
  _source: "merged" | "online" | "paper";           // matched pair, or unmatched record
  _uniqueId: string | null;
  _mergeDetails?: Record<string, "online" | "paper">; // per-field winner, on "merged" records
}
```

Strategy semantics for a field present in **both** sources: `prefer-online` and
`prefer-paper` pick that side; `highest-confidence` compares the paper field's confidence
against online's implicit `1.0`, with ties going online — so in practice it too keeps
online values for conflicts and its value is in letting paper fill what online left empty.
Fields present on only one side are always taken from that side.

## Per-page merge fallback

`mergeExtractionResults(results)` combines per-page `ExtractionResult`s of the *same* form.
Use it **only** when one `extractFromPages` call would blow the token budget. Its rule: a
non-empty value beats an empty one regardless of confidence (a page that lacks a section
reports those fields as confident blanks — this rule stops them from erasing real answers);
confidence only breaks ties within the same emptiness class, and exact ties keep the
earlier page.

## Failure handling in a batch pipeline

| Failure | What happens | What to do |
| :-- | :-- | :-- |
| Unreadable / blank / wrong document | Fields come back `null`; genuinely ambiguous ones flagged low-confidence | Route to human review; a mostly-null result on a required-heavy form is a "wrong document" signal |
| Unsupported file format | Throws immediately (magic-byte check) | Validate uploads early; accept PNG/JPEG/WebP/GIF/PDF |
| PDF with Ollama | Throws immediately | Convert pages to images, or use a PDF-capable provider |
| Provider outage / invalid output | Throws after `maxRetries` re-prompts, message lists each attempt | Queue the original document for retry or manual entry — never substitute invented data |
| Ambiguous handwriting | Low confidence, `flagged: true` | Reviewer decides; consider an `aiHint` if one field fails systematically |

Keep the originals: the scan is the source of truth the reviewer falls back to, so store it
securely with the same care as the extracted personal data — and keep document bytes,
`rawResponse`, and API keys out of logs.
