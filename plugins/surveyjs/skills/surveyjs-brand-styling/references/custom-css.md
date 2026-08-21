# Custom CSS: variable overrides + scoped rules

Style the survey to match the host app with one custom stylesheet. Order of preference
inside that file: **token overrides first**, scoped CSS rules only where no token exists.

## File layout

One file, e.g. `survey-brand.css`, loaded **after** `survey-core.css` (and after a theme
adapter, if any):

```js
import "survey-core/survey-core.css";
// import "survey-core/themes/adapters/mui.css";   // if an adapter is in use
import "./survey-brand.css";                       // always last
```

Recommended internal order:

```css
/* 1. token overrides (scoped — see below) */
.sjs-theme-overrides { /* --sjs2-* overrides */ }
/* 2. custom rules per control, each scoped under the survey root */
.sd-root-modern .sd-rating__item { /* ... */ }
```

## Scoping: why `:root` overrides fail

`applyTheme` (and the default theme) injects `cssVariables` at runtime into a `<style>`
element under `:where(.sd-theme-root)` — see `packages/survey-core/src/utils/base-theme-init.ts`
(`rules.push(":where(.sd-theme-root) { ... }")`). Custom properties resolve by **proximity**:
a value set on the element itself (`.sd-theme-root`) beats anything inherited from `:root`.
So when any theme is applied:

```css
:root { --sjs2-color-project-brand-600: #085de5; }              /* LOSES to injected tokens */

.sjs-theme-overrides { --sjs2-color-project-brand-600: #085de5; } /* WINS (same element,
                        class selector (0,1,0) beats :where(...) which has 0 specificity) */
```

`.sjs-theme-overrides` and `.sd-theme-root` sit on the same root element
(`rootTheme: "sd-theme-root sjs-theme-overrides"` in `src/defaultCss/defaultCss.ts`);
use `.sjs-theme-overrides` — it is the designated stylesheet-override hook (theme adapters
use it too).

`:root` IS sufficient only when no theme is ever applied at runtime (pure static CSS setup,
no `applyTheme` call) — but scoping to `.sjs-theme-overrides` works in both setups, so
default to it.

## Step 1: token overrides

Find the token in the per-control tables ([controls/](controls/_shared.md), catalog in
[design-tokens.md](design-tokens.md)). Examples:

```css
.sjs-theme-overrides {
  /* input border + focus (all formbox controls: text, comment, dropdown, tagbox...) */
  --sjs2-color-component-formbox-default-border: #c7c9d1;
  --sjs2-color-border-brand-primary: #085de5;          /* focus border (semantic) */
  --sjs2-radius-component-formbox: 6px;

  /* checked color for checkbox/radio/switch at once (semantic) */
  --sjs2-color-bg-brand-primary: #085de5;

  /* popup shadow (dropdown/tagbox lists, modals) */
  --sjs2-border-effect-floating-default: 0 4px 12px rgba(0 0 0 / 0.15);
}
```

## Step 2: custom rules for verified token gaps

Some controls have no component token family (see the notes in [controls/](controls/_shared.md)
files). Scope every rule under the survey root; pair it with the token override it complements.

**Rating pills** (SCSS-var based — no `--sjs2-color-component-rating-*` tokens):

```css
.sjs-theme-overrides { --sjs2-radius-component-rating: 6px; }   /* token exists for radius */
.sd-root-modern .sd-rating__item--selected {                    /* color needs a rule */
  background-color: #085de5;
}
```

**Signaturepad focus ring** (canvas `outline: none` with no replacement — a11y gap):

```css
.sjs-theme-overrides { --sjs2-color-component-input-default-line: #c7c9d1; } /* pad border token */
.sd-root-modern .sjs_sp_container:focus-within {
  outline: 2px solid #085de5;
  outline-offset: 2px;
}
```

**Imagepicker image radius** (shares system-wide `--sjs2-radius-x100` — don't touch that):

```css
.sd-root-modern .sd-imagepicker__item img,
.sd-root-modern .sd-imagepicker__image-container > div {
  border-radius: 12px;                 /* scoped rule instead of the shared token */
}
```

## Stable-hook policy

- Prefer single BEM block classes (`.sd-rating__item--selected`, `.sd-tagbox-item`) over
  descendant chains that mirror internal DOM (`.sd-question > div > div > input`).
- Record the survey-core version the selectors were verified against in a comment at the top
  of `survey-brand.css`; re-run the visual check after each library upgrade.
- Class names are internal API — expect breakage between majors; tokens are the stable surface.

## Attaching your own classes instead

When per-question or conditional styling is needed, add YOUR class names via the survey API
rather than targeting `sd-*` (event fires with `{ question, cssClasses }` —
`SurveyModel.updateQuestionCssClasses` in `src/survey.ts`; `onUpdatePanelCssClasses` /
`onUpdatePageCssClasses` are analogous):

```js
survey.onUpdateQuestionCssClasses.add((_, options) => {
  if (options.question.getType() === "rating") {
    options.cssClasses.root += " acme-rating";       // now style .acme-rating in your CSS
    options.cssClasses.itemSelected += " acme-rating__item--selected";
  }
});
```

The `cssClasses` keys per question type mirror `src/defaultCss/defaultCss.ts`.
A whole-survey class replacement is also possible via the `survey.css` property, but the
event is preferred — it extends instead of replacing.

## Anti-patterns

- `!important` against `.sd-*` rules — fix the scope/specificity instead.
- Deep descendant selectors mirroring internal DOM structure (markup changes between versions).
- Copying compiled `survey-core.css` and editing it.
- Unscoped `:root` token overrides when a theme is applied (silently lose — see above).
- Overriding shared system tokens (`--sjs2-radius-x100`, `--sjs2-base-unit-*`) to fix one
  control — use a scoped rule for that control instead.
- Styling bare element selectors (`input`, `table`) inside or outside the survey root.

## Choosing this route

Use custom CSS as the primary vehicle when the host has **no supported adapter and no formal
brandbook**: reverse-engineer the host's computed styles (inputs, buttons, focus ring, radii,
font) into token values first ([brandbook-intake.md](brandbook-intake.md) table as the
checklist), then close the remaining gaps with scoped rules.
