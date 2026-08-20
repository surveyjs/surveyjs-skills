# Setup, data flow, and export

## Install

```bash
npm install survey-pdf
```

jsPDF is a dependency of `survey-pdf` and installs automatically — never add it to
`package.json` yourself in a bundled app. `survey-core` is a **peer dependency pinned to the
matching version**; npm ≥ 7 installs it, but if the project already carries a different
`survey-core` version the install fails or misbehaves. Check alignment first:

```bash
npm ls survey-core survey-pdf
```

There is no stylesheet to import. PDF Generator renders straight to a PDF document, not to
the DOM.

## Core flow — same on every framework

```js
import { SurveyPDF } from "survey-pdf";

const pdfDocOptions = { fontSize: 12, margins: { top: 10, bot: 10, left: 10, right: 10 } };

function savePdf(surveyData) {
  const surveyPdf = new SurveyPDF(surveyJson, pdfDocOptions);
  surveyPdf.data = surveyData;          // omit to export a blank, unfilled template
  surveyPdf.save("my-form");            // default file name: "survey_result"
}
```

- The constructor takes the **survey JSON schema** (the same object the Form Library
  renders) and an optional `IDocOptions` object.
- `SurveyPDF` extends the Form Library's `SurveyModel`, so schema behavior — locale,
  calculated values, conditional visibility — is evaluated the same way at export time.
- `surveyPdf.data` is one response object keyed by question `name` — exactly what
  `survey.data` held in `onComplete`. Assign it to produce a populated PDF; leave it unset
  to produce an empty form template.
- `save()` returns a Promise and triggers a browser download.

The usual trigger is a button on the completed survey. The official pattern adds a
navigation item to the *interactive* survey model (from `surveyjs-integration`) that calls
the export helper:

```js
survey.addNavigationItem({
  id: "pdf-export",
  title: "Save as PDF",
  action: () => savePdf(survey.data)
});
```

## Fillable vs read-only

By default the generated PDF is **fillable**: text boxes, drop-downs, and radio groups are
interactive AcroForm fields a user can edit in a PDF viewer. Two knobs change that:

```js
const surveyPdf = new SurveyPDF(surveyJson, pdfDocOptions);
surveyPdf.data = surveyResults;
surveyPdf.readOnly = true;      // non-editable document for viewing/archiving
surveyPdf.save();
```

- `readOnly = true` — the whole document becomes non-editable. Combine with `data` for an
  archival copy of a submission.
- `readonlyRenderAs` in `IDocOptions` (`"auto"` | `"text"` | `"acroform"`) controls whether
  read-only elements render as plain text or as disabled form fields.

There is no other "export mode" — do not invent a `mode`/`isFlattened` option.

## Getting the PDF without downloading it

`raw()` returns the document for preview, upload, or emailing instead of a file download.
All variants are async:

```js
surveyPdf.raw().then((raw) => { /* raw PDF content as a string */ });
surveyPdf.raw("blob").then((blob) => { /* POST to your API, store */ });
surveyPdf.raw("bloburl").then((url) => { /* <embed src={url}> for inline preview */ });
surveyPdf.raw("dataurlstring").then((dataUrl) => { /* Base64 data: URL for embedding */ });
```

An `"arraybuffer"` variant also exists. Uploading to a server means POSTing the blob to
**your own** endpoint — generation itself always happens in the browser.

## Document options (`IDocOptions`)

The second constructor argument. The most-used properties:

| Property | Default | Notes |
| :-- | :-- | :-- |
| `format` | `"a4"` | Page format code (`a0`–`a10`, `b*`, `c*`, `letter`, `legal`, …) or `[width, height]` in **millimeters** |
| `orientation` | `"p"` | `"p"` portrait, `"l"` landscape |
| `fontSize` | `14` | Points; other dimensions scale from it |
| `fontName` | `"Helvetica"` | See `references/appearance.md` for fonts |
| `margins` | — | `{ top, bot, left, right }` — the field is **`bot`** |
| `compress` | `false` | Smaller file, but **incompatible with custom fonts** |
| `applyImageFit` | `false` | Honors the schema's `imageFit`, at the cost of image quality |
| `htmlRenderAs` | `"auto"` | `"standard"` \| `"image"` \| `"auto"` — how HTML questions render |
| `matrixRenderAs` | `"auto"` | `"auto"` \| `"list"` |
| `readonlyRenderAs` | `"auto"` | `"auto"` \| `"text"` \| `"acroform"` |
| `isRTL` | `false` | Right-to-left languages |
| `useCustomFontInHtml` | `false` | Apply a registered custom font inside HTML questions |
| `tagboxSelectedChoicesOnly` | `false` | Render only the selected tagbox choices |

Full list: <https://surveyjs.io/pdf-generator/documentation/api-reference/idocoptions>.

## Framework wiring

The package is UI-less, so framework integration is thin — construct and save inside an
event handler. The only framework-specific points:

- **React / Next.js** — a component that triggers export must be a client component
  (`'use client'`); create the `SurveyPDF` inside the handler, not during render.
- **Angular / Vue 3** — nothing special: import `SurveyPDF` and call the helper from a
  navigation item or button handler. The interactive form setup itself belongs to
  `surveyjs-integration`.
- **CDN / vanilla JS** — load jsPDF **before** `survey-pdf`, and use the namespaced global:

```html
<script src="https://unpkg.com/jspdf/dist/jspdf.umd.min.js"></script>
<script src="https://unpkg.com/survey-core/survey.core.min.js"></script>
<script src="https://unpkg.com/survey-pdf/survey.pdf.min.js"></script>
<script>
  const surveyPdf = new SurveyPDF.SurveyPDF(surveyJson, pdfDocOptions);
</script>
```

Per-framework get-started docs:
`https://surveyjs.io/pdf-generator/documentation/get-started-react.md` (also `-angular`,
`-vue`, `-html-css-javascript`).
