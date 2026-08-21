# `html`, `image`, `expression`, `imagemap` — display content

Read-only display question types. Shared surfaces: [_shared.md](_shared.md).

## `html` (`blocks/sd-html.scss` + `articleHtml` mixin in `mixins.scss`)

| Aspect | Values |
| :-- | :-- |
| Base color | `--sjs2-color-component-page-default-title`; nested variant → question-title token |
| h1 | `var(--sjs-article-font-xx-large-fontSize, calc(base-font * 8))` / `var(--sjs-article-font-xx-large-lineHeight, 64px)` |
| h2 | `var(--sjs-article-font-x-large-fontSize, --sjs2-font-size-x600)` / 56px |
| h3 | `var(--sjs-article-font-large-fontSize, --sjs2-font-size-x400)` / 40px |
| h4–h6 | `var(--sjs-article-font-medium-fontSize, --sjs2-font-size-x300)` / 32px |
| p / body text | `var(--sjs-article-font-default-fontSize, --sjs2-font-size-x200)` / 28px |
| Links | `a` color `--sjs2-color-bg-brand-primary` |

Note: article typography still uses legacy `--sjs-article-font-*` vars with raw fallbacks.

## `image` (`blocks/sd-image.scss`)

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Radius | `.sd-image__image` | `--sjs2-radius-x100` |
| Adaptive | `--adaptive` | max-width 80×base-unit |
| No-image placeholder | `.sd-image__no-image` | bg `--sjs2-color-bg-basic-secondary` |

## `expression` (`blocks/sd-expression.scss`)

| Aspect | Values |
| :-- | :-- |
| Typography | default text mixin: `--sjs2-typography-font-family-text`, size/line-height default (16/24), weight basic |
| Color | `var(--sjs2-color-component-question-default-title, var(--sjs2-color-fg-basic-primary))` |
| Left-titled layout | line-height `--sjs2-line-height-x300`, padding `--sjs2-spacing-x150 0` |

## `imagemap` (`blocks/sd-imagemap.scss`)

Region colors are question-level CSS custom properties set by `question_imagemap.ts`
(override per question or via scoped CSS):

| State | Vars (with defaults) |
| :-- | :-- |
| Idle | `--sd-imagemap-idle-fill-color` (transparent), `-stroke-color`, `-stroke-width` |
| Hover | `--sd-imagemap-hover-fill-color` (→ `--sjs2-color-bg-accent-secondary`), `-stroke-color` (→ accent-primary), width 1 |
| Selected | `--sd-imagemap-selected-fill-color` (→ `--sjs2-color-bg-brand-secondary`), `-stroke-color` (→ brand-600), width 1 |
| Control points | fill accent-primary, stroke accent-secondary; hover fill `--sjs2-color-bg-warning-primary` |
