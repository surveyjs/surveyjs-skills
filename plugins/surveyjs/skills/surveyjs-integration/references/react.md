# React and Next.js

## Install

```bash
npm install survey-react-ui
```

`survey-core` arrives as a transitive dependency. Do not install it separately.

## Minimal correct component

```tsx
import { useCallback, useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";

const surveyJson = {
  elements: [
    { name: "FirstName", title: "Enter your first name:", type: "text" },
    { name: "LastName", title: "Enter your last name:", type: "text" }
  ]
};

export default function SurveyComponent() {
  const survey = useMemo(() => new Model(surveyJson), []);

  const saveResults = useCallback((sender: Model) => {
    fetch("/api/survey-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sender.data)
    });
  }, []);

  survey.onComplete.add(saveResults);

  return <Survey model={survey} />;
}
```

## The two mistakes that matter

**Constructing the model in the render body.** `new Model(json)` outside a `useMemo` runs on
every render, so React sees a new model each time and the respondent's answers vanish as they
type. Symptom: input clears on every keystroke.

```tsx
// WRONG — new model per render
export default function SurveyComponent() {
  const survey = new Model(surveyJson);
  return <Survey model={survey} />;
}
```

Module scope is also fine when one model instance per app is acceptable, and is what the
official quick-start shows:

```tsx
const survey = new Model(surveyJson);   // outside the component
```

Use `useMemo` instead whenever the JSON is a prop, comes from state, or is fetched.

**Adding the same handler repeatedly.** `onComplete.add` in the render body appends a new
subscriber on each render, so a completed survey POSTs N times. Registering a `useCallback`
value is safe — SurveyJS ignores a duplicate registration of the identical function
reference — but an inline arrow is not:

```tsx
survey.onComplete.add((sender) => save(sender.data));   // WRONG — new fn each render
```

For anything beyond one handler, register inside the memo:

```tsx
const survey = useMemo(() => {
  const model = new Model(surveyJson);
  model.onComplete.add(saveResults);
  model.onValueChanged.add(autoSave);
  return model;
}, []);
```

## Rebuilding when the JSON changes

Key the memo on the schema so switching forms produces a fresh model:

```tsx
const survey = useMemo(() => new Model(surveyJson), [surveyJson]);
```

If `surveyJson` is an object literal defined in the component, it is a new reference on every
render and the memo never holds. Define it at module scope, memoize it too, or key on a
stable id: `useMemo(() => new Model(schema), [schemaId])`.

## Next.js

The Form Library is browser-only — it touches `document` during render. Two steps:

**1. Mark the component as client-side.**

```tsx
"use client";
```

**2. Disable SSR at the import site** so the server never tries to render it. Without this you
get a hydration mismatch or a `document is not defined` build error.

```tsx
import dynamic from "next/dynamic";

const SurveyComponent = dynamic(() => import("@/components/Survey"), {
  ssr: false
});
```

The CSS import can stay in the component, or move to `app/layout.tsx` if several routes render
surveys.

## TypeScript

`Model` is the type of the model instance, so handlers annotate as:

```tsx
import type { Model } from "survey-core";
const handler = (sender: Model) => { /* sender.data */ };
```

Event options are typed per event — `CompleteEvent`, `ValueChangedEvent`, and so on, all
exported from `survey-core`.

## Fetching a schema from the backend

```tsx
const [schema, setSchema] = useState(null);

useEffect(() => {
  fetch(`/api/forms/${formId}`)
    .then((r) => r.json())
    .then(setSchema);
}, [formId]);

const survey = useMemo(() => (schema ? new Model(schema) : null), [schema]);

if (!survey) return <p>Loading…</p>;
return <Survey model={survey} />;
```

## More

Framework-specific source for any demo:
`https://surveyjs.io/form-library/examples/<name>/reactjs.md`
