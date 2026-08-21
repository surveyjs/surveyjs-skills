# `matrixdropdown` — editable grid (fixed rows)

Web analog: editable table with per-cell editors.
Table skeleton: same as [matrix.md](matrix.md) (`blocks/sd-table.scss`). Cell editors reuse their
control styles: [dropdown.md](dropdown.md), [text.md](text.md), [checkbox.md](checkbox.md), [boolean.md](boolean.md), [rating.md](rating.md).

Markup: `survey-react-ui/src/reactquestion_matrixdropdownbase.tsx`.

## Grid-specific

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Header cells | `.sd-table__cell--header` | padding `--sjs2-spacing-x150` `--sjs2-spacing-x100`, vertical-align top, question-title color/weight |
| Body cells | `.sd-table__cell` | padding `0 --sjs2-spacing-x100`; row spacing via transparent x100 borders |
| Column min-widths | `.sd-table__cell--header.sd-table__cell--dropdown/rating` | `calc(base-unit-size * 22)`; boolean `* 18`; action col `--sjs2-size-x300`; empty col `--sd-table-cell-min-width` |
| Choice cells | `.sd-table__cell--item .sd-selectbase__item` | centered |
| Boolean in cell | `.sd-table__question-wrapper .sd-boolean-root` | margin auto |
| Footer (totals) | `.sd-table__cell--footer ... .sd-expression` | padding x150/x200, border-bottom 1px `--sjs2-color-border-basic-secondary`, strong typography |
| Mobile | rows stack with separators; `tr::after` offset `--sjs2-spacing-negative-x200` |

Borders/hover/focus of the editors inside cells come entirely from the per-control token
families (formbox, checkbox, boolean...). There are no matrixdropdown-specific color tokens.

## Brand override recipe

Style the inner controls via their own tokens (see linked files);
`--sjs2-color-border-basic-secondary` covers the footer separator.
