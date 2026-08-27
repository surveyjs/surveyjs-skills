# Vue 3

## Install

```bash
npm install survey-vue3-ui
```

`survey-core` arrives as a transitive dependency.

**Vue 2 is not supported.** The old `survey-vue` package targeted Vue 2 and is discontinued.
If the app is on Vue 2, that is a migration conversation, not an integration one — say so
rather than generating `survey-vue` code.

## Direct component import

The simplest form, and what the quick-start shows:

```vue
<script setup lang="ts">
import { Model } from "survey-core";
import { SurveyComponent } from "survey-vue3-ui";
import "survey-core/survey-core.css";

const surveyJson = {
  headerView: "advanced",
  elements: [
    { name: "FirstName", title: "Enter your first name:", type: "text" },
    { name: "LastName", title: "Enter your last name:", type: "text" }
  ]
};

const survey = new Model(surveyJson);

survey.onComplete.add(async (sender, options) => {
  options.showSaveInProgress();
  try {
    await fetch("/api/survey-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sender.data)
    });
    options.showSaveSuccess();
  } catch {
    options.showSaveError("Could not save your answers.");
  }
});
</script>

<template>
  <SurveyComponent :model="survey" />
</template>
```

`<script setup>` runs once per component instance, so `new Model(...)` at its top level is
already correct — no memoization needed.

## Global plugin registration

If several components render surveys, register once in `main.ts` and drop the per-component
import:

```ts
import { createApp } from "vue";
import { surveyPlugin } from "survey-vue3-ui";
import "survey-core/survey-core.css";
import App from "./App.vue";

createApp(App).use(surveyPlugin).mount("#app");
```

The plugin registers `SurveyComponent` and `PopupSurveyComponent` globally, plus every
question component. Pick one approach — registering globally *and* importing locally is
harmless but redundant.

## Do not wrap the model in `ref` or `reactive`

The model is already observable; Vue's proxy on top of it causes identity checks inside
SurveyJS to fail, producing stale or frozen UI.

```ts
const survey = ref(new Model(surveyJson));      // WRONG
const survey = reactive(new Model(surveyJson)); // WRONG
const survey = new Model(surveyJson);           // correct
```

Use `shallowRef` if the *reference* must be swappable (e.g. loading a different form):

```ts
import { shallowRef } from "vue";
const survey = shallowRef<Model | null>(null);

onMounted(async () => {
  const json = await (await fetch(`/api/forms/${formId}`)).json();
  survey.value = new Model(json);
});
```

```vue
<template>
  <SurveyComponent v-if="survey" :model="survey" />
</template>
```

## Nuxt

Form Library v3 supports server-side rendering, so render `SurveyComponent` normally — no
`<ClientOnly>` wrapper needed:

```vue
<template>
  <SurveyComponent :model="survey" />
</template>
```

Build the model synchronously from a schema that is identical on the server and the client, or
the hydration will mismatch. If the schema is fetched, use `useAsyncData` (which transfers the
payload to the client) rather than `onMounted` + `fetch`:

```ts
const { data: json } = await useAsyncData("survey", () => $fetch(`/api/forms/${formId}`));
const survey = new Model(json.value);
```

Do not touch `window`, `document`, or `localStorage` while constructing the model; move that
into `onMounted` or an event handler.

**On v2 and earlier** the library is browser-only: keep the `<ClientOnly>` wrapper, or name the
component file `Survey.client.vue`.

## More

Framework-specific source for any demo:
`https://surveyjs.io/form-library/examples/<name>/vue3js.md`
