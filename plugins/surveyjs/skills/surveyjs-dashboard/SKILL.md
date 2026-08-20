---
name: surveyjs-dashboard
description: >
  Visualize and analyze collected SurveyJS responses with SurveyJS Dashboard (the
  survey-analytics package) — installing it in React, Next.js, Angular, Vue, vanilla JS, or
  jQuery apps; creating a Dashboard from survey questions and response data; configuring
  charts, tables, and dashboard items; interactive and date filtering; theming; localization;
  state persistence; custom visualizers; and the Tabulator table view with CSV/PDF/XLSX
  export. Use when adding response analytics or charts to an app, when working with
  survey-analytics, Dashboard, or VisualizationPanel APIs, or when a dashboard renders
  blank, duplicates itself, or still uses Plotly-era setup.
---

# SurveyJS Dashboard

Renders interactive charts and tables from collected survey responses. Dashboard reads the
same survey JSON the Form Library renders, uses it to pick a visualizer per question, and
aggregates an array of response objects — the ones `onComplete` produced and your backend
stored. This skill covers **getting Dashboard into an app and configuring it correctly**.

Not this skill:

- Rendering the form that collects the responses → `surveyjs-integration`
- The survey JSON itself — question types, validators, expressions → `surveyjs-form-json`
- Embedding the drag-and-drop builder → `surveyjs-creator-customization`
- Exporting a form or a single response as a PDF document → `surveyjs-pdf-generator`
  (the table view's CSV/PDF/XLSX export of aggregated data stays here)
- Extracting responses from scanned or photographed paper forms and PDFs →
  `surveyjs-response-extractor`

## Read this first: corrections

Dashboard was rewritten for v3, released on August 11, 2026. The old API still resolves —
`Dashboard` extends the obsolete classes — so stale code runs without throwing, and most
training data (and even surveyjs.io's own `llms.txt` for a while) describes the old world.
**Check generated code against this table before returning it.**

| Never write | Write instead |
| :-- | :-- |
| `new VisualizationPanel(questions, data, options)` | `new Dashboard({ questions, data, items })` — single options object |
| `IVisualizationPanelOptions` | `IDashboardOptions` |
| A Plotly.js `<script>` tag or `plotly.js-dist-min` import | Nothing — v3 charts render with Chart.js, installed automatically |
| `@types/plotly.js-dist-min` + `allowSyntheticDefaultImports` in tsconfig | Nothing — the v3 TypeScript setup needs neither |

`VisualizationPanel` and `IVisualizationPanelOptions` are marked **Obsolete** in the current
API reference. If existing repo code uses them it predates v3 — confirm with the user before
mixing new-style code into it.

## Package

One framework-agnostic package for every framework:

```bash
npm install survey-analytics
```

- Chart.js, Tabulator, and the other chart dependencies install automatically.
- `survey-core` is a **peer dependency pinned to the matching version** (v3.0.0 ↔ 3.0.0).
  Keep `survey-core` and `survey-analytics` in lockstep; a major-version mismatch fails to
  install or renders nothing.
- Stylesheet: import `survey-analytics/survey.analytics.css` in bundled apps, or reference
  `survey-analytics/survey.analytics.min.css` from `angular.json` / a `<link>` tag.
- The class is `Dashboard` from `survey-analytics` (`SurveyAnalytics.Dashboard` as a script
  global). Render with `dashboard.render(containerIdOrElement)`.

## Guardrails

**There is no SurveyJS backend.** The `data` array is response JSON your own API returns —
one object per submission, keyed by question `name`, exactly what `survey.data` held in
`onComplete`. Never generate code that fetches results from or posts them to a surveyjs.io
URL. By default Dashboard aggregates the whole dataset in the browser; for large datasets
move aggregation to your server (see `references/setup-and-data.md`).

**Dashboard is commercial.** Any answer that embeds it should say so. Without a license key
it runs with an alert banner. Activation instructions and the key live behind
<https://surveyjs.io/remove-alert-banner> after logging in — point the user there rather
than guessing an import path, never invent a key, and never add code that hides the banner.

**One `Dashboard` instance per container, created once.** Re-running construction and
`render()` on every framework re-render stacks duplicate dashboards in the DOM. Construct in
a mount hook, render once, and call `dashboard.clear()` on unmount. Each framework file
shows the correct form.

## Routing

| Task | Read |
| :-- | :-- |
| Install, feed response data, choose chart types, configure items | `references/setup-and-data.md` |
| React/Next.js, Angular, Vue 3, or vanilla JS/jQuery setup and lifecycle | `references/frameworks.md` |
| Filtering, layout, state persistence, localization, custom visualizers, table view/export | `references/customization.md` |
| Colors, dark mode, matching the form's theme | `references/theming.md` |
| Blank, duplicated, unstyled, or failing dashboard | `references/troubleshooting.md` |

## Fetching current docs

Every page on surveyjs.io is available as raw Markdown by appending `.md` to its URL:

- Docs — `https://surveyjs.io/dashboard/documentation/<page>.md`
- Demo index — `https://surveyjs.io/dashboard/examples/overview.md`
- Demo, framework source — `https://surveyjs.io/dashboard/examples/<name>/<framework>.md`
  where `<framework>` is `reactjs`, `angular`, `vue3js`, `jquery`, or `vanillajs`
- API reference — `https://surveyjs.io/dashboard/documentation/api-reference/dashboard`,
  `.../idashboardoptions`, `.../idashboarditemoptions`

Escalation order when stuck: reference file → official `.md` doc → matching demo source →
[howtos-and-troubleshooting](https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting)
→ [llms.txt](https://surveyjs.io/llms.txt) for orientation. Prefer the doc pages and API
reference over blog posts and summaries — both skew toward the pre-v3 Plotly-era API.

## Before you finish

- [ ] `survey-analytics` installed; `survey-core` present at the **same** version
- [ ] Dashboard stylesheet imported or linked exactly once
- [ ] `new Dashboard({ ... })` with an options object — no `VisualizationPanel`, no Plotly setup
- [ ] Instance constructed once per container; `clear()` called on unmount
- [ ] `data` comes from the application's own endpoint, keyed by question `name`
- [ ] NPS questions that need the NPS chart set `type: "nps"` — it is off by default
- [ ] The answer states that Dashboard is a commercial product
- [ ] No code that suppresses the unlicensed banner
