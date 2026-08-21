# `tagbox` — multi-select with tags

Web analog: chips / tags multi-select.
Popup + list: identical to [dropdown.md](dropdown.md). Shared input surface: [_shared.md](_shared.md) §3.

Classes: root `sd-formbox sd-tagbox sd-dropdown`, value `sd-formbox__input sd-tagbox__input sd-dropdown__input`,
chip `sd-tagbox-item` (+ `__text`, `__clean`, `__clean-button`, `__clean-button-svg`).
SCSS: `blocks/sd-tagbox.scss`. Markup: `survey-react-ui/src/tagbox-item.tsx`, `tagbox-filter.tsx`.

## Chips

| Aspect | Selector / token chain |
| :-- | :-- |
| Chip box | `.sd-tagbox-item`: padding `--sjs2-spacing-x100`, radius `--sjs2-radius-component-tagbox-item` → `--sjs2-radius-form-item` → 4px, bg `--sjs2-color-component-tagbox-item-default-bg`, border via trigger box-shadow w/ `--sjs2-color-component-tagbox-item-default-border` |
| Chip hover | bg `-hovered-bg`, border `-hovered-border`, text `-hovered-label` |
| Chip text | `.sd-tagbox-item__text`: color `--sjs2-color-component-tagbox-item-default-label` → `#1C1B20`, input-content typography, padding `0 --sjs2-spacing-x075` |
| Remove overlay | `.sd-tagbox-item__clean`: gradient from `-hovered-mask-stop-1/-2` tokens |
| Remove icon | `.sd-tagbox-item__clean-button-svg use`: fill `--sjs2-color-component-tagbox-item-action-default-icon` → rgba(#1C1B20/80%); hover `-hovered-icon` + `-hovered-bg` |
| Remove focus | `.sd-tagbox-item__clean-button:focus`: radius `--sjs2-radius-component-tagbox-item-action`, ring `--sjs2-border-effect-component-tagbox-item-a11y` → 4px rgba(blue-400/60%) |

## Layout / spacing

| Aspect | Selector / token |
| :-- | :-- |
| Gap between chips | `.sd-tagbox__input.sd-dropdown__input` gap → `--sjs2-layout-component-input-small-tag-group-gap` |
| Min-height | from shared `.sd-formbox__input` calc(1lh + input padding × 2) |

## Focus/hover

Shared formbox state tokens, plus explicit override `.sd-formbox.sd-tagbox:focus-within`
box-shadow = `--sjs2-border-effect-component-formbox-default-reset`, `--sjs2-border-effect-component-formbox-focused`.

## Brand override recipe

```css
--sjs2-color-component-tagbox-item-default-bg: <chip bg>;
--sjs2-color-component-tagbox-item-default-label: <chip text>;
--sjs2-color-component-tagbox-item-default-border: <chip border>;
--sjs2-radius-component-tagbox-item: <chip radius>;
```
