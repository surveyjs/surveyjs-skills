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
  headerView: "advanced",
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

SurveyJS Form Library v3 supports server-side rendering. In the App Router, render the form
normally so it is included in the initial HTML and hydrated for interaction.

Mark the component that imports and renders `<Survey>` as client code. This is still required
for interactivity; it does not prevent Next.js from pre-rendering the component on the server.

```tsx
// components/Survey.tsx
"use client";

import { useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";

export default function SurveyComponent({ schema }: { schema: object }) {
  const survey = useMemo(() => new Model(schema), [schema]);
  return <Survey model={survey} />;
}
```

Keep the page itself a Server Component when it only loads the schema and passes it to the
client component:

```tsx
// app/survey/page.tsx
import SurveyComponent from "@/components/Survey";
import surveyJson from "@/surveys/feedback.json";

export default function SurveyPage() {
  return <SurveyComponent schema={surveyJson} />;
}
```

Props crossing the server/client boundary must be JSON-serializable. Pass the **schema**, not
a `Model` instance — constructing the model on the server and handing it to a client component
throws a serialization error.

Import `survey-core/survey-core.css` exactly once. In the App Router put it in
`app/layout.tsx` rather than in the component, so several survey routes share one import. The
schema and initial model state must be deterministic so the server render and client hydration
match.

Rendering two surveys on one page? Set a distinct `elementIdPrefix` on each model. Element ids
are deterministic per survey, so two models produce the same ids and collide in the SSR HTML:

```tsx
const survey = useMemo(() => {
  const model = new Model(schema);
  model.elementIdPrefix = instanceId;   // e.g. "left_" / "right_"
  return model;
}, [schema, instanceId]);
```

**On v2 and earlier** the Form Library is browser-only. Keep the old workaround there:
`dynamic(() => import("@/components/Survey"), { ssr: false })`.

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
