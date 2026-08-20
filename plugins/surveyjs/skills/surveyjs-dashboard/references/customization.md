# Customization

All of the toggles below go into the `IDashboardOptions` object passed to the `Dashboard`
constructor unless noted otherwise.

## Interactivity and layout

| Option | Default | Effect |
| :-- | :-- | :-- |
| `allowSelection` | `true` | Cross-filtering: clicking a data point filters every other item |
| `allowHideQuestions` | `true` | **Hide** button on each item |
| `allowDynamicLayout` | `true` | Responsive multi-column layout; `false` stacks items vertically |
| `allowDragDrop` | `true` | Drag-and-drop reordering (only meaningful with dynamic layout) |
| `showToolbar` | `true` | The dashboard toolbar |
| `labelTruncateLength` | `27` | Max label length; `-1` disables truncation |
| `stripHtmlFromTitles` | `true` | Strips HTML from titles. Leave on — titles are user-defined and this guards against markup injection |

Per-item: `allowChangeType: false` locks a chart's type; `visible: false` hides it while
keeping it in the state.

## Date filtering

Give Dashboard the name of a date field in your response rows and it renders a date panel:

```js
const dashboard = new Dashboard({
  questions: survey.getAllQuestions(),
  data: surveyResults,
  dateFieldName: "timestamp",
  datePeriod: "last30days"        // initial preset
});
```

- `datePeriod` presets: `last7days`, `last14days`, `last28days`, `last30days`,
  `lastWeekMon`/`lastWeekSun`, `lastMonth`, `lastQuarter`, `lastYear`, `ytd`, `mtd`,
  `wtdMon`/`wtdSun`, `qtd`.
- `dateRange: [start, end]` sets a custom range and wins over `datePeriod`.
- `availableDatePeriods` restricts which presets users see; `showDatePanel: false` hides
  the panel's answer count.
- React to changes with the `onDateRangeChanged` event (`options.dateRange`,
  `options.datePeriod`).

## State persistence

Everything users change interactively — chart types, layout order, sorting, filtering,
locale — lives in one state object:

```js
dashboard.onStateChanged.add((_, state) => {
  localStorage.setItem("dashboardState", JSON.stringify(state));
});

const saved = localStorage.getItem("dashboardState");
if (saved) dashboard.state = JSON.parse(saved);
```

Persist it server-side per user to make dashboards resumable across devices.

## Localization

```js
dashboard.locale = "fr";                 // UI strings; 10+ locales ship with the package
```

To inherit the survey's locale (and let a multi-language schema drive a language dropdown
in the dashboard), pass the model itself:

```js
const dashboard = new Dashboard({
  questions: survey.getAllQuestions(),
  data: surveyResults,
  survey: survey
});
```

Chart texts (titles, choice labels) are translated in the survey JSON, not in Dashboard.
Custom or missing UI strings: extend `localization.locales` from `survey-analytics`
(dictionaries: <https://github.com/surveyjs/survey-analytics/tree/master/src/analytics-localization>).

## Custom visualizers

When no built-in chart fits, wrap a built-in visualizer with your own rendering function
and register it via `VisualizationManager`:

```js
import { VisualizerBase, VisualizationManager, localization } from "survey-analytics";

function AvgPriceVisualizer(question, data, options = {}) {
  function renderContent(contentContainer, visualizer) {
    // Read visualizer.surveyData / await visualizer.getCalculatedValues(),
    // then insert your own HTML into contentContainer.
  }
  return new VisualizerBase(
    question,
    data,
    { renderContent, dataProvider: options.dataProvider },
    "avg-price"                                    // your visualizer name
  );
}

// Replace a default for the question type if desired:
// VisualizationManager.unregisterVisualizer("multipletext", WordCloud);

// Register under the question type AND under the visualizer name (both are required in v3):
VisualizationManager.registerVisualizer("multipletext", AvgPriceVisualizer, 0, "avg-price");
VisualizationManager.registerVisualizer("avg-price", AvgPriceVisualizer, 0, "avg-price");

// Display name in the type-switcher dropdown:
localization.locales["en"]["visualizer_avg-price"] = "Average price";
```

- Extend a concrete visualizer (`Matrix`, `WordCloud`, …) instead of `VisualizerBase` to
  reuse its aggregation while replacing only the rendering.
- Always pass `options.dataProvider` through — without it the custom visualizer detaches
  from Dashboard filtering.
- The `index` argument `0` makes yours the default for that question type.

Worked example (matrix-as-table and computed-average visualizers):
<https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting/blob/main/categories/data-visualization/custom-survey-data-visualizer.md>

## Table view and export

Raw, unaggregated responses in a sortable/filterable table with CSV, PDF, and XLSX export.
It is a separate component in the same package, with its own stylesheets:

```js
import "tabulator-tables/dist/css/tabulator.css";
import "survey-analytics/survey.analytics.tabulator.css";
import { Tabulator } from "survey-analytics/survey.analytics.tabulator";

const table = new Tabulator(survey, surveyResults);   // (model, data) — not an options object
table.render("tableContainer");
```

CSV export works out of the box. PDF and XLSX need third-party libraries wired in:

```bash
npm i jspdf jspdf-autotable xlsx
```

```js
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);
import * as XLSX from "xlsx";

const table = new Tabulator(survey, surveyResults, { jspdf: jsPDF, xlsx: XLSX });
```

Minimum versions per the official tutorial: jsPDF 2.4.0, jsPDF-AutoTable 3.5.20,
SheetJS (xlsx) 0.18.5 — and check their licenses fit the project. With server-side data
loading, exports contain only the records loaded so far; export full datasets on the
server. Per-framework tutorial:
`https://surveyjs.io/dashboard/documentation/set-up-table-view/<react|angular|vue|html-css-javascript>.md`.
