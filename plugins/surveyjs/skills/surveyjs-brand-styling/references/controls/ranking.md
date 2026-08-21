# `ranking` — sortable drag-and-drop list

Web analog: sortable list.
Shared surfaces: [_shared.md](_shared.md).

SCSS: `blocks/sd-ranking.scss` + `blocks/sv-ranking.scss` (item classes are `sv-ranking-item*`).

## Items

| Aspect | Selector | Tokens / values |
| :-- | :-- | :-- |
| Item content box | `.sv-ranking-item__content` | radius `--sjs2-radius-component-ranking` → `--sjs2-radius-round`, flex + padding |
| Item text | `.sv-ranking-item__text` | color `--sjs2-color-component-label-default-text` → `#1C1B20`, label-content typography, margin-inline `--sjs2-spacing-x200` |
| Index circle | `.sv-ranking-item__index` | bg `--sjs2-color-bg-brand-secondary` (rgba brand/10%), color `--sjs2-color-fg-basic-primary`, border-radius 100% |

## States

| State | Selector | Values |
| :-- | :-- | :-- |
| Hover | `.sv-ranking-item:hover:not(:focus) .sv-ranking-item__icon--hover` | drag icon becomes visible |
| Focus | `.sv-ranking-item:focus .sv-ranking-item__index` | bg `$background` (#fff), outline `--sjs2-border-width-x200` solid `$primary` (#19B394); focus icon visible |
| Dragged | `.sv-ranking-item--drag .sv-ranking-item__content` | shadow `$shadow-medium-large` → `--sjs2-border-effect-floating-default` (0 6px 20px rgba(brand/15%)) |
| Ghost (drop slot) | `.sv-ranking-item__ghost` | bg `$background-dim` → `--sjs2-color-bg-neutral-tertiary-dim`, ranking radius |
| Readonly | `--readonly .sv-ranking-item__index` | bg `$background-dark` |
| Preview | `--preview .sv-ranking-item__index` | transparent bg, inset 1px `$foreground` |
| Error | `--error .sv-ranking-item__index` | bg `$red-light` → bg-alert-secondary |

Spacing between items comes from item paddings/margins (no single gap token).
No dedicated `--sjs2-color-component-ranking-*` token family.

## Brand override recipe

```css
--sjs2-color-bg-brand-secondary: <index circle bg>;   /* semantic */
--sjs2-radius-component-ranking: <item radius>;
--sjs2-color-component-label-default-text: <item text>;
```
