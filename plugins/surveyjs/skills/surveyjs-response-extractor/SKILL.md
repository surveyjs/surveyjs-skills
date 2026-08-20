---
name: surveyjs-response-extractor
description: >
  Extract structured survey responses from scanned or photographed paper forms, images, and
  PDFs with SurveyJS AI Form Response Extractor (the ai-form-response-extractor npm package) —
  a server-side Node.js library that runs a multimodal LLM (OpenAI, Anthropic, or local
  Ollama) guided by a SurveyJS or JSON Schema form definition, returns per-field confidence
  for human review, detects QR codes and unique IDs, and merges paper and online submissions
  into one dataset. Use when working with ai-form-response-extractor or createExtractor, when
  digitizing filled paper forms, extracting answers from a scan, photo, or PDF of a completed
  form, reviewing low-confidence extractions, choosing a cloud or local provider for document
  processing, or combining paper and online survey responses.
---

# SurveyJS AI Form Response Extractor

Reads a *filled-in* form — a scan, a phone photo, a digital PDF — and returns the answers as
the same structured JSON object an online SurveyJS submission produces, using a multimodal
LLM guided by the form's schema. It is a **server-side Node.js library** (`node >= 18`) with
no browser build. Mind the direction: this product extracts responses *from* input documents.
Producing a PDF *from* a survey is the opposite direction and belongs to
`surveyjs-pdf-generator`.

Not this skill:

- Rendering the interactive form in the browser → `surveyjs-integration`
- The survey JSON itself — question types, validators, expressions → `surveyjs-form-json`
- Embedding the drag-and-drop builder → `surveyjs-creator-customization`
- Charts and tables from collected responses → `surveyjs-dashboard`
- Generating or printing a PDF from a schema, or filling an existing PDF's fields →
  `surveyjs-pdf-generator` (use it to *print* the blank paper form this skill later reads)

## Read this first: corrections

The package is newer than most training data, so the failure mode is invention — plausible
APIs that do not exist, or generic OCR patterns. **Check generated code against this table
before returning it.**

| Never write | Write instead |
| :-- | :-- |
| Importing `ai-form-response-extractor` in browser or client-component code | Node.js server code only — there is no browser build. The review UI runs in the browser; extraction does not |
| `import { openai } from "ai-form-response-extractor"` | Providers live on a subpath: `import { openai, anthropic, ollama } from "ai-form-response-extractor/providers"` |
| `openai({ apiKey: "sk-..." })` or any API key in code | Factories take a model id — `openai("gpt-4o")`. Keys come only from env vars: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (`OLLAMA_BASE_URL` for the server URL) |
| A per-page `extractFromImage` loop merged by confidence | `extractFromPages({ pages, formDefinition })` — every page in one model call. `mergeExtractionResults` is only the token-budget fallback |
| Treating `confidence: null` as `0`, or averaging it into a score | `null` means "no signal — the field is probably blank"; it is never flagged. Exclude it from aggregates |
| `setLicenseKey(...)` or any license activation | The product is MIT-licensed — no license key exists for it |
| Hand-rolled Tesseract/OCR plus prompt glue to read a form | `createExtractor(...)` — schema-guided prompting with Zod validation, retries, and confidence built in |

## Package

```bash
npm install ai-form-response-extractor
```

- Add the SDK for the provider you use: `npm install openai` for OpenAI,
  `npm install @anthropic-ai/sdk` for Anthropic. **Ollama needs no SDK** — plain HTTP to a
  local server. Both SDKs are optional peer dependencies; a missing one throws a clear error
  at call time, not install time.
- `sharp` is an optional peer dependency — without it, image preprocessing is skipped and QR
  detection cannot read pixels. Install it when handling phone photos or QR-coded forms.
- Main entry exports `createExtractor`, `detectUniqueId`, `mergeResponses`,
  `mergeExtractionResults`; the `/providers` subpath exports `openai`, `anthropic`, `ollama`.

## Guardrails

**Where documents go is a decision, not a default.** `openai(...)` and `anthropic(...)` send
the document image — and any personal data written on it — to that third-party API.
`ollama(...)` keeps processing on infrastructure the user runs. Say which one an answer
implies, and let the user decide. Choosing a local provider does not by itself make a
workflow GDPR- or HIPAA-compliant; retention, consent, and access control remain the
application's job.

**Extraction is uncertain.** Every result carries per-field confidence; fields below the
threshold arrive `flagged` for human review. Keep that information — surface flagged fields
to a reviewer (the documented pattern loads `result.data` into a Form Library survey for
correction), and never fill in, coerce, or default an answer the model did not read. A blank
field stays `null`.

**Handle failure without leaking documents.** Extraction throws after its internal retries —
on unreadable input, unsupported formats, provider errors, or output that fails schema
validation. Route the failed document to manual entry instead of faking data, and keep the
document bytes, `result.rawResponse`, and API keys out of application logs.

**AI Form Response Extractor is MIT-licensed.** No license key, no activation code, no
banner. Do not copy commercial-license setup from the Creator, Dashboard, or PDF Generator
skills into extractor code.

## Routing

| Task | Read |
| :-- | :-- |
| Install, `createExtractor` config and options, input types, single vs multi-page, PDFs, error handling | `references/setup-and-inputs.md` |
| OpenAI / Anthropic / Ollama setup, env vars, per-provider PDF support, custom providers, privacy and data residency | `references/providers-and-privacy.md` |
| SurveyJS / JSON Schema / custom adapters, `aiHint`, output validation, the confidence model | `references/schemas-and-validation.md` |
| Reviewing flagged fields, QR and unique IDs, merging paper with online responses, failure handling | `references/review-and-merge.md` |

## Fetching current docs

The package's GitHub repository is the authority for executable API details:

- README — `https://raw.githubusercontent.com/surveyjs/ai-form-response-extractor/main/README.md`
- Spec — `https://raw.githubusercontent.com/surveyjs/ai-form-response-extractor/main/SPEC.md`
- Source of record for types and exports — `src/index.ts`, `src/core/types.ts` in the repo
- Workflow overview — `https://surveyjs.io/documentation/combine-paper-and-online-survey-form-data.md`
- Working demo app — `https://github.com/surveyjs/ai-form-response-extractor-demo`
- Package metadata — `https://www.npmjs.com/package/ai-form-response-extractor`

Escalation order when stuck: reference file → repository README and source → demo app →
workflow overview doc → [llms.txt](https://surveyjs.io/llms.txt) for orientation. The
package is young and its API moves faster than blog posts — prefer the repository over
anything secondhand.

## Before you finish

- [ ] Extraction code runs server-side on Node ≥ 18; nothing from the package is imported
      into browser bundles or client components
- [ ] The chosen provider's SDK is installed (`openai` / `@anthropic-ai/sdk`; none for
      Ollama); `sharp` added when photos or QR detection are involved
- [ ] Providers imported from `ai-form-response-extractor/providers`; API keys only via
      environment variables, never in code, config files, or logs
- [ ] Multi-page forms go through `extractFromPages`, not a per-page loop
- [ ] `flagged` fields reach a human reviewer; `confidence: null` excluded from aggregates
- [ ] Missing answers remain `null` — no defaults, no invented values
- [ ] The answer states where document images are sent for the chosen provider and, for
      Ollama, that processing stays on the user's infrastructure
- [ ] No license-key or activation code — the product is MIT
