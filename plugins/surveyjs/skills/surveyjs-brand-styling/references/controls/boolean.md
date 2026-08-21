# `boolean` — toggle / switch

Web analog: toggle switch (default two-label toggle; `switch`, `checkbox`, `radio` render modes).
Shared surfaces: [_shared.md](_shared.md). Checkbox/radio modes reuse [checkbox.md](checkbox.md) / [radiogroup.md](radiogroup.md) styles.

SCSS: `blocks/sd-boolean.scss` (default), `blocks/sd-switch.scss` (switch mode).
Markup: `survey-react-ui/src/boolean.tsx`, `boolean-switch.tsx`, `boolean-checkbox.tsx`, `boolean-radio.tsx`.

## Default toggle (`.sd-boolean`)

| Aspect | Selector | Tokens |
| :-- | :-- | :-- |
| Track | `.sd-boolean` | bg `--sjs2-color-component-boolean-default-bg` → `#F5F5F5`, radius `--sjs2-radius-component-boolean`, border `--sjs2-border-effect-component-boolean-default` |
| Labels (unselected) | `.sd-boolean__label` | color `--sjs2-color-component-boolean-item-false-default-value`; selected-side label text hidden via `color: transparent` |
| Thumb (selected pill) | `.sd-boolean__thumb` | bg `--sjs2-color-component-boolean-item-true-default-bg`, text `-true-default-value` → fg-brand-primary → brand-700, radius `--sjs2-radius-component-boolean-item` |
| Label hover | `.sd-boolean--allowhover .sd-boolean__thumb-ghost:hover .sd-boolean__label` | `-false-hovered-value/-bg` (legacy `--sjs-editorpanel-hovercolor`) |
| Focus | `.sd-boolean--allowhover:has(input:focus-visible)` | `--sjs2-border-effect-component-boolean-a11y` |
| Error | `.sd-boolean--error` | `-invalid-bg` / `-invalid` border effect |
| Disabled / readonly | `.sd-boolean--disabled` / `--readonly` | `-disabled-*` / `-readonly-*` token sets |

## Switch mode (`.sd-boolean-switch`)

Sizes via local vars: thumb `--sjs2-font-size-x150`, spacing `--sjs2-spacing-x075`.

| State | Tokens |
| :-- | :-- |
| Track off | `--sjs2-color-component-toggle-false-default-bg` → `#F5F5F5`, radius `--sjs2-radius-component-toggle`, border `--sjs2-border-effect-component-toggle-false-default` |
| Track on | `-true-default-bg` → brand-600 `#19B394`; thumb `-true-default-thumb` → `#fff` |
| Hover | `-false/true-hovered-bg` + `-hovered-thumb` (on-hover → brand-700) |
| Focus | `.sd-boolean-switch__button:focus-visible::before` → `--sjs2-border-effect-component-toggle-a11y` |
| Readonly | `-false/true-disabled-*` |
| Title label | `.sd-boolean-switch__title` → `--sjs2-color-component-label-default-text`; readonly → `-disabled-text` |

## Brand override recipe

```css
--sjs2-color-component-toggle-true-default-bg: <on color>;     /* switch mode */
--sjs2-color-component-boolean-item-true-default-bg: <selected pill>; /* default mode */
/* or set --sjs2-color-bg-brand-primary once (semantic) */
```
