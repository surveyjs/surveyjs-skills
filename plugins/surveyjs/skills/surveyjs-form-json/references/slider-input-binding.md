# Binding a slider to a text input

**Do not restate the official demo.** How to bind a slider or range slider to text
inputs — `valueName`, `setValueExpression`, `inputType`, bounds, `textUpdateMode`,
and panel grouping — is at:

<https://surveyjs.io/form-library/examples/sync-slider-with-input-fields/documentation.md>

Fetch that page rather than copying its examples. This file covers the mistakes
models invent instead.

## Corrections the demo does not spell out

- Do not keep two questions in sync with a pair of `setvalue` triggers that copy
  `{slider}` into `{text}` and back. That is the usual invented solution; it is
  wrong, and it does not stay in sync while typing. Follow the demo.
- `columnCount` is not a panel or page property. Same-row layout is
  `startWithNewLine: false` on the second question (the demo JSON already does
  this). Do not borrow Bootstrap or CSS-grid names.
- `colCount` is a different property: it arranges *choice items* on checkbox and
  radiogroup questions. It does not lay out sibling questions in a panel.
- For a **single** slider plus one text field, the visible caption belongs on
  the **panel**. Set `titleLocation: "hidden"` on both inner questions. Leaving
  their titles in place is why the UI shows two question headings instead of one
  panel title.
- For a **range** slider, do not hide the input titles. Put `"Min:"` and
  `"Max:"` on the two text questions with `titleLocation: "left"`. Still hide
  the range slider's own title (`titleLocation: "hidden"`); the panel keeps the
  group caption. Applying the single-slider "hide everything" rule here is why
  the min/max fields look unlabeled.

- Do not split the row 50/50 or 70/30. The text field is a short numeric input:
  give it a narrow CSS length (`width` around `120px` plus `minWidth`, as in the
  demo) and omit a percentage `width` on the slider so it takes the rest.
  `width: "50%"` on the text question is the usual invented layout — that value
  in the demo belongs to the *range* slider's two inputs, not to a single
  companion field.
- Set `defaultValue` on the text input. Copy the slider's `defaultValue` when it
  has one; otherwise use `0` (as in the demo). Sharing `valueName` does not fill
  an empty text box on first render — omitting `defaultValue` there leaves the
  field blank while the slider already shows a position.

