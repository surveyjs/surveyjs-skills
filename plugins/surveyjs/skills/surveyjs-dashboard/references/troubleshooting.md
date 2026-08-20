# Troubleshooting

Work down this list — the first three cover most reports.

## Nothing renders

- **`render()` ran before the container existed.** Render in a mount hook
  (`useEffect` / `ngAfterViewInit` / `onMounted`) or after `DOMContentLoaded`, and make
  sure the id passed to `render()` matches the element.
- **The dashboard was constructed before the data arrived.** Constructing with
  `data: undefined` (or before the fetch resolves) shows nothing useful, and the instance
  does not pick up data assigned later. Await the fetch, then construct and render.
- **Neither `questions` nor `items` was provided.** `data` alone produces nothing —
  Dashboard needs at least one of them to know what to visualize.
- **Version mismatch.** `survey-core` is a peer dependency pinned to the matching
  `survey-analytics` version. `npm ls survey-core survey-analytics` — if the versions
  differ (commonly: the app's form uses survey-core v2 while survey-analytics is v3),
  align them before debugging anything else.

## Duplicate or stacking dashboards

Construction and `render()` are running more than once against the same container:

- React: effect without a `clear()` cleanup — StrictMode alone triggers this in
  development. Return `() => dashboard.clear()` from the effect.
- Any framework: constructing in a render/change-detection path instead of a mount hook.
- Swapping between several `Dashboard` instances in one container (tabs): call `clear()`
  on (or empty the container of) the outgoing one before rendering the next.

## Charts missing in a CDN page

The UMD build does not bundle Chart.js. The page needs three scripts in order:
`survey.core.min.js` → `chart.umd.min.js` → `survey.analytics.min.js`. A missing or
late-loaded Chart.js fails at render time, not at load time.

## Unstyled output

The Dashboard stylesheet is missing: `survey-analytics/survey.analytics.css` import (or
`survey.analytics.min.css` link / `angular.json` entry). The table view has its own pair —
`tabulator-tables/dist/css/tabulator.css` and
`survey-analytics/survey.analytics.tabulator.css` — the main stylesheet does not cover it.

## Code compiles but looks pre-v3

`VisualizationPanel`, `IVisualizationPanelOptions`, and Plotly setup still resolve because
the new API extends the old classes — obsolete code fails silently, not loudly. Migrate to
`new Dashboard({ ... })` per the corrections table in `SKILL.md`. If the project
intentionally stays on v2, install with the `v2-lts` npm dist-tag and match `survey-core`
accordingly — do not mix v3 docs guidance into a v2 codebase.

## An alert banner appears

Dashboard is unlicensed. That is the expected behavior, not a bug: activation instructions
live at <https://surveyjs.io/remove-alert-banner> (requires logging in to a licensed
account). Do not hide the banner with CSS or DOM manipulation, and do not invent a key.

## NPS question shows a histogram

The NPS visualizer is disabled by default. Set `type: "nps"` on that item, or add `"nps"`
to its `availableTypes`. See `references/setup-and-data.md`.

## Wrong or missing chart for a question

Each visualizer supports specific question types (see the table in
`references/setup-and-data.md`). A `type` that doesn't fit the question's data is ignored
or renders poorly — check <https://surveyjs.io/dashboard/documentation/chart-types.md>
before forcing one.

## Still stuck

Fetch the current doc as Markdown (`https://surveyjs.io/dashboard/documentation/<page>.md`),
check the matching demo source
(`https://surveyjs.io/dashboard/examples/<name>/<framework>.md`), then
<https://github.com/surveyjs/surveyjs-howtos-and-troubleshooting> and the
[survey-analytics issues](https://github.com/surveyjs/survey-analytics/issues).
