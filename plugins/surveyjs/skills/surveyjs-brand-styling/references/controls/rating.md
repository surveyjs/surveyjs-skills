# `rating` — rating scale / stars / smileys

Web analog: rating (pills, star rating, smiley scale).
Shared surfaces: [_shared.md](_shared.md).

SCSS: `blocks/sd-rating.scss` — mostly authored with SCSS vars from `variables.scss`
(chains noted below). Per-item smiley colors are set at runtime by `question_rating.ts`
via `--sd-rating-item-color` / `--sd-rating-item-color-light`.

Key var chains: `$primary` → `--sjs2-color-bg-brand-primary` → `#19B394`;
`$primary-foreground` → `--sjs2-color-fg-brand-on-primary` → `#fff`;
`$border` → `--sjs2-color-component-input-default-line` → `#D4D4D4`;
`$background-dark` → `var(--sjs2-color-unknown-variable-001, var(--sjs2-color-bg-basic-primary-dim))`
(legacy `--sjs-questionpanel-hovercolor`); `$question-background` → bg-basic-primary → `#fff`.

## Pills (labels mode)

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Item | `.sd-rating__item` | bg `$question-background`, radius `--sjs2-radius-component-rating` → `--sjs2-radius-round`, min-width/height `--sjs2-size-x600` (48px), text `$foreground` → `#1C1B20`, shadow `$shadow-small` |
| Gap | `.sd-rating fieldset` | gap `--sjs2-spacing-x100` (8px) |
| Hover | `.sd-rating__item--allowhover:hover` | bg `$background-dark` |
| Selected | `.sd-rating__item--selected` | bg `$primary`, text `$primary-foreground`, weight 600 |
| Focus | `:focus-within` | `0 0 0 2px $primary`; selected+focus adds inset white gap |

## Stars

| State | Selector | Values |
| :-- | :-- | :-- |
| Empty | `.sd-rating__item-star svg` | stroke `$border`, fill transparent |
| Selected | `--selected svg` | fill `$primary` |
| Hover highlight | `--highlighted svg` | stroke `$border`, fill `$background-dark` |
| Unhighlight | `--unhighlighted svg` | fill `$border` |
| Focus | `:focus-within svg` | stroke `$primary` |

## Smileys

| State | Selector | Values |
| :-- | :-- | :-- |
| Default | `.sd-rating__item-smiley` | border 2px `$border`, fill `$border` |
| Selected | `--selected` | bg+border `var(--sd-rating-item-color, $primary)`, fill `$primary-foreground` |
| Scale-colored hover | `--scale-colored:hover` | bg `var(--sd-rating-item-color-light, $background-dark)` |
| Focus | `:focus-within` | `0 0 0 2px $primary` |

## Min/max captions

`.sd-rating__min-text` / `.sd-rating__max-text`: color `$font-questiondescription-color`
→ question-description token ([_shared.md](_shared.md) §2). Positioning varies with
`--labels-top/bottom/diagonal` modes.

## Brand override recipe

```css
--sjs2-color-bg-brand-primary: <brand>;        /* selected pill/star/focus */
--sjs2-radius-component-rating: <pill radius>; /* default: fully round */
```
No dedicated `--sjs2-color-component-rating-*` tokens exist — rating follows semantic tokens.
