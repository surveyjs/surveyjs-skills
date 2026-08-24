# `dropdown` — select / combobox

Web analog: select / searchable combobox.
Shared input surface: [_shared.md](_shared.md) §3 (closed control is a `.sd-formbox`).

Classes: root `sd-formbox sd-dropdown`, value `sd-formbox__input sd-dropdown__input`,
filter input `sd-dropdown__filter-string-input`, popup `sv-dropdown-popup` + `sv-popup--menu-popup`,
list items `sd-selectlist__*` (via `selectlistCss.ts` — NOT `sv-list`, that path is legacy).
SCSS: `blocks/sd-dropdown.scss`, `blocks/sv-popup.scss`, `blocks/sd-selectlist.scss`.

## Closed control

| Aspect | Selector / token chain |
| :-- | :-- |
| Value text | `.sd-formbox__input` → `--sjs2-color-component-input-default-value` → `#1C1B20`; input-content typography (16/24/400) |
| Placeholder | `::placeholder` + `.sd-dropdown--empty .sd-dropdown__filter-string-input::placeholder` → `--sjs2-color-component-input-default-placeholder` |
| Box/borders/padding | shared formbox tokens ([_shared.md](_shared.md) §3) |
| Chevron icon | Action button (neutral tertiary): fill `--sjs2-color-component-action-neutral-tertiary-default-icon` → fg-neutral-primary-muted → rgba(#1C1B20/80%); hover `-hovered-icon` (`blocks/sd-action.scss`) |
| Filter input | `.sd-dropdown__filter-string-input` — transparent, inherits color/typography |

Hover/focus/error: shared formbox state tokens.

## Popup

| Aspect | Selector / token chain |
| :-- | :-- |
| Shell | `.sv-popup--menu-popup > .sv-popup__container`: radius `--sjs2-radius-component-drop`, border 1px `--sjs2-color-border-basic-secondary`, bg `--sjs2-color-utility-sheet`, shadow `--sjs2-border-effect-floating-default` (0 6px 20px rgba(brand-600/15%); legacy `--sjs-shadow-medium`) |
| Item text | `.sd-selectlist__item`: color `--sjs2-color-fg-basic-primary`, bg `--sjs2-color-bg-brand-tertiary`, radius `--sjs2-radius-component-drop-item`, default typography |
| Item padding/gap | `.sd-selectlist__item-body`: `--sjs2-layout-component-drop-item-box-padding-*`, gap `-box-gap`, label pad `-label-padding-horizontal` |
| Item hover | `.sd-selectlist__item--hovered`: bg `$background-dark` = `var(--sjs2-color-unknown-variable-001, var(--sjs2-color-bg-basic-primary-dim))` (legacy `--sjs-questionpanel-hovercolor`) |
| Item selected | `.sd-selectlist__item--selected`: bg `--sjs2-color-bg-brand-primary` (#19B394), text `--sjs2-color-fg-brand-on-primary` (#fff); +hovered → `-primary-dim` |
| Item focus | `.sd-selectlist__item--focused`: `--sjs2-border-effect-a11y` |
| List filter/search | `.sd-selectlist__filter` border-bottom `--sjs2-color-border-basic-secondary`, pad `--sjs2-spacing-x200`; `.sd-selectlist__input` color fg-basic-primary; placeholder fg-basic-secondary |

## Brand override recipe

```css
/* selected item + focus follow brand automatically via: */
--sjs2-color-bg-brand-primary: <brand>;           /* semantic — wide effect */
--sjs2-color-fg-brand-on-primary: <on-brand text>;
--sjs2-radius-component-drop: <popup radius>;
--sjs2-radius-component-drop-item: <item radius>;
--sjs2-border-effect-floating-default: <popup shadow>;
```
