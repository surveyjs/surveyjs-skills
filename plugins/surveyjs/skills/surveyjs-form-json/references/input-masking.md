# Built-in input masking

**Do not restate the official masking documentation.** Supported `maskType` values
(`numeric`, `currency`, `datetime`, `pattern`), `maskSettings` per type, pattern
placeholders (`9` / `a` / `#` / `\`), and `saveMaskedValue` are all at:

<https://surveyjs.io/form-library/examples/masked-input-fields/documentation.md>

Fetch that page rather than copying its examples. This file covers where masks apply,
what they store, and the mistakes models invent.

Use a built-in mask for formatted single-line text. Do not implement a formatter with
`onAfterRender` (or a custom widget) when a built-in type covers the requirement.

## Where a mask works

The same `maskType` / `maskSettings` pair works on:

- a `text` question
- an item inside `multipletext`
- a matrix dropdown/dynamic column whose `cellType` is `"text"`

It does not exist on `comment` (multiline). Confirm the host type in the version-matched
authoring guide and schema before emitting it.

Masks apply only when `inputType` is `"text"` (the default) or `"tel"`. With `"number"`,
`"date"`, `"datetime-local"`, `"time"`, or any other `inputType`, `maskType` is ignored.
Do not combine a mask with `inputType: "number"` to get a formatted number — use
`maskType: "numeric"` or `"currency"` and leave `inputType` omitted. Do not use
`inputType: "date"` or `"datetime-local"` with a datetime mask either: those input types
disable the mask. Prefer the mask when the displayed format must stay a typed pattern;
prefer `inputType: "date"` when a native picker is enough.

`maskType` is `none`, `numeric`, `currency`, `datetime`, or `pattern`. There are no other
mask types. Put type-specific options on `maskSettings`; do not invent properties there.

## What gets stored

`saveMaskedValue` defaults to `false` and is the usual choice: the survey stores the
unmasked value (a number for numeric/currency, digits/letters for a pattern, an ISO-8601
string for datetime) while the input still shows the formatted text. Set
`saveMaskedValue: true` only when the stored result must keep separators, prefix, or
placeholder literals.

Omit any `maskSettings` property whose value equals the default. Numeric and currency
masks already default to `decimalSeparator: "."`, `thousandsSeparator: ","`,
`precision: 2`, and `allowNegativeValues: true`.

## Corrections the demo does not spell out

- `min` / `max` belong on `maskSettings`, not on the question. Question-level `min` /
  `max` are HTML attributes for date/number `inputType`s and do not constrain a mask.
- `precision` is the number of fractional digits. Use `0` for integers.
- `thousandsSeparator: ""` turns grouping off.
- `allowNegativeValues: false` (or a `min` of `0` or greater) blocks a leading minus.
- Numeric and currency inputs align to the right by default (`inputTextAlignment` is
  `"auto"`). Set `"left"` only when the surrounding layout requires it.
- Incomplete pattern input does not write a question value; it raises the built-in
  incomplete-mask error instead of a required-field error.
- Do not emit code-level mask settings (`patternDefinitions`, placeholder or escape
  characters) in survey JSON — they are not serializable properties. Custom placeholders
  belong in global settings, as the demo notes, not in the form definition.
- Datetime `pattern` uses date/time placeholders (`m`/`mm`, `d`/`dd`, `yy`/`yyyy`,
  `H`/`HH`, `h`/`hh`, `MM`, `ss`, `TT`/`tt`), not the pattern-mask `9`/`a`/`#` set.
- Datetime `min` and `max` are ISO date or time strings and require a `pattern`. The
  stored value is ISO-8601 (`"2024-03-12"`, or with a `T` time part when the pattern
  includes time), not the displayed mask.
- A two-digit `yy` year is expanded using a century pivot taken from `maskSettings.max`
  when that value has a four-digit year; otherwise years after 68 map to 19xx and the
  rest to 20xx.

A rate from 0 through 25 with at most three decimal places (defaults omitted):

```json
{
  "type": "text",
  "name": "requestedRate",
  "maskType": "numeric",
  "maskSettings": {
    "min": 0,
    "max": 25,
    "precision": 3,
    "thousandsSeparator": "",
    "allowNegativeValues": false
  }
}
```

A phone that stores digits only (`inputType: "tel"` is allowed with a mask):

```json
{
  "type": "text",
  "name": "phone",
  "inputType": "tel",
  "maskType": "pattern",
  "maskSettings": {
    "pattern": "+1(999)-999-99-99"
  }
}
```

Typing `5551234567` stores `"5551234567"`. `saveMaskedValue: true` would store
`"+1(555)-123-45-67"`.
