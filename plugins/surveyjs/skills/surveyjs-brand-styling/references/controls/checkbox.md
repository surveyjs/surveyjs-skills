# `checkbox` — checkbox group

Web analog: checkbox group.
Item text, spacing, "other" area: identical to [radiogroup.md](radiogroup.md) (shared `sd-item`/`sd-selectbase`). Shared surfaces: [_shared.md](_shared.md).

Classes: item `sd-item sd-checkbox sd-selectbase__item`, decorator `sd-item__decorator sd-checkbox__decorator`, text `sd-item__control-label`.
SCSS: `blocks/sd-checkbox.scss`, `blocks/sd-item.scss`, `blocks/sd-selectbase.scss`.

## Checkbox decorator (box)

| State | Selector | Tokens |
| :-- | :-- | :-- |
| Default | `.sd-checkbox__decorator` | size `--sjs2-size-component-checkbox-box`, radius `--sjs2-radius-component-checkbox`, bg `--sjs2-color-component-checkbox-false-default-bg` → `#F5F5F5`, border `--sjs2-border-effect-component-checkbox-false-default` (legacy `--sjs-shadow-inner`) |
| Checked | `.sd-checkbox--checked .sd-checkbox__decorator` | bg `--sjs2-color-component-checkbox-true-default-bg` → brand-600 `#19B394`, border `-true-default`; checkmark fill `--sjs2-color-component-checkbox-true-default-icon` → `#fff` |
| Hover | unchecked `-false-hovered-bg`/`-false-hovered` (legacy `--sjs-editorpanel-hovercolor`); checked `-true-hovered-bg` → brand-700 |
| Focus | `.sd-item__control:focus-visible + .sd-checkbox__decorator::before` | ring `--sjs2-border-effect-component-checkbox-a11y` |
| Disabled checked | icon `--sjs2-color-component-checkbox-true-disabled-icon` |

## Label-rendered mode (single checkbox with description)

`.sd-checkbox--label-rendered`: column flex, gap `--sjs2-spacing-x100`;
`.sd-description` padding-left `--sjs2-spacing-x400`.

## Brand override recipe

```css
--sjs2-color-component-checkbox-true-default-bg: <checked bg>;  /* or --sjs2-color-bg-brand-primary once */
--sjs2-color-component-checkbox-true-default-icon: <checkmark>;
--sjs2-radius-component-checkbox: <box radius>;
```
