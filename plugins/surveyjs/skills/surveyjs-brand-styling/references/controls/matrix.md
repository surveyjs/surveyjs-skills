# `matrix` — radio matrix / Likert table

Web analog: Likert / single-choice table.
Shared surfaces: [_shared.md](_shared.md). Radio decorators inside cells: [radiogroup.md](radiogroup.md).

SCSS: `blocks/sd-matrix.scss` + `blocks/sd-table.scss`. Markup: `survey-react-ui/src/reactquestion_matrix.tsx`.

## Header & row-label text

| Aspect | Selector | Tokens |
| :-- | :-- | :-- |
| Column header | `.sd-table__cell--header` | weight 600, color `var(--sjs2-color-component-question-default-title, var(--sjs2-color-fg-basic-primary))`, padding `--sjs2-spacing-x150` `--sjs2-spacing-x100`, vertical-align top; span font-size input-content (16px), line-height 1.5× |
| Row label | `.sd-matrix__cell:first-of-type` / `.sd-table__cell--row-text` | weight `--sjs2-typography-font-weight-component-question-title` (600), color question-title token, min-width `--sjs2-size-x1200` |
| Body cell text | `.sd-table__cell` | font-size input-content, color `--sjs2-color-fg-basic-primary`, centered |

## Cells, rows, borders

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Cell padding | `.sd-table__cell` | `0 --sjs2-spacing-x100`; clickable area `.sd-matrix__text` padding `--sjs2-spacing-x200` |
| Row spacing | cell border-top/bottom | `--sjs2-spacing-x100` solid transparent (spacing via transparent borders, not real borders); header row border-bottom `--sjs2-spacing-x200` transparent |
| Alternate rows | odd rows (desktop) | bg `var(--sjs2-color-unknown-variable-001, var(--sjs2-color-bg-basic-primary-dim))` (legacy `--sjs-questionpanel-hovercolor`) |
| Selected cell | `.sd-matrix__text--checked` | bg `--sjs2-color-bg-brand-secondary` (rgba brand/10%) — kept in alternate rows too |
| Vertical align | `.sd-table--align-top .sd-table__cell` | top |

No row hover background. No left/right cell borders.
No `--sjs2-*` tokens named matrix/table — the table follows semantic + question-title tokens.

## Brand override recipe

```css
--sjs2-color-bg-brand-secondary: <selected cell bg>;  /* semantic */
--sjs2-color-component-question-default-title: <header/row-label color>;
```
