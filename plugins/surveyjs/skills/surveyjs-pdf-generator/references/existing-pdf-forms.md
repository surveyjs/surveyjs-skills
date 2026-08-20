# Filling an existing PDF's form fields (PDFFormFiller)

This workflow is the inverse of ordinary generation: the PDF **already exists** — a
government form, an insurance template, anything with interactive AcroForm fields — and
survey answers get mapped into those fields. Nothing is laid out; the document keeps its
exact original appearance. If the task is "export the survey as a PDF", stop here and use
`references/setup.md` instead.

## Pieces

`PDFFormFiller` is a plugin shipped inside `survey-pdf`, imported from its own subpath. It
does not touch PDFs itself — it drives one of two third-party libraries through an adapter,
and **that library is installed by you** (it is not a dependency of `survey-pdf`):

| Adapter | Third-party library | Install |
| :-- | :-- | :-- |
| `PDFLibAdapter` | [pdf-lib](https://pdf-lib.js.org) | `npm install pdf-lib` |
| `PDFJSAdapter` | [PDF.js](https://mozilla.github.io/pdf.js/) | `npm install pdfjs-dist` (requires configuring its worker script path) |

Both produce a filled PDF; pdf-lib is the simpler dependency, PDF.js fits apps that already
use it for rendering. Pick one — do not wire both.

## Usage

```js
import { PDFFormFiller, PDFLibAdapter } from "survey-pdf/pdf-form-filler";
import * as PDFLib from "pdf-lib";

const form = new PDFFormFiller({
  pdfLibraryAdapter: new PDFLibAdapter(PDFLib),  // or new PDFJSAdapter(pdfjsLib)
  pdfTemplate: pdfTemplate,   // the existing PDF: fetched from your server or a Base64 string
  data: survey.data,          // response object keyed by question name
  fieldMap: fieldMap          // survey question name -> PDF field ID
});
form.save("FilledForm.pdf");
```

- `pdfTemplate` — the source document with interactive fields. Load it from your own server
  or embed it as Base64; there is no SurveyJS-hosted storage.
- `data` — the same response object `onComplete` produced (`survey.data`).
- `save(name)` downloads the filled document.

## Field mapping

`fieldMap` pairs survey question `name`s with the PDF's internal field IDs. For text-like
fields it is a flat string map:

```js
const fieldMap = {
  "employer": "Employer",        // survey question name -> PDF field ID
  "position": "Position",
  "name": "Candidate Name"
};
```

Checkboxes, Dynamic Matrix, and Dynamic Panel questions need structured entries — nested
objects (which PDF field corresponds to which selected value) or arrays of per-row/per-panel
field objects. Copy the exact shape from the official examples rather than improvising:

- pdf-lib —
  `https://surveyjs.io/pdf-generator/examples/map-survey-responses-to-pdf-fields-using-pdflib/documentation.md`
- PDF.js —
  `https://surveyjs.io/pdf-generator/examples/fill-in-pdf-form-fields-with-dynamic-survey-data-using-pdfjs/documentation.md`

To discover the PDF's field IDs, inspect the template with the chosen library (e.g.
pdf-lib's `getForm().getFields()`) or a PDF editor — the IDs are whatever the document's
author named them, not the survey's question names.

## Boundaries

- The target PDF must already contain interactive form fields. PDFFormFiller does not add
  fields to a flat document — generating a new fillable PDF from the schema is the
  `SurveyPDF` workflow.
- PDFFormFiller is part of the commercial PDF Generator product; the licensing guardrail in
  `SKILL.md` applies here too.
