# `imagepicker` — image choice grid

Web analog: image-based radio/checkbox cards.
Shared surfaces: [_shared.md](_shared.md).

Classes: root `sd-selectbase sd-imagepicker`, item `sd-imagepicker__item` (+ `--checked`, `--allowhover`),
label `sd-imagepicker__label`, check `sd-imagepicker__check-decorator` / `__check-icon`, text `sd-imagepicker__text`.
SCSS: `blocks/sd-imagepicker.scss` (uses SCSS vars from `variables.scss`). Markup: `survey-react-ui/src/imagepicker.tsx`.

## Items

| Aspect | Selector | Tokens / values |
| :-- | :-- | :-- |
| Image radius | `.sd-imagepicker__item img`, `.sd-imagepicker__image-container > div` | `--sjs2-radius-x100` (8px); no default border |
| Empty image bg | `$background-dim-light` → `--sjs2-color-bg-basic-secondary` → `#F5F5F5` |
| Checked indicator | `.sd-imagepicker__check-decorator` | opacity 0→1 when `--checked`; circle bg `$background` → `--sjs2-color-bg-basic-primary` (#fff), offset `--sjs2-spacing-x100`, padding `--sjs2-spacing-x150`; icon fill `$primary` → `--sjs2-color-bg-brand-primary` → `#19B394`. No checked border. |
| Hover | `.sd-imagepicker__item--allowhover ... .sd-imagepicker__image:hover` | image opacity 0.5 |
| Focus | `.sd-imagepicker__item:focus-within .sd-imagepicker__image` | opacity 0.5 (same as hover) |
| Label text | `.sd-imagepicker__text` | color `--sjs2-color-fg-basic-primary`, size `$font-editorfont-size` → input-content size (16px), line-height 1.5×, margin-top `--sjs2-spacing-x100`, centered |

## Spacing

| Aspect | Selector / value |
| :-- | :-- |
| Grid gap | `.sd-imagepicker` gap `--sjs2-spacing-x200` (16px) |
| Column mode | `.sd-imagepicker__column` gap `--sjs2-spacing-x200` |

## Brand override recipe

```css
--sjs2-color-bg-brand-primary: <brand>;      /* check icon follows brand */
--sjs2-radius-x100: <image radius>;          /* system-level — affects other radii too;
                                                prefer scoped CSS if only images should change */
```
