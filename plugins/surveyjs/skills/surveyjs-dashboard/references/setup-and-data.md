# Setup and data

## Install

```bash
npm install survey-analytics
```

Chart.js (charts), Tabulator (table view), and the layout engine arrive as dependencies —
do not add them by hand in a bundled app. `survey-core` is a **peer dependency pinned to
the matching version**; npm ≥ 7 installs it automatically, but if the project already has a
different `survey-core` version the install fails or misbehaves. Check alignment first:

```bash
npm ls survey-core survey-analytics
```

Stylesheet, exactly once:

```js
import "survey-analytics/survey.analytics.css";
```

(Angular puts `node_modules/survey-analytics/survey.analytics.min.css` in the `angular.json`
`styles` array instead; CDN pages link `survey.analytics.min.css` — see
`references/frameworks.md`.)

## How the pieces relate

| Piece | Where it comes from |
| :-- | :-- |
| Survey schema (JSON) | Authored in your app or Survey Creator; stored in your database |
| Response rows | One JSON object per submission — `survey.data` captured in `onComplete` and POSTed to your API |
| Dashboard | Reads both: the schema tells it question names, types, and choice texts; the rows are what it aggregates |

There is no SurveyJS-hosted storage. Your endpoint returns an array like:

```json
[
  { "satisfaction-score": 5, "nps-score": 10 },
  { "satisfaction-score": 3, "nps-score": 6 }
]
```

Keys are question `name` values. Composite questions (matrix, multiple textboxes) store
nested objects under their name, and Dashboard understands them as long as the schema is
provided via `questions`.

## Constructing the Dashboard

Pass one `IDashboardOptions` object. Alongside `data`, provide `questions`, `items`, or both:

```js
import { Model } from "survey-core";
import { Dashboard } from "survey-analytics";

const survey = new Model(surveyJson);

const dashboard = new Dashboard({
  questions: survey.getAllQuestions(),   // auto-generate one item per question
  data: surveyResults,
  items: [                               // optional: select and override
    "satisfaction-score",                // keep the auto-generated item as-is
    { name: "nps-score", type: "nps" }   // merge overrides into the generated item
  ]
});
dashboard.render("dashboard");
```

- **`questions` only** — an item per question, with a visualizer chosen from the question
  type and an `availableTypes` list users can switch between.
- **`questions` + `items`** — items are generated, then the `items` array selects which
  appear, their order, and per-item overrides.
- **`items` only** — no schema needed; bind each item to a data field by `name` (or
  `dataField` when the identifier and field differ) and set `type` explicitly.

Per-item options (`IDashboardItemOptions`): `name`, `dataField`, `title`, `type`,
`availableTypes`, `allowChangeType` (lock the type with `false`), `visible`, and
`visualizer` (settings passed to the underlying visualizer).

## Visualization types

`type` / `availableTypes` values and the question types they fit:

| `type` | Chart | Works with |
| :-- | :-- | :-- |
| `bar` / `vbar` | Horizontal / vertical bar | radiogroup, checkbox, dropdown, tagbox, imagepicker, boolean, matrix, ranking |
| `pie` / `doughnut` | Pie / doughnut | Same selection types as bar (except single-select matrix) |
| `histogram` / `vhistogram` | Distribution | text with `inputType` number/date/datetime, rating |
| `gauge` / `bullet` | Single average value | numeric text, rating, expression |
| `radar` | Radar / spider | ranking |
| `stackedbar` | Stacked bar | single-select matrix |
| `wordcloud` / `text` | Word cloud / raw table | text, comment, multipletext |
| `choices` | Statistics table | radiogroup, checkbox, dropdown, boolean |
| `nps` | NPS breakdown | rating — **disabled by default**, see below |
| `responsecount` | Total response count | not bound to a question |
| `pivot` | Multi-dimension pivot chart | any; needs its own `questions` list |

These also work for questions nested in multi-select/dynamic matrices and dynamic panels.
Full per-chart detail: <https://surveyjs.io/dashboard/documentation/chart-types.md>.

**NPS** is not offered unless requested. Make it the default with
`{ name: "nps_score", type: "nps" }`, or merely selectable by adding `"nps"` to that item's
`availableTypes`.

**Response count** is a standalone item: `{ type: "responsecount", title: "Total responses" }`.

**Pivot** gets the questions users may pivot over:

```js
items: [{
  name: "pivot-chart",
  type: "pivot",
  title: "Demographics analysis",
  questions: survey.getAllQuestions()
}]
```

## Large datasets

By default Dashboard loads every stored response and aggregates in the browser; this
degrades as data grows. Move aggregation to the server and return precomputed statistics —
reference implementation:
<https://github.com/surveyjs/surveyjs-dashboard-nodejs-mongodb>. The same applies to the
table view, which additionally supports on-demand batch loading with server-side sorting
and filtering.
