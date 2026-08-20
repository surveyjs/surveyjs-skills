# Troubleshooting

Work down this list — the causes are ordered by how often they bite.

## Alert banner at the top of each page

The unlicensed state, not a bug. PDF Generator requires a commercial developer license for
commercial integration. Activation instructions and the license key live behind
<https://surveyjs.io/remove-alert-banner> (login required). Never invent a key, never crop
or cover the banner, never claim a free tier exists.

## Non-Latin or accented characters render blank or garbled

The 14 built-in PDF fonts carry no glyphs for Cyrillic, CJK, Arabic, Hebrew, Greek, and
many accented Latin characters. Embed a TTF via `DocController.addFont(name, base64, style)`
and set `fontName` to it — full recipe in `references/appearance.md`. For right-to-left
scripts also set `isRTL: true`.

## Custom font is registered but ignored

- `compress: true` in `IDocOptions` does not support custom fonts. Remove it.
- HTML questions keep the default font unless `useCustomFontInHtml: true` is set.
- The `fontName` value must match the name passed to `addFont` exactly.

## An `IDocOptions` value has no effect

- Margins: the field is `bot` — `bottom` is silently ignored.
- Custom `format` dimensions are `[width, height]` in millimeters, not points or pixels.
- Options belong to the constructor's second argument; setting them on the instance after
  construction is not the documented path.

## Install fails or export throws immediately

`survey-core` is a peer dependency pinned to the same version as `survey-pdf`. Run
`npm ls survey-core survey-pdf` — any major/minor mismatch (often from installing
`survey-core` directly at a different version) must be aligned. On CDN pages, script order
matters: jsPDF, then `survey.core.min.js`, then `survey.pdf.min.js`.

## Generated fields are not editable, or should not be

Fillable is the default. `surveyPdf.readOnly = true` makes the whole document non-editable;
`readonlyRenderAs` (`"text"` vs `"acroform"`) controls how read-only elements look. If a
"filled" PDF was needed rather than a generated one, that is the PDFFormFiller workflow —
`references/existing-pdf-forms.md`.

## The PDF does not match the browser form

Expected to a degree — the PDF is a static 72-dpi layout, not a screenshot:

- Conditional visibility/validation are evaluated once at export; nothing is dynamic inside
  the document.
- Known restrictions: text questions support only `text`/`password`/`color` input types;
  HTML questions render a restricted subset (`htmlRenderAs: "image"` is the escape hatch);
  Image Picker uses fill mode; panels cannot collapse; dynamic panels render as a list.
- The exact unsupported list moves between versions — verify against
  <https://surveyjs.io/pdf-generator/documentation/overview.md> before telling a user
  something cannot be done.
- Colors/spacing differences: the PDF renders with its own theme/layout (Compact by
  default), not the page's CSS. Apply the same theme JSON via `applyTheme` if visual parity
  matters.

## Images missing, distorted, or low quality

`applyImageFit: false` (default) exports images as-is but stretches them to their container;
`applyImageFit: true` honors the schema's `imageFit` at the cost of quality (extra
conversions). Pick per requirement.

## File is too large

Embedded custom fonts are the usual cause — register only the styles actually used, or fall
back to a built-in font. `compress: true` shrinks the file but excludes custom fonts.

## `save()`/`raw()` produce nothing

Both are async. An un-awaited rejection disappears silently — `await surveyPdf.save()` (or
`.catch(...)`) and check the console. In React, make sure the call runs in a client-side
event handler, not during SSR.
