# `radiogroup` — radio button group

Web analog: radio group.
Shared title/description/error: [_shared.md](_shared.md).

Classes: item `sd-item sd-radio sd-selectbase__item`, label `sd-selectbase__label`,
decorator `sd-item__decorator sd-radio__decorator`, text `sd-item__control-label`,
other `sd-selectbase__other`.
SCSS: `blocks/sd-item.scss`, `blocks/sd-radio.scss`, `blocks/sd-selectbase.scss`.

## Item label text

| Aspect | Token chain |
| :-- | :-- |
| Color | `.sd-item__control-label` → `--sjs2-color-component-label-default-text` → `#1C1B20` |
| Disabled | `--sjs2-color-component-label-disabled-text` → rgba(fg/20%) |
| Typography | `--sjs2-typography-*-component-label-content` → 16px / 24px / regular |

Legacy bridge: `--sjs-font-editorfont-size` also maps to label-content size.

## Radio decorator (circle)

| State | Selector | Tokens |
| :-- | :-- | :-- |
| Default | `.sd-radio__decorator` | size `--sjs2-size-component-radio-box`, radius `--sjs2-radius-component-radio`, bg `--sjs2-color-component-radio-false-default-bg` → `#F5F5F5`, border `--sjs2-border-effect-component-radio-false-default` (NOTE: radio border-effect tokens reference *checkbox* border color tokens in base-theme.ts) |
| Checked | `.sd-radio--checked .sd-radio__decorator` | bg `--sjs2-color-component-radio-true-default-bg` → brand-600 `#19B394`; dot fill `--sjs2-color-component-radio-true-default-icon` → `#fff` |
| Hover | `.sd-radio--allowhover ... .sd-selectbase__label:hover .sd-radio__decorator` | `-false-hovered-bg`/`-false-hovered` (legacy `--sjs-editorpanel-hovercolor`); checked → `-true-hovered-bg` → brand-700 |
| Focus | `.sd-item__control:focus-visible + .sd-radio__decorator::before` | ring `--sjs2-border-effect-component-radio-a11y` (focus-visible, not focus-within) |
| Disabled checked | icon `--sjs2-color-component-radio-true-disabled-icon` |

## Spacing

| Aspect | Selector / token |
| :-- | :-- |
| Between items (vertical) | `.sd-item` padding = `--sjs2-layout-component-labeled-group-box-gap-vertical` / 2; group edges use `-box-padding-vertical` |
| Row (inline) mode | `.sd-selectbase--row` column-gap `--sjs2-spacing-x400` (32px) |
| Multi-column | `.sd-selectbase__column:not(:last-child)` padding-right `--sjs2-layout-component-labeled-group-box-gap-horizontal` |
| Decorator↔label | `.sd-selectbase__label` gap `--sjs2-layout-component-labeled-item-box-gap-horizontal` |
| "Other" comment | `.sd-selectbase__other:not(:last-of-type)` margin-bottom `--sjs2-spacing-x200`; comment area itself is a formbox (see [comment.md](comment.md)) |

## Brand override recipe

```css
--sjs2-color-component-radio-true-default-bg: <checked color>;   /* or set --sjs2-color-bg-brand-primary once */
--sjs2-color-component-checkbox-true-default-border: <checked border>; /* radio reuses checkbox border tokens */
--sjs2-color-component-label-default-text: <item text>;
```
