# Toolbox and property grid

For configuration that differs **per customer or project**, read `ui-presets.md` first — it
covers the same ground declaratively and is usually the better shape.

## Limiting what users can add

The blunt instrument is the `questionTypes` option, which restricts the toolbox to the listed
types:

```js
const creatorOptions = {
  questionTypes: ["text", "checkbox", "radiogroup", "dropdown"]
};
```

## Toolbox

`creator.toolbox` is a `QuestionToolbox` instance.

**Customise a built-in item** by fetching it and editing its `json` — the object that gets
inserted when the item is dropped onto the design surface:

```js
creator.toolbox.getItemByName("dropdown").json.choices = [
  { text: "Option 1", value: 1 },
  { text: "Option 2", value: 2 }
];
```

**Add a JSON variation** — a preconfigured version of an existing type, useful for reusable
templates:

```js
creator.toolbox.addItem({
  name: "csat",
  title: "CSAT",
  json: { type: "rating", rateMax: 5, title: "How satisfied were you?" }
});
```

JSON variations do not support type conversion, and users can still change any property the
JSON sets. If you need fixed properties, conversion support, or real encapsulated behaviour,
define a **custom question type** instead — that is a Form Library feature
(`ComponentCollection`), documented under *Customize Question Types*, and the toolbox picks up
the new type automatically.

**Layout and grouping:**

| Property / method | Effect |
| :-- | :-- |
| `toolbox.isCompact`, `toolbox.forceCompact` | Icon-only vs full mode |
| `toolbox.defineCategories(...)`, `toolbox.changeCategories(...)` | Group items into categories |
| `toolbox.showCategoryTitles` | Show category headings |
| `toolbox.allowExpandMultipleCategories`, `toolbox.keepAllCategoriesExpanded` | Category expand behaviour |
| `toolbox.showSubitems` | Show or hide subitems |

## Property grid

### Hiding properties

Default to `creator.onPropertyShowing`. The property grid exists only in Creator, and the event
is scoped to one Creator instance. It fires once per property of the selected element, so test
both `options.property.name` and the element type. For one specific type, there are two checks,
and which one fits is the user's call — ask when the request does not settle it:

- `options.element.getType() === "boolean"` — exactly that type.
- `options.element.isDescendantOf("boolean")` — that type plus custom types registered with it as
  the parent. Same result as `getType()` for built-in types.

For "every question", check `options.element.isQuestion`. It is defined on `Base`, so it is safe
on every object the grid shows — the survey, pages, panels and matrix columns return `false`
and keep their full grid.

All three are documented in the [`Base`](https://surveyjs.io/form-library/documentation/api-reference/base.md)
API reference: [`getType()`](https://surveyjs.io/form-library/documentation/api-reference/base.md#getType),
[`isDescendantOf()`](https://surveyjs.io/form-library/documentation/api-reference/base.md#isDescendantOf),
[`isQuestion`](https://surveyjs.io/form-library/documentation/api-reference/base.md#isQuestion).

**Allowlists.** To show only a few properties, set `options.show` from a list — the
[Hide Properties from the Property Grid](https://surveyjs.io/survey-creator/documentation/property-grid-customization.md#hide-properties-from-the-property-grid)
doc has the white-list variant. One list can serve all question types: the event only fires for
properties the element actually has, so listing `choices` shows it on choice-based types and
nowhere else.

**Hiding a property is not removing the feature.** Before warning users about what an allowlist
takes away, check whether the feature has another entry point:

- Conditions (`visibleIf`, `enableIf`, `requiredIf`, …) stay editable in the
  [Logic tab](https://surveyjs.io/survey-creator/documentation/end-user-guide/user-interface.md#logic-tab),
  as long as that tab is enabled.
- Matrix rows and columns stay editable on the design surface. In a row or column title's
  in-place editor, Enter adds a new one and Backspace removes the current one.

Fall back to `Serializer.getProperty(className, name).visible = false` only when the property
should be hidden in every Creator instance in the app. It mutates global `survey-core` metadata:
for an inherited property, `getProperty` adds a copy owned by `className`, and subclasses pick
that copy up, so it behaves like `isDescendantOf`. Do not use `Serializer.findProperty` here — for
an inherited property it returns the shared parent definition, so hiding `title` on `"boolean"`
hides it for every question type.

On v3, a per-project list of visible properties that should live in a reviewed file is a UI
preset's `propertyGrid` section — see `ui-presets.md`.

Code and option names: [Hide Properties from the Property Grid](https://surveyjs.io/survey-creator/documentation/property-grid-customization.md#hide-properties-from-the-property-grid),
the [`onPropertyShowing`](https://surveyjs.io/survey-creator/documentation/api-reference/survey-creator.md#onPropertyShowing)
reference, and the runnable [Remove Properties from the Property Grid](https://surveyjs.io/survey-creator/examples/remove-properties-from-property-grid/documentation.md)
example.

The event was called `onShowingProperty` before v2, and snippets written for it set
`options.canShow` and read `options.obj`. Write `options.show` and `options.element`.

### Overriding default values

```js
Serializer.getProperty("matrix", "eachRowRequired").defaultValue = true;
```

**These defaults are not written into the survey JSON.** They change what the designer starts
with, nothing more — so the same code must also run in the application that renders the form,
or the runtime behaviour will not match what the author configured. If that split is
unwelcome, assign the values from a Creator event when the element is created instead, so they
land in the JSON.

Localizable defaults (button captions and similar) go through the locale strings rather than
the serializer:

```js
import { getLocaleStrings } from "survey-core";
const en = getLocaleStrings("en");
en.pageNextText = "Forward";
```

### Help texts

Property editor hints live under `pehelp` in the **Creator** locale strings — `getLocaleStrings`
from `survey-creator-core`, not the `survey-core` function used above. Both packages export a
function with that name, and the `survey-core` dictionary has no `pehelp` object. Code:
[Add Help Texts to Property Editors](https://surveyjs.io/survey-creator/documentation/property-grid-customization.md#add-help-texts-to-property-editors).

### The property grid is a survey

It is a one-page survey in which every property is a question — which is why it can be
customised with the same tools as any other survey. To reach that survey instance, handle
`onSurveyInstanceCreated` and check for the `"property-grid"` area:

```js
creator.onSurveyInstanceCreated.add((sender, options) => {
  if (options.area === "property-grid") {
    // options.survey is the property grid itself
  }
});
```

That is also the hook for behaviour the property grid inherits from survey-core — validation
among it, since the grid's own questions raise the same events any survey does.

Adding entirely new property editors means defining a custom question JSON configuration, the
same way you would extend a survey. That is documented in the Form Library docs under
*Customize Question Types*.

## Tracking edits

`creator.onModified` fires whenever the survey JSON changes. One caveat worth knowing: edits
made directly in the JSON editor tab are applied to the model when that tab is deactivated, not
on every keystroke, so a handler expecting per-character updates from that tab will not see
them.
