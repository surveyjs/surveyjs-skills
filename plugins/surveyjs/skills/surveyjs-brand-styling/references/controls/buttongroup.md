# `buttongroup` — segmented button group

Web analog: segmented control / toggle button group.
Shared surfaces: [_shared.md](_shared.md). Container reuses the formbox surface.

Classes: root `sd-button-group-scrollable-container sv-button-group`, item `sv-button-group__item`
(+ `--selected`, `--allowhover`), decorator `sv-button-group__item-decorator`,
caption `sv-button-group__item-caption`, hidden control `sv-button-group__item-control`.
SCSS: `blocks/sv-buttongroup.scss`. Markup: `survey-react-ui/src/reactquestion_buttongroup.tsx`.

## Container

`.sv-button-group`: formbox tokens — padding `--sjs2-layout-component-formbox-medium-padding-*`,
gap `-medium-gap`, radius `--sjs2-radius-component-formbox`, bg `--sjs2-color-component-formbox-default-bg`,
border `--sjs2-border-effect-component-formbox-default`.

## Items

| State | Selector | Tokens |
| :-- | :-- | :-- |
| Default | `.sv-button-group__item-decorator` | padding `--sjs2-layout-component-action-small-box-padding-*`, radius `--sjs2-radius-component-buttongroup-item`, bg `--sjs2-color-component-buttongroup-item-false-default-bg` (transparent), border `--sjs2-border-effect-component-buttongroup-item-false-default` |
| Text/icon | caption `.sv-string-viewer` + icon fill | `--sjs2-color-component-buttongroup-item-false-default-value` |
| Selected | `.sv-button-group__item--selected` | bg `-true-default-bg`, border `-true-default` (border color → `--sjs2-color-border-basic-secondary` `#D4D4D4`), text `-true-default-value` → fg-brand-primary → brand-700 |
| Hover | `.sv-button-group__item--allowhover:hover` | `-false-hovered-bg` / `-false-hovered` / value `-false-hovered-value` |
| Focus | `.sv-button-group__item-control:focus-visible + decorator` | `--sjs2-border-effect-component-buttongroup-item-a11y` |
| Disabled | `-false/true-disabled-bg` / border / value token sets |

## Brand override recipe

```css
--sjs2-color-component-buttongroup-item-true-default-bg: <selected bg>;
--sjs2-color-component-buttongroup-item-true-default-value: <selected text>;
--sjs2-radius-component-buttongroup-item: <item radius>;
```
