# Vanilla JavaScript and jQuery

The renderer package is `survey-js-ui` for both. There is no separate jQuery package —
`survey-jquery` and `survey-knockout` are discontinued.

## Option A: CDN / plain HTML page

```html
<head>
  <link href="https://unpkg.com/survey-core/survey-core.min.css" rel="stylesheet">
  <script src="https://unpkg.com/survey-core/survey.core.min.js"></script>
  <script src="https://unpkg.com/survey-js-ui/survey-js-ui.min.js"></script>
</head>
<body>
  <div id="surveyContainer"></div>
</body>
```

Both scripts are required, in that order — `survey-js-ui` depends on the globals that
`survey.core.min.js` defines.

```js
const surveyJson = {
  elements: [
    { name: "FirstName", title: "Enter your first name:", type: "text" },
    { name: "LastName", title: "Enter your last name:", type: "text" }
  ]
};

const survey = new Survey.Model(surveyJson);

survey.onComplete.add((sender, options) => {
  options.showSaveInProgress();
  fetch("/api/survey-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sender.data)
  })
    .then(() => options.showSaveSuccess())
    .catch(() => options.showSaveError("Could not save your answers."));
});

document.addEventListener("DOMContentLoaded", function () {
  survey.render(document.getElementById("surveyContainer"));
});
```

Note the two different names: the global namespace is `Survey`, so the model is
`new Survey.Model(...)`. Pin a version in production rather than tracking `latest`:
`https://unpkg.com/survey-core@3.0.0/survey.core.min.js`.

## Option B: npm with a bundler

```bash
npm install survey-js-ui
```

```js
import { Model } from "survey-core";
import "survey-js-ui";
import "survey-core/survey-core.css";

const survey = new Model(surveyJson);
survey.render(document.getElementById("surveyContainer"));
```

Importing `survey-js-ui` for its side effect installs the `render` method onto the model.
Alternatively call the exported function directly, which is equivalent:

```js
import { renderSurvey } from "survey-js-ui";
renderSurvey(survey, document.getElementById("surveyContainer"));
```

Stylesheet paths differ between the two options: `survey-core/survey-core.css` from npm,
`survey-core/survey-core.min.css` from the CDN.

## jQuery

Same packages; the plugin form is a thin wrapper over the same render call.

```js
$(function () {
  $("#surveyContainer").Survey({ model: survey });
});
```

A popup variant is registered as `$("#el").PopupSurvey({ model: survey })`.

Everything else — the model, events, themes, saving — is identical to the vanilla path above.
jQuery is only the mounting mechanism, so consult the rest of this skill unchanged.

## Rendering into a container that is replaced

If the container element is removed and re-created (SPA route change, `innerHTML` rewrite),
call `render` again with the new element. Re-rendering into a container that already holds a
survey produces a duplicated form — clear it first:

```js
container.innerHTML = "";
survey.render(container);
```

## More

Framework-specific source for any demo:
`https://surveyjs.io/form-library/examples/<name>/vanillajs.md`
