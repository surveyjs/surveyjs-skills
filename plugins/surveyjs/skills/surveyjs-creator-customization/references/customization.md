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

Two APIs, and the choice is about scope:

- `Serializer.getProperty(className, name).visible = false` — a Form Library API, so it hides
  the property in every Creator instance in the app. Use it for one property hidden everywhere.
- `creator.onPropertyShowing` — per Creator instance, decided per element. Use it for lists of
  properties or conditional hiding.

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

Property editor hints live in the same locale strings, under `pehelp`:

```js
getLocaleStrings("en").pehelp.title = "Text displayed above the question";
```

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
