# Built-in input masking

Use SurveyJS input masks for formatted single-line text. Do not implement a
formatter with `onAfterRender` (or a custom widget) when a built-in mask covers
the requirement.

`maskType` is `none`, `numeric`, `currency`, `datetime`, or `pattern`. There are
no other mask types. Put type-specific options on `maskSettings`; do not invent
properties there either.

Masks apply only when `inputType` is `"text"` (the default) or `"tel"`. With
`"number"`, `"date"`, `"datetime-local"`, `"time"`, or any other `inputType`,
`maskType` is ignored. Do not combine a mask with `inputType: "number"` to get
a formatted number — use `maskType: "numeric"` or `"currency"` and leave
`inputType` omitted.

The same `maskType` / `maskSettings` pair works on:

- a `text` question
- an item inside `multipletext`
- a matrix dropdown/dynamic column whose `cellType` is `"text"`

It does not exist on `comment` (multiline). Confirm the host type in the
version-matched authoring guide and schema before emitting it.

## JSON shape

```json
{
  "type": "text",
  "name": "annualIncome",
  "maskType": "currency",
  "maskSettings": {
    "prefix": "$",
    "min": 0,
    "allowNegativeValues": false
  }
}
```

Omit any `maskSettings` property whose value equals the default. Numeric and
currency masks already default to `decimalSeparator: "."`, `thousandsSeparator: ","`,
`precision: 2`, and `allowNegativeValues: true`.

`saveMaskedValue` defaults to `false` and is the usual choice: the survey stores
the unmasked value (a number for numeric/currency, digits/letters for a pattern,
an ISO-8601 string for datetime) while the input still shows the formatted text.
Set `saveMaskedValue: true` only when the stored result must keep separators,
prefix, or placeholder literals.

## Numeric and currency

Currency is numeric plus `prefix` and `suffix` (display-only unless
`saveMaskedValue` is true).

- `min` / `max` belong on `maskSettings`, not on the question. Question-level
  `min` / `max` are HTML attributes for date/number `inputType`s and do not
  constrain a mask.
- `precision` is the number of fractional digits. Use `0` for integers.
- `thousandsSeparator: ""` turns grouping off.
- `allowNegativeValues: false` (or a `min` of `0` or greater) blocks a leading
  minus.

Entering `25000` against the currency example above stores `25000` and displays
`$25,000.00`. With `saveMaskedValue: true` the stored value would be the
formatted string instead.

A rate from 0 through 25 with at most three decimal places:

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

Numeric and currency inputs align to the right by default (`inputTextAlignment`
is `"auto"`). Set `"left"` only when the surrounding layout requires it.

## Pattern

`maskSettings.pattern` is a template of literals plus placeholders:

- `9` — a digit
- `a` — a letter
- `#` — a digit or a letter

Any other character is a literal. Escape a placeholder with `\` to insert it as
a literal (`\9` is the character `9`). Incomplete input does not write a
question value; it raises the built-in incomplete-mask error instead of a
required-field error.

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

Typing `5551234567` stores `"5551234567"` (literals such as `+1()` are not part
of the unmasked value). `saveMaskedValue: true` would store `"+1(555)-123-45-67"`.

Do not emit code-level mask settings (`patternDefinitions`, placeholder or
escape characters) in survey JSON — they are not serializable properties.

## Datetime

Datetime reuses `maskSettings.pattern` with date/time placeholders, not the
`9`/`a`/`#` set:

- Date: `m` / `mm`, `d` / `dd`, `yy` / `yyyy`
- Time: `H` / `HH` (24-hour), `h` / `hh` (12-hour), `MM` (minutes), `ss`
- Period: `TT` / `tt`

`min` and `max` on a datetime mask are ISO date or time strings, and they
require a `pattern`. The stored value is ISO-8601 (`"2024-03-12"`, or with a
`T` time part when the pattern includes time), not the displayed mask.

```json
{
  "type": "text",
  "name": "startDate",
  "maskType": "datetime",
  "maskSettings": {
    "pattern": "mm/dd/yyyy",
    "min": "2000-01-01",
    "max": "2030-12-31"
  }
}
```

Do not use `inputType: "date"` or `"datetime-local"` together with a datetime
mask: those input types disable the mask. Prefer the mask when the displayed
format must stay a typed pattern; prefer `inputType: "date"` when a native
picker is enough and the stored value can be the browser's date string.

A two-digit `yy` year is expanded to four digits using a century pivot taken
from `maskSettings.max` when that value has a four-digit year; otherwise years
after 68 map to 19xx and the rest to 20xx.
