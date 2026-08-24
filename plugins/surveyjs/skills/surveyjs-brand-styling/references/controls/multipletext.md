# `multipletext` — labeled input group

Web analog: form group of labeled text inputs.
Shared input surface: [_shared.md](_shared.md) §3 — each item container IS a `.sd-formbox`.

Classes: table root `sd-multipletext`, cell `sd-multipletext__cell`, item container
`sd-multipletext__item-container sd-formbox` (+ `--answered`, `--allow-focus`, `sd-formbox--error/readonly/preview`),
item title `sd-multipletext__item-title sd-formbox__label`, item `sd-multipletext__item`.
SCSS: `blocks/sd-multipletext.scss`, `blocks/sd-formbox.scss`, mobile: `default.m600.scss`.
Markup: `survey-react-ui/src/reactquestion_multipletext.tsx`.

## Item label (per-item title)

Via `.sd-formbox__label` (`blocks/sd-formbox.scss`):

| Aspect | Token chain |
| :-- | :-- |
| Color | `--sjs2-color-component-input-default-label` → fg-basic-secondary → rgba(#1C1B20/60%) |
| Typography | input-content mixin (16px/24px/400) |
| Divider (label↔input) | border-right `--sjs2-border-width-x100` solid `--sjs2-color-component-input-default-line` → `#D4D4D4` |

## Spacing

| Aspect | Selector | Value |
| :-- | :-- | :-- |
| Between columns | `.sd-multipletext__cell:not(:first-of-type)` | padding-inline-start `--sjs2-spacing-x200` (16px) |
| Between rows | `.sd-multipletext__cell` | padding-top/bottom `--sjs2-spacing-x100` (8px), trimmed on first/last row |
| Inside item | `.sd-multipletext__item` | gap `--sjs2-spacing-x050` (4px) |
| Mobile | `.sd-multipletext--mobile ...` | cells stack; item container padding x100/x200; title full-width, small typography when answered/focused |

## Borders, focus, error

- Item box/borders/focus/hover: shared formbox tokens (each item container has `sd-formbox` + state modifiers) — [_shared.md](_shared.md) §3.
- Item error: `.sd-multipletext__item-container--error` bg `--sjs2-color-bg-alert-secondary` + `sd-formbox--error` invalid tokens; cell padding variants `--error-top/--error-bottom`.
- No table cell borders; the only divider is the label border-right.

## Brand override recipe

```css
--sjs2-color-component-input-default-label: <item label color>;
--sjs2-color-component-input-default-line: <label divider color>;
/* plus formbox family tokens (see text.md) */
```
