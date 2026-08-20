# Framework setup

The package and the `Dashboard` class are the same everywhere — only the mount point and
lifecycle differ. `render()` accepts a container element or its id string. Dashboard touches
the DOM, so it is browser-only in every framework.

## React and Next.js

Construct and render inside `useEffect`, clean up with `clear()`:

```tsx
'use client'
import 'survey-analytics/survey.analytics.css';
import { useEffect } from 'react';
import { Model } from 'survey-core';
import { Dashboard } from 'survey-analytics';

export default function DashboardComponent({ surveyJson, surveyResults }) {
  useEffect(() => {
    const survey = new Model(surveyJson);
    const dashboard = new Dashboard({
      questions: survey.getAllQuestions(),
      data: surveyResults
    });
    dashboard.render("dashboard");
    return () => {
      dashboard.clear();          // without this, re-mounts stack duplicate dashboards
    };
  }, [surveyJson, surveyResults]);

  return <div id="dashboard" />;
}
```

The cleanup is not optional: React 18 StrictMode mounts effects twice in development, and
any re-mount without `clear()` leaves the previous dashboard in the DOM.

**Next.js** additionally needs the import site to skip SSR, or the build fails on `document`
access / hydration mismatch:

```tsx
// dashboard/page.tsx
import dynamic from "next/dynamic";
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
```

When results arrive from your API, fetch them in the effect (or upstream) and construct the
`Dashboard` only after the data resolves — rendering with `data: undefined` shows nothing.

## Angular

Stylesheet goes in `angular.json`, not a component import:

```json
"styles": [
  "src/styles.css",
  "node_modules/survey-analytics/survey.analytics.min.css"
]
```

Construct in `ngAfterViewInit` (the container must exist), clean up in `ngOnDestroy`:

```ts
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Model } from 'survey-core';
import { Dashboard } from 'survey-analytics';

@Component({
  selector: 'app-dashboard',
  template: '<div id="dashboard"></div>'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private dashboard?: Dashboard;

  ngAfterViewInit(): void {
    const survey = new Model(surveyJson);
    this.dashboard = new Dashboard({
      questions: survey.getAllQuestions(),
      data: surveyResults
    });
    this.dashboard.render("dashboard");
  }

  ngOnDestroy(): void {
    this.dashboard?.clear();
  }
}
```

There is no Angular wrapper component and none is needed — this is the intended pattern.

## Vue 3

```html
<script setup lang="ts">
import 'survey-analytics/survey.analytics.css'
import { onMounted, onBeforeUnmount } from 'vue'
import { Model } from 'survey-core'
import { Dashboard } from 'survey-analytics'

let dashboard: Dashboard | undefined;

onMounted(() => {
  const survey = new Model(surveyJson);
  dashboard = new Dashboard({
    questions: survey.getAllQuestions(),
    data: surveyResults
  });
  dashboard.render("dashboard");
});

onBeforeUnmount(() => dashboard?.clear());
</script>

<template>
  <div id="dashboard" />
</template>
```

Do not make the `Dashboard` instance a `ref()` — it is not reactive state, and deep proxying
a large object wastes memory.

## Vanilla JS and jQuery

Script order matters — Survey Core, then Chart.js, then Dashboard. Chart.js is **not**
bundled into the CDN build, so reference it explicitly:

```html
<head>
  <script src="https://unpkg.com/survey-core/survey.core.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js"></script>
  <link href="https://unpkg.com/survey-analytics/survey.analytics.min.css" rel="stylesheet">
  <script src="https://unpkg.com/survey-analytics/survey.analytics.min.js"></script>
</head>
<body>
  <div id="dashboard"></div>
</body>
```

```js
const survey = new Survey.Model(surveyJson);
const dashboard = new SurveyAnalytics.Dashboard({
  questions: survey.getAllQuestions(),
  data: surveyResults
});
document.addEventListener("DOMContentLoaded", () => {
  dashboard.render(document.getElementById("dashboard"));
});
```

`survey-js-ui` and the Form Library stylesheet are only needed if the same page also
renders the form. jQuery apps use this exact setup — there is no jQuery-specific package.
