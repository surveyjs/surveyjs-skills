# Shared question surfaces (all question types)

Styles that apply to EVERY question type. Per-control files reference this and only
document deviations. All values verified against `packages/survey-core/src/default-theme/`
(blocks/*.scss, base-theme.ts) and `packages/survey-core/src/defaultCss/defaultCss.ts`.

> Important: current markup does NOT use `.sd-input`. The shared input surface is
> `.sd-formbox` (container) + `.sd-formbox__input` (control), defined in
> `blocks/sd-formbox.scss`.

## 1. Question title

Classes: `sd-title sd-element__title sd-question__title`; required mark: `sd-question__required-text`.
Rules in `blocks/sd-question.scss` (+ structural resets in `blocks/sd-element.scss`).

| Aspect | Token chain (→ default) |
| :-- | :-- |
| Color | `--sjs2-color-component-question-default-title` → `--sjs2-color-fg-basic-primary` → `#1C1B20` |
| Hovered title (collapsible) | `--sjs2-color-component-question-hovered-title` |
| Font size | `--sjs2-typography-font-size-component-question-title` → `--sjs2-typography-font-size-default` → 16px |
| Line height | `--sjs2-typography-line-height-component-question-title` → `--sjs2-typography-line-height-default` → 24px |
| Font weight | `--sjs2-typography-font-weight-component-question-title` → `--sjs2-typography-font-weight-strong` → 600 |
| Required asterisk color | `--sjs2-color-bg-alert-primary` → `#E50A3E` |

Legacy bridge (legacy-vars.ts): `--sjs-font-questiontitle-size/weight/color/family`.

## 2. Question description

Class: `sd-description sd-question__description`; rule in `blocks/sd-question.scss`.

| Aspect | Token chain (→ default) |
| :-- | :-- |
| Color | `--sjs2-color-component-question-default-description` → `--sjs2-color-fg-basic-secondary` → rgba(#1C1B20 / 60%) |
| Font size | `--sjs2-typography-font-size-component-question-description` → 16px |
| Line height | `--sjs2-typography-line-height-component-question-description` → 24px |
| Font weight | `--sjs2-typography-font-weight-component-question-description` → 400 |

Legacy bridge: `--sjs-font-questiondescription-*`.

## 3. Shared input surface (`.sd-formbox` / `.sd-formbox__input`)

Used by: text, comment, dropdown, tagbox, multipletext items, buttongroup container.
All rules in `blocks/sd-formbox.scss`.

### Text

| Aspect | Token chain (→ default) |
| :-- | :-- |
| Value color | `--sjs2-color-component-input-default-value` → `--sjs2-color-fg-basic-primary` → `#1C1B20` |
| Placeholder color | `--sjs2-color-component-input-default-placeholder` → `--sjs2-color-fg-basic-secondary` |
| Font size | `--sjs2-typography-font-size-component-input-content` → 16px |
| Line height | `--sjs2-typography-line-height-component-input-content` → 24px |
| Font weight | `--sjs2-typography-font-weight-component-input-content` → 400 |
| Label (`.sd-formbox__label`) color | `--sjs2-color-component-input-default-label` → fg-basic-secondary |

Legacy bridge: `--sjs-font-editorfont-color/size/placeholdercolor`.

### Box, borders, padding

| Aspect | Selector / token chain |
| :-- | :-- |
| Background | `.sd-formbox` → `--sjs2-color-component-formbox-default-bg` → `--sjs2-color-bg-basic-secondary` → `#F5F5F5` |
| Border (as inset box-shadow, no `border`) | `--sjs2-border-effect-component-formbox-default` → inset 0 0 0 1px `--sjs2-color-component-formbox-default-border` → `--sjs2-color-border-basic-secondary` → `#D4D4D4` |
| Radius | `--sjs2-radius-component-formbox` |
| Container padding | `--sjs2-layout-component-formbox-medium-padding-vertical` (4px) / `-horizontal` |
| Input padding | `--sjs2-layout-component-input-medium-content-padding-vertical` (8px) / `-horizontal` (12px) |
| Input min-height | `calc(1lh + padding-vertical * 2)` |
| Transition | `--sjs-transition-duration` (legacy var, fallback 150ms) |

Legacy bridge: `--sjs-editorpanel-backcolor` (bg), `--sjs-shadow-inner` (border effect), `--sjs-border-default`.

### States

| State | Selector | Tokens |
| :-- | :-- | :-- |
| Hover | `.sd-formbox:where(:hover)` | `--sjs2-color-component-formbox-hovered-bg`, `--sjs2-border-effect-component-formbox-hovered` |
| Focus | `.sd-formbox:where(:focus-within)` | `--sjs2-color-component-formbox-focused-bg`, `--sjs2-border-effect-component-formbox-focused` (border color → `--sjs2-color-border-brand-primary` → brand-600 `#19B394`), `--sjs2-border-effect-component-formbox-a11y` (transparent by default) |
| Error | `.sd-formbox--error` | `--sjs2-color-component-formbox-invalid-bg`, `--sjs2-border-effect-component-formbox-invalid` (border → `--sjs2-color-border-alert-primary` → `#E50A3E`) |
| Error+focus | `.sd-formbox--error:where(:focus-within)` | `-invalid-focused-bg` / `-invalid-focused` variants |
| Readonly | `.sd-formbox--readonly` | `-readonly-bg` / `-readonly` border effect |
| Preview | `.sd-formbox--preview` | border-bottom 1px solid `--sjs2-color-fg-basic-primary`, radius 0 |

## 4. Spacing around a question

| Aspect | Selector / token |
| :-- | :-- |
| Gap between title/description block and content | `.sd-question__header-and-content-container` row-gap → `--sjs2-layout-component-question-box-gap-vertical` → 16px |
| Header internal gap (title↔description) | `.sd-question__header` row-gap → question-header-gap-vertical → 4px; column-gap tokens too |
| Title/description padding | `--sd-question-title-padding-block/inline`, `--sd-question-description-padding-*` → default 0 |
| Description under input | `.sd-question__description--under-input` margin-top → question-box-gap-vertical |
| Card (with-frame) padding | panel-simple tokens: `--sjs2-layout-component-panel-simple-content-area-padding-horizontal` (`--sjs2-spacing-large-horizontal`) / `-top` / `-bottom` (`--sjs2-spacing-medium-vertical`) |
| Gaps between questions in a row | `.sd-row--multiple` → page/panel content-area gap tokens: `--sjs2-layout-component-page-content-area-gap-horizontal/vertical` → 24px |
| Survey vertical rhythm | `--sjs2-layout-component-survey-box-gap-vertical` → `--sjs2-spacing-large-vertical` |

Markup: question root > `.sd-question__container` > `.sd-question__header-and-content-container` > (header, content). Rendered by `packages/survey-react-ui/src/reactquestion.tsx` + `element-header.tsx`.

## 5. Error box

Classes: `sd-element__erbox sd-question__erbox` (+ `--above-element` / `--below-question`); inner visual block `.sd-error` (`blocks/sd-error.scss`).

| Aspect | Token chain |
| :-- | :-- |
| Background | `--sjs2-color-component-message-error-bg` → `--sjs2-color-bg-alert-secondary` → rgba(#E50A3E / 10%) |
| Text | `--sjs2-color-component-message-error-text` → `#1C1B20` |
| Icon | `--sjs2-color-component-message-error-icon` |
| Padding / gap | `--sjs2-layout-component-message-box-padding-vertical/horizontal`, `-box-gap-vertical` |
| Radius | `--sjs2-radius-component-message` |

## 6. A11y focus ring (shared)

`--sjs2-border-effect-a11y` = `0 0 0 var(--sjs2-border-width-a11y) var(--sjs2-color-utility-a11y)`;
width → `--sjs2-border-width-x400` (4px), color → rgba(blue-400 / 60%). Component-specific
`-a11y` border-effect tokens (formbox, radio, checkbox, toggle, …) derive from it.
