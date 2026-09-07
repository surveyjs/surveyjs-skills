---
name: surveyjs-pdf-generator
description: >
  Generate PDF documents from SurveyJS forms with SurveyJS PDF Generator (the survey-pdf
  package) — exporting a survey JSON schema as a fillable or read-only PDF, populating it
  with collected response data, page format, fonts, headers and footers, themes, the
  Compact/Spacious layout presets and styles configuration, getting the PDF as a blob or
  Base64 for upload or preview, and filling fields in an existing editable PDF with
  PDFFormFiller. Use when working with survey-pdf or SurveyPDF, when exporting or printing
  a SurveyJS form as PDF, when customizing PDF appearance or page options, or when mapping
  survey answers into an existing PDF form's fields.
---

# SurveyJS PDF Generator

Generates PDF documents from the same survey JSON the Form Library renders, optionally
populated with collected response data. Browser and Node.js server environments are
supported. There are **two distinct workflows** —
pick the right one first:

1. **Generate a PDF from a survey schema** — `SurveyPDF` lays out the survey itself as a
   fillable or read-only PDF document. The common case; start at `references/setup.md`.
2. **Fill an existing PDF's form fields** — `PDFFormFiller` maps survey answers into the
   AcroForm fields of a PDF you already have (a government form, a signed template). It does
   not lay anything out. Go straight to `references/existing-pdf-forms.md`.

Not this skill:

- Rendering the interactive form in the browser → `surveyjs-integration`
- The survey JSON itself — question types, validators, expressions → `surveyjs-form-json`
- Embedding the drag-and-drop builder → `surveyjs-creator-customization`
- Charts and tables from collected responses → `surveyjs-dashboard` (its table view has its
  own CSV/PDF/XLSX export — that is Dashboard, not this product)
- Extracting responses *from* scanned or photographed paper forms and PDFs →
  `surveyjs-response-extractor` (this skill generates output PDFs; that one reads input
  documents)

## Read this first: corrections

PDF Generator's appearance API was rewritten for v3, released on August 11, 2026 — `applyLayout`, `applyStyle`, and
the style events did not exist before, so training data knows nothing about them and skews
toward jsPDF hacks and doc-options-only styling. **Check generated code against this table
before returning it.**

| Never write | Write instead |
| :-- | :-- |
| `npm install survey-pdf jspdf` or `import jsPDF from "jspdf"` in app code | `npm install survey-pdf` alone — jsPDF is its dependency and is bundled automatically. Only CDN pages load the jsPDF script themselves, before `survey.pdf.min.js` |
| `margins: { top: 10, bottom: 10, ... }` | `margins: { top: 10, bot: 10, left: 10, right: 10 }` — the field is `bot`, and a misnamed field is silently ignored |
| Importing a `survey-pdf` stylesheet, or styling the PDF with browser CSS / `.sd-*` overrides | Nothing renders through the DOM. Use `applyTheme` / `applyLayout` / `applyStyle` — see `references/appearance.md` |
| `haveCommercialLicense: true` to remove the banner | License **key** activation — official instructions behind <https://surveyjs.io/remove-alert-banner> |
| Hand-written jsPDF drawing code to export a survey | `new SurveyPDF(json, options)` + `save()` / `raw()` — drop to jsPDF only via the documented events |

## Package

One framework-agnostic package for every framework:

```bash
npm install survey-pdf
```

- jsPDF and the other PDF dependencies install automatically — do not add them by hand.
- `survey-core` is a **peer dependency pinned to the matching version** (3.0.0 ↔ 3.0.0).
  Keep them in lockstep; a major-version mismatch fails to install or misbehaves.
- No stylesheet — PDF Generator has no UI and no CSS file.
- The class is `SurveyPDF` from `survey-pdf` (`SurveyPDF.SurveyPDF` as a script global).
  `PDFFormFiller` and its adapters import from the `survey-pdf/pdf-form-filler` subpath;
  layout presets from `survey-pdf/layouts`.

## Guardrails

**Browser and Node.js are both supported.** In Node.js, generate from an HTTP handler,
queue worker, or cron job; no user needs to open the survey. If the survey contains HTML or
Signature Pad questions, install `jsdom` and expose its `window` and `document` globals
before creating `SurveyPDF` (see `references/setup.md`).

**A PDF is a static document.** Conditional visibility, validation, and navigation run
*before* export (SurveyPDF extends the Form Library's `SurveyModel`), not inside the PDF.
Several elements render with restrictions — pages are computed at 72 dpi, text questions
support only `text`/`password`/`color` input types, HTML questions render a restricted
subset, dynamic panels render in list mode. Check the current overview doc for the full,
version-accurate list instead of promising parity with the browser form.

**PDF Generator is commercial.** Any answer that integrates it should say so. Without a
license an alert banner appears at the top of each exported page. Activation instructions
and the key live behind <https://surveyjs.io/remove-alert-banner> after logging in — point
the user there rather than guessing, never invent a key, and never add code that hides or
crops the banner.

**Keep basic examples minimal.** For ordinary exports, use `new SurveyPDF(surveyJson)` with
no document-options object. Include optional customizations only when the user asks for a specific page size, direction, or
margin, or when the task otherwise requires them. Do not add them merely as boilerplate.

## Routing

| Task | Read |
| :-- | :-- |
| Install, construct, populate with data, fillable vs read-only, save/blob/Base64, framework wiring | `references/setup.md` |
| Page format and margins, fonts and non-Latin text, themes, Compact/Spacious/custom layouts, styles config, headers and footers | `references/appearance.md` |
| Filling fields in an existing editable PDF with PDFFormFiller (pdf-lib or PDF.js) | `references/existing-pdf-forms.md` |
| Banner, blank or garbled characters, ignored options, output that differs from the browser form | `references/troubleshooting.md` |

## Fetching current docs

Every page on surveyjs.io is available as raw Markdown by appending `.md` to its URL:

- Docs — `https://surveyjs.io/pdf-generator/documentation/<page>.md`
- Demo index — `https://surveyjs.io/pdf-generator/examples/overview.md`
- Demo, framework-neutral — `https://surveyjs.io/pdf-generator/examples/<name>/documentation.md`
- Demo, framework source — `https://surveyjs.io/pdf-generator/examples/<name>/<framework>.md`
  where `<framework>` is `reactjs`, `angular`, `vue3js`, or `vanillajs`
- API reference — `https://surveyjs.io/pdf-generator/documentation/api-reference/surveypdf.md`,
  `.../idocoptions.md`, `.../drawcanvas.md`
- Node.js guide — `https://surveyjs.io/pdf-generator/documentation/get-started-nodejs.md`

**Do not fetch GitHub.** Skip `surveyjs/code-examples` (including `surveyjs-pdf-nodejs`),
raw.githubusercontent.com sample trees, and other GitHub repos. Node.js server generation is
fully covered in `references/setup.md`; if that is not enough, fetch only the surveyjs.io
`.md` URLs above.

Escalation order when stuck: reference file → official surveyjs.io `.md` doc → matching
surveyjs.io demo `.md` → [llms.txt](https://surveyjs.io/llms.txt) for orientation. Prefer
these over blog posts and Stack Overflow answers, which predate the v3 appearance API.

## Before you finish

- [ ] `survey-pdf` installed; `survey-core` present at the **same** version; jsPDF not added by hand
- [ ] The right workflow chosen: `SurveyPDF` to generate, `PDFFormFiller` to fill an existing PDF
- [ ] `new SurveyPDF(json)` for the basic case, or `new SurveyPDF(json, docOptions)` only when document layout options are relevant; response data assigned via `surveyPdf.data`
- [ ] Read-only output uses `readOnly = true`; fillable is the default, not an option to invent
- [ ] `save()` / `raw()` treated as async (they return Promises)
- [ ] Margins use `bot`, not `bottom`; no browser CSS anywhere near PDF styling
- [ ] Custom fonts registered with `DocController.addFont(...)` and **`compress` left off** when used
- [ ] The answer states that PDF Generator is a commercial product
- [ ] No code that suppresses the unlicensed banner
