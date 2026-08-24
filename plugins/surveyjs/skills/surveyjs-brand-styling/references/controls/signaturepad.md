# `signaturepad` — signature canvas

Web analog: signature / drawing pad.
Shared surfaces: [_shared.md](_shared.md).

SCSS: `blocks/sd-signaturepad.scss`. Note: uses legacy `sjs_sp_*` class prefix.
Clear button (`sjs_sp_clear sd-signaturepad__clear`) has no dedicated visuals — inherits
shared action/button styles.

## Pad

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Border | `.sjs_sp_container` | 1px dashed `$border` → `--sjs2-color-component-input-default-line` → `#D4D4D4` |
| Placeholder | `.sjs_sp_placeholder` | color `$font-questionplaceholder-color` → `var(--sjs2-color-component-question-default-title-placeholder, var(--sjs2-color-fg-basic-secondary))`, size input-content (16px), 1.5× line-height, centered overlay |
| Error | `.sd-question--signature.sd-question--error .sjs_sp_placeholder` | bg `$red-light` → `--sjs2-color-bg-alert-secondary` |
| Readonly/preview | `.sd-question--readonly/.sd-question--preview .sjs_sp_container` | border removed; placeholder color `$foreground` → `#1C1B20` |
| Controls | `.sjs_sp_controls.sd-signaturepad__controls` | positioned top-right |
| Focus | `canvas:focus` | `outline: none` — no replacement ring (a11y gap; add scoped CSS if brand requires visible focus) |

Pen/background colors are question-level settings (`penColor`, `backgroundColor` in JSON), not CSS.

## Brand override recipe

```css
--sjs2-color-component-input-default-line: <pad border>;
--sjs2-color-fg-basic-secondary: <placeholder>;   /* semantic — wide effect */
```
