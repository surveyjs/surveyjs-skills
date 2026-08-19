# Setup and save wiring

## Install

Install the renderer only. `survey-creator-core` comes with it, and so do the Form Library
packages — the design surface renders a live survey.

```bash
npm install survey-creator-react --save     # or -angular, -vue, -js
```

Keep `survey-creator-*` and `survey-core` on matching versions. A half-upgraded set is a common
cause of a designer that renders blank or throws on load; letting the renderer pull its own
dependencies avoids it.

## Styles

Two stylesheets, both required, imported once at app level:

```js
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
```

The Creator stylesheet applies the Light UI theme. Other builder themes are JSON objects
applied in code — see `theming.md`.

## Configure

Options go in an `ICreatorOptions` object passed to the constructor:

```js
import { ICreatorOptions } from "survey-creator-core";

const creatorOptions: ICreatorOptions = {
  autoSaveEnabled: true,     // save on every change instead of on a button
  collapseOnDrag: true,
  questionTypes: ["text", "checkbox", "radiogroup", "dropdown"]   // limit the toolbox
};
```

`autoSaveEnabled` replaced `isAutoSave`. `questionTypes` restricts which question types the
toolbox offers at all — for finer control over toolbox contents see `customization.md`, and for
per-customer configuration see `ui-presets.md`.

## Create and render

The model class is `SurveyCreatorModel` from `survey-creator-core`. `survey-creator-react`
re-exports it as `SurveyCreator`; both build the same object.

**Create the model once.** Rebuilding it on every render throws away the user's editing state,
the same way rebuilding a survey `Model` throws away answers.

### React

```jsx
import { useState } from "react";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

export default function CreatorWidget() {
  const [creator] = useState(() => new SurveyCreator(creatorOptions));
  return <SurveyCreatorComponent creator={creator} />;
}
```

### Angular

Import `SurveyCreatorModule` from `survey-creator-angular` — into `NgModule.imports`, or
directly into a standalone component's `imports` array.

```ts
export class CreatorComponent {
  creatorModel = new SurveyCreatorModel(creatorOptions);
}
```

```html
<survey-creator [model]="creatorModel"></survey-creator>
```

### Vue 3

```vue
<script setup>
import { SurveyCreatorComponent } from "survey-creator-vue";
import { SurveyCreatorModel } from "survey-creator-core";
const creator = new SurveyCreatorModel(creatorOptions);
</script>

<template>
  <SurveyCreatorComponent :model="creator" />
</template>
```

Do not wrap the creator in `ref()` or `reactive()`; use the raw instance.

### Vanilla JS

```js
import { SurveyCreatorModel } from "survey-creator-core";
import { renderSurveyCreator } from "survey-creator-js";

const creator = new SurveyCreatorModel(creatorOptions);
renderSurveyCreator(creator, document.getElementById("creatorElement"));
```

Via script tags, load the Form Library resources **before** the Creator ones, then
`survey-creator-core` and `survey-creator-js`.

`creator.render(element)` is gone. Code calling it produces an empty page, not an error.

## Reading and writing the JSON

| Property | Type |
| :-- | :-- |
| `creator.JSON` | the survey definition as an object |
| `creator.text` | the same definition as a string |

Assign either to load a schema into the designer; read either to get the current one.

## Saving

Implement `saveSurveyFunc`. It receives an incrementing `saveNo` and a `callback`:

```js
creator.saveSurveyFunc = (saveNo, callback) => {
  fetch("https://your-api.example/forms/42", {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify(creator.JSON)
  })
    .then(response => callback(saveNo, response.ok))
    .catch(() => callback(saveNo, false));
};
```

Two things that are easy to get wrong:

- **Always call the callback**, with `true` or `false` for whether the server accepted it.
  Swallowing a failure leaves the user believing their work is saved.
- **`saveNo` exists because requests race.** Change #11 can reach the server before #10. Store
  the highest `saveNo` seen server-side and ignore anything lower, or an older revision will
  silently overwrite a newer one.

Do not read editing state out of internal properties to save it, and do not poll — the save
hook and `onModified` are the supported paths.

## Backend examples

Reference integrations for PHP, ASP.NET Core, NodeJS (with PostgreSQL and MongoDB variants) and
Python live under <https://github.com/surveyjs>, and are listed at
`https://surveyjs.io/survey-creator/documentation/integration-with-backend.md`.
