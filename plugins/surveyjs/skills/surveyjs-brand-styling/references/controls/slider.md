# `slider` — range slider

Web analog: range slider (single value or range).
Shared surfaces: [_shared.md](_shared.md).

SCSS: `blocks/sd-slider.scss`.

## Track / thumb

| Aspect | Selector | Tokens |
| :-- | :-- | :-- |
| Track height | `.sd-slider__track` | `--sjs2-size-x050` |
| Unfilled track | `.sd-slider__inverse-track` | bg `--sjs2-color-component-slider-default-bg` → bg-basic-tertiary → `#EDEDED` |
| Filled range | `.sd-slider__range-track` | bg `--sjs2-color-component-slider-default-fg` → bg-brand-primary → `#19B394` |
| Thumb | `.sd-slider__thumb` | bg `--sjs2-color-component-slider-default-thumb` → `#fff`, shadow `--sjs2-border-effect-trigger-default`; container size `--sjs2-size-x400`, radius `--sjs2-radius-component-slider-thumb` |
| Thumb dot | `.sd-slider__thumb-dot` | size `--sjs2-size-x150`, bg `--sjs2-color-component-slider-default-dot` → brand-600 |

## Labels / tooltip

| Aspect | Selector | Tokens |
| :-- | :-- | :-- |
| Tooltip panel | `.sd-slider__tooltip-panel` | bg `--sjs2-color-bg-neutral-primary` |
| Tooltip value | `.sd-slider__tooltip-value` | color `--sjs2-color-fg-neutral-on-primary` |
| Scale labels | `.sd-slider__label-text` | `--sjs2-color-fg-basic-primary`; secondary → `-secondary` |
| Ticks | `.sd-slider__label-tick` | bg `--sjs2-color-fg-basic-tertiary` |

## States

| State | Selector | Tokens |
| :-- | :-- | :-- |
| Hover | `.sd-slider__input:hover + ... .sd-slider__thumb-dot` | dot grows to `--sjs2-size-x200` |
| Focus | `.sd-slider__thumb-container--focused .sd-slider__thumb` | ring `--sjs2-border-effect-component-slider-a11y` |
| Readonly | `.sd-question--readonly .sd-slider__*` | `-readonly-thumb/-fg/-bg/-dot` tokens (`-readonly-thumb-border` is referenced but NOT defined in base-theme.ts — known gap) |
| Error | `.sd-question--error .sd-slider__*` | `-invalid-fg` → `#E50A3E`, `-invalid-bg` → rgba(red/10%), `-invalid-dot` |

No explicit `:active` styling exists.

## Brand override recipe

```css
--sjs2-color-component-slider-default-fg: <filled track>;
--sjs2-color-component-slider-default-dot: <thumb dot>;
/* or set --sjs2-color-bg-brand-primary once */
```
