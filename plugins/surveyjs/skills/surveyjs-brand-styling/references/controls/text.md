# `text` — single-line input

Web analog: standard `<input>` (all HTML input types via `inputType`).
Shared surfaces (title, description, box, borders, focus/hover, error): see [_shared.md](_shared.md) — `text` uses them verbatim.

Classes: root `sd-formbox sd-text`, control `sd-formbox__input`, group `sd-formbox__group`,
value marker `sd-formbox__input--value-changed`, error `sd-formbox--error`.
SCSS: `blocks/sd-formbox.scss`. Markup: `survey-react-ui/src/reactquestion_text.tsx`.

## Text, borders, spacing, focus/hover

All from the shared `.sd-formbox` / `.sd-formbox__input` surface ([_shared.md](_shared.md) §3):
- value/placeholder colors: `--sjs2-color-component-input-default-value` / `-placeholder`
- typography: `--sjs2-typography-*-component-input-content` (16px/24px/400)
- bg/border/radius: `--sjs2-color-component-formbox-default-bg`, `--sjs2-border-effect-component-formbox-default`, `--sjs2-radius-component-formbox`
- padding: formbox-medium (4px) + input-medium-content (8px/12px) layout tokens
- hover/focus/error/readonly: formbox state tokens

## inputType-specific

| inputType | Selector | Styling |
| :-- | :-- | :-- |
| `range` | `.sd-formbox__input[type="range"]::-webkit-slider-runnable-track` / `::-moz-range-track` | bg `--sjs2-color-bg-brand-primary`, radius `--sjs2-radius-x100`, height `--sjs2-size-x150` |
| `range` thumb | `::-webkit-slider-thumb` / `::-moz-range-thumb` | 2px border + bg `--sjs2-color-bg-brand-primary`, inset shadow `--sjs2-color-bg-basic-primary`, size `--sjs2-size-x300` |
| `date`/`time`/`week`/`month`/`datetime-local` (empty) | `[type="..."]:not(.sd-formbox__input--value-changed)` | color = placeholder token `--sjs2-color-component-input-default-placeholder` |
| `color` | — | no dedicated CSS; behavior only in question_text.ts |

## Brand override recipe

```css
/* border+focus color, radius, input text — highest-leverage tokens */
--sjs2-color-component-formbox-default-border: <brand input border>;
--sjs2-color-border-brand-primary: <brand focus color>;   /* semantic — affects all focus */
--sjs2-radius-component-formbox: <brand input radius>;
--sjs2-color-component-input-default-value: <input text color>;
```
