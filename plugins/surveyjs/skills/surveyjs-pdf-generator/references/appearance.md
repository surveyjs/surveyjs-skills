# Appearance: themes, layouts, styles, fonts, headers and footers

None of this is browser CSS. There is no stylesheet and no DOM — themes, layouts, and styles
are configuration objects the PDF renderer reads. The three mechanisms split cleanly:

| Mechanism | Controls | API |
| :-- | :-- | :-- |
| Theme | Colors and shadows | `applyTheme(theme, baseTheme?)` |
| Layout | Spacing, sizing, typography, border radius — dimensional properties | `applyLayout(layout, baseLayout?)` |
| Styles config | Fine-grained, per-element-type or per-element overrides | `applyStyle(...)` + `onGet*Style` events |

`applyLayout` and `applyStyle` are **new in v3 (2025)** — code that predates them styled
PDFs through doc options and jsPDF hacks. Do not reproduce those patterns.

## Themes

PDF Generator applies the color/shadow variables of the same UI themes the Form Library
uses (`survey-core/themes`). For print, the high-contrast **Monochrome Light** theme is the
recommended default:

```js
import { MonochromeLight } from "survey-core/themes";

const surveyPdf = new SurveyPDF(surveyJson, pdfDocOptions);
surveyPdf.applyTheme(MonochromeLight);
```

A custom theme JSON (e.g. exported from Survey Creator's theme editor) works the same way —
only its color and shadow variables affect the PDF; dimensional settings belong to layouts.

## Layout presets

Two predefined layouts ship in the `survey-pdf/layouts` subpath. **Compact** (dense, fewer
pages, data-heavy forms) is the default; **Spacious** increases spacing and proportions for
readability:

```js
import { Spacious } from "survey-pdf/layouts";
surveyPdf.applyLayout(Spacious);
```

A custom layout is a plain object of `--sjs2-*` CSS-variable names — the same design tokens
the browser products use, interpreted by the PDF renderer:

```js
const customLayout = {
  "--sjs2-typography-font-family-text": "Noto Serif",
  "--sjs2-pdf-border-width-question": "var(--sjs2-border-width-x200)"
};
surveyPdf.applyLayout(customLayout);            // on top of the default (Compact)
surveyPdf.applyLayout(customLayout, Spacious);  // on top of Spacious
```

Token catalog: <https://surveyjs.io/documentation/design-tokens-css-customization.md>. The
PDF-specific tokens are prefixed `--sjs2-pdf-`.

## Styles config

`applyStyle` customizes element *types* through a hierarchical object — top-level keys such
as `survey`, `page`, `panel`, `question`, `dropdown`, `radiogroup`:

```js
surveyPdf.applyStyle({
  radiogroup: { spacing: { choiceGap: 10 } },
  survey: { title: { fontColor: "#1F3A5F" } }
});
```

To stay theme-aware, pass a callback and resolve values from the active theme/layout:

```js
surveyPdf.applyStyle(({ getSizeVariable, getColorVariable }) => ({
  survey: { title: { fontColor: getColorVariable("--sjs2-palette-gray-800") } }
}));
```

For *individual* elements, handle the style events raised during rendering —
`onGetPageStyle`, `onGetPanelStyle`, `onGetQuestionStyle`, `onGetItemStyle`:

```js
surveyPdf.onGetItemStyle.add((_, options) => {
  if (options.question.name === "colors") {
    options.style.choiceText.fontColor = options.item.value;
  }
});
```

Reference: <https://surveyjs.io/pdf-generator/documentation/pdf-appearance-customization.md>.

## Fonts

The PDF standard ships 14 built-in fonts — Helvetica (default), Courier, Times, Symbol,
ZapfDingbats, with bold/italic variants. Select one with `fontName` in `IDocOptions`.

**Any other typeface — and any non-Latin script — must be embedded.** The built-in fonts
have no glyphs for Cyrillic, CJK, Arabic, Hebrew, Greek, and many accented characters;
without embedding, those render blank or garbled. Register a Base64-encoded TTF once, then
reference it by name:

```js
import { DocController, SurveyPDF } from "survey-pdf";

DocController.addFont("Noto Sans KR", notoSansKrBase64, "normal"); // also "bold" | "italic" | "bolditalic"

const surveyPdf = new SurveyPDF(surveyJson, {
  fontName: "Noto Sans KR",
  useCustomFontInHtml: true   // only needed if HTML questions must use it too
});
```

Two verified constraints:

- `compress: true` does **not** support custom fonts — pick one or the other.
- Embedded fonts grow the file; register only the styles you use.

For right-to-left languages additionally set `isRTL: true` in `IDocOptions`.

## Headers and footers

`onRenderHeader` / `onRenderFooter` fire per page with a `DrawCanvas` for text and images:

```js
surveyPdf.onRenderFooter.add((_, canvas) => {
  canvas.drawText({
    text: "Page " + canvas.pageNumber + " of " + canvas.pageCount,
    fontSize: 10,
    horizontalAlign: "right",
    margins: { right: 12 }
  });
});
```

- `drawText({ text, fontSize, horizontalAlign, verticalAlign, margins })` and
  `drawImage(...)` are the drawing primitives; `canvas.pageNumber` / `canvas.pageCount`
  give numbering.
- A logo set through the survey JSON's `logo` property exports automatically, honoring
  `logoPosition` and sizing — no event handler needed for that case.
- The same event pair drives background images/watermarks — demo:
  `https://surveyjs.io/pdf-generator/examples/add-background-image-to-pdf-form/documentation.md`.

## Localization

`SurveyPDF` extends `SurveyModel`, so multi-language schemas export the locale you set:
`surveyPdf.locale = "de"` before `save()`. Non-Latin locales need an embedded font (above).
