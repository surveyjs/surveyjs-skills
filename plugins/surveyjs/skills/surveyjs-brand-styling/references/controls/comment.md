# `comment` — multi-line textarea

Web analog: `<textarea>`.
Shared input surface (text colors, borders, focus/hover, error): [_shared.md](_shared.md) §3.

Classes: root `sd-formbox sd-comment`, control `sd-formbox__input sd-comment__input`,
resize grip `sd-comment__grip`, counter `sd-formbox__character-counter sd-comment__character-counter`.
SCSS: `blocks/sd-comment.scss` + `blocks/sd-formbox.scss`. Markup: `survey-react-ui/src/components/text-area.tsx`
(native `resize` disabled inline; custom grip + ResizeManager used instead).

## Control-specific

| Aspect | Selector | Tokens / values |
| :-- | :-- | :-- |
| Min size | `.sd-comment__input` | min-width `--sjs2-size-x600` (48px), min-height `--sjs2-size-x500` (40px) |
| Layout | `.sd-comment` | column flex, gap 0, width 100% |
| Resize grip | `.sd-comment__grip` | offset `--sjs2-spacing-x050`; icon fill `--sjs2-color-component-input-default-icon` → fg-basic-tertiary (rgba #1C1B20/40%), size `--sjs2-size-x200` |
| Character counter | `.sd-comment__character-counter` | hidden (opacity 0) until `.sd-comment:focus-within`; display gated by `.sd-formbox:focus-within .sd-formbox__character-counter` |

Focus/hover/error/readonly states: inherited from `.sd-formbox` state tokens ([_shared.md](_shared.md) §3).

## Brand override recipe

Same tokens as `text` (formbox family). Additionally:

```css
--sjs2-color-component-input-default-icon: <grip/icon color>;
```
