# `file` — file upload / drop zone

Web analog: file upload with drag-and-drop.
Shared surfaces: [_shared.md](_shared.md).

SCSS: `blocks/sd-file.scss` (SCSS-var based). Choose-file button (`sd-file__choose-btn`)
has no dedicated visuals — inherits shared action/button styles (`blocks/sd-action.scss`).

## Drop zone

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Border | `.sd-file__decorator` | 1px dashed `$border` → `--sjs2-color-component-input-default-line` → `#D4D4D4` |
| Placeholder | `.sd-file__drag-area-placeholder` | color `$font-questionplaceholder-color` → `var(--sjs2-color-component-question-default-title-placeholder, var(--sjs2-color-fg-basic-secondary))`; size input-content (16px), line-height 1.5× |
| Drag-over | `.sd-file__decorator--drag` | border 1px solid `$primary` (#19B394), bg `--sjs2-color-bg-brand-secondary` (rgba brand/10%), inset 1px `$primary` |
| Error | `.sd-file__decorator--error` | bg `$red-light` → `--sjs2-color-bg-alert-secondary` |

## Actions & previews

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Actions row | `.sd-file__actions-container` | gap `--sjs2-layout-component-upload-action-group-gap` → 8px, centered |
| Disabled choose btn | `.sd-file__choose-file-btn--disabled` | opacity 0.25 |
| Preview item | `.sd-file__preview-item` | width `--sjs2-size-x1200`; hover reveals remove button + underlines link |
| Image wrapper | `.sd-file__image-wrapper` | bg `$background-dim` → `--sjs2-color-bg-neutral-tertiary-dim` |
| Default file icon | `.sd-file__default-image use` | fill `$font-questionplaceholder-color` |
| File name link | `.sd-file__sign a` | color `$font-questiontitle-color` (question title token) |

No explicit focus-ring rule in sd-file.scss (buttons carry their own action focus styles).
No dedicated `--sjs2-color-component-file-*` token family — file follows semantic/input tokens.

## Brand override recipe

```css
--sjs2-color-component-input-default-line: <drop zone border>;
--sjs2-color-bg-brand-primary: <drag-over accent>;    /* semantic */
--sjs2-color-bg-brand-secondary: <drag-over fill>;
```
