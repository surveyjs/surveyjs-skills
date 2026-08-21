# `paneldynamic` — repeating panel

Web analog: repeating form section with navigation.
Shared surfaces: [_shared.md](_shared.md). Inner questions style per their own control files.

SCSS: `blocks/sd-paneldynamic.scss`. Markup: `survey-react-ui/src/reactquestion_paneldynamic.tsx`.

## Layout & spacing

| Aspect | Selector | Tokens |
| :-- | :-- | :-- |
| Root padding/gap | `.sd-paneldynamic` | `--sjs2-layout-component-panel-dynamic-content-area-padding-*`, gap `-content-area-gap-vertical` |
| Between panels | `.sd-paneldynamic__panels-container` | row/column-gap from panel-dynamic content-area gap tokens |
| Separators | `.sd-paneldynamic__separator` | 1px line `--sjs2-color-border-basic-secondary` (hidden by default, shown in footer/between wrappers) |
| Footer | `.sd-paneldynamic__footer` | padding via `--sjs2-layout-component-panel-dynamic-footer-*`, gap `-footer-gap` |
| Footer buttons | `.sd-paneldynamic__buttons-container .sd-action-bar` | gap `--sjs2-layout-component-panel-dynamic-footer-action-group-gap` |

## Navigation / progress / tabs

| Aspect | Selector | Tokens |
| :-- | :-- | :-- |
| Progress text ("1 of 3") | progress text rule | size `--sjs2-typography-font-size-component-question-title`, line-height 1.5×, color `var(--sjs2-color-component-question-default-description, var(--sjs2-color-fg-basic-secondary))` |
| Prev/Next/Add/Remove | action bar buttons | shared action token families (`blocks/sd-action.scss`) |
| Tabs container | tabs rule | header padding tokens; bottom border 1px border-light |
| Tab default | tab item | color question-description token |
| Tab active | active item | color question-title token; indicator `inset 0 -2px 0 --sjs2-color-bg-brand-primary` |
| Tab hover (icons) | hovered | bg `--sjs2-color-component-action-brand-tertiary-hovered-bg`, icon `-hovered-icon` |

Panel-dynamic token families exist in base-theme.ts: layout (`--sjs2-layout-component-panel-dynamic-*`),
colors (`--sjs2-color-component-panel-dynamic-*`), border effects.

## Brand override recipe

```css
--sjs2-color-bg-brand-primary: <active tab indicator>;  /* semantic */
--sjs2-layout-component-panel-dynamic-content-area-gap-vertical: <panel spacing>;
```
