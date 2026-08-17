# Loading schemas, saving results, and events

SurveyJS has no server. Every path below terminates at *the host application's* API.
Never generate a POST to a surveyjs.io endpoint, and never use the legacy `surveyPostId`
property — it targets a discontinued service.

## Loading a schema

The `Model` constructor takes the JSON object directly. Fetch it from your own API:

```js
const json = await (await fetch(`/api/forms/${formId}`)).json();
const survey = new Model(json);
```

Schemas are plain JSON, so store them in any column or document store. See
`surveyjs-form-json` for authoring and validating the schema itself.

## Saving results on completion

`onComplete` fires when the respondent submits. `sender.data` is a plain object keyed by
question `name`, ready to serialize.

The event options carry the completion-screen state machine — use it, so a failed save is
visible to the respondent instead of silently lost:

```js
survey.onComplete.add(async (sender, options) => {
  options.showSaveInProgress();          // "Saving..." on the thank-you page
  try {
    const res = await fetch("/api/survey-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, data: sender.data })
    });
    if (!res.ok) throw new Error(res.statusText);
    options.showSaveSuccess();           // or showSaveSuccess("Thanks!")
  } catch {
    options.showSaveError("We could not save your answers. Please try again.");
  }
});
```

| Option | Effect |
| :-- | :-- |
| `showSaveInProgress(text?)` | Completion page enters the saving state |
| `showSaveSuccess(text?)` | Marks saved, runs navigation |
| `showSaveError(text?)` | Shows an error with a retry affordance |
| `clearSaveMessages(text?)` | Resets the state |

`showDataSaving`, `showDataSavingError`, and `showDataSavingSuccess` are obsolete aliases
kept for compatibility. Use the `showSave*` names.

## Partial save and resume

Two mechanisms, depending on how often you want to write.

**Per page** — set `sendResultOnPageNext` and handle `onPartialSend`:

```js
survey.sendResultOnPageNext = true;
survey.onPartialSend.add((sender) => {
  fetch("/api/survey-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formId, data: sender.data, page: sender.currentPageNo })
  });
});
```

**Per answer** — handle `onValueChanged` (debounce it; it fires on every change):

```js
survey.onValueChanged.add(debounce((sender) => saveProgress(sender.data), 1000));
```

Restore by assigning `data` and `currentPageNo` **before** rendering:

```js
const saved = await loadProgress(formId);
if (saved) {
  survey.data = saved.data;
  survey.currentPageNo = saved.page;
}
```

Assigning `data` replaces the whole response object. Use `survey.mergeData(partial)` to
apply a subset without clearing the rest — useful for prefilling from a user profile:

```js
survey.mergeData({ email: user.email, fullName: user.name });
```

Demo: <https://surveyjs.io/form-library/examples/survey-editprevious/>

## File uploads

Files are not embedded in `survey.data` by default — upload them to your own storage and
store the returned URLs.

```js
survey.onUploadFiles.add((sender, options) => {
  const form = new FormData();
  options.files.forEach((file) => form.append("files", file));

  fetch("/api/uploads", { method: "POST", body: form })
    .then((r) => r.json())
    .then((uploaded) => {
      options.callback(
        options.files.map((file, i) => ({ file, content: uploaded[i].url }))
      );
    })
    .catch(() => options.callback([], ["Upload failed"]));
});
```

`options.sourceType` distinguishes `"file"`, `"camera"`, and `"signature"` if the backend
should treat them differently. Pair with `onDownloadFile` when the server stores names
rather than URLs, and `onClearFiles` to delete on removal.

## Server-side validation

To validate against the backend before the survey advances:

```js
survey.onServerValidateQuestions.add(async (sender, options) => {
  const errors = await (await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options.data)
  })).json();

  Object.assign(options.errors, errors);   // { questionName: "message" }
  options.complete();                       // must always be called
});
```

Forgetting `options.complete()` leaves the survey stuck on the page.

## Events worth knowing

| Event | Fires when |
| :-- | :-- |
| `onComplete` | Survey submitted |
| `onPartialSend` | Page changed with `sendResultOnPageNext` on |
| `onValueChanged` | Any answer changes |
| `onCurrentPageChanged` | Navigation between pages |
| `onServerValidateQuestions` | Leaving a page, for async validation |
| `onUploadFiles` / `onDownloadFile` / `onClearFiles` | File question activity |

Full list: <https://surveyjs.io/form-library/documentation/api-reference/survey-data-model>

## Reading state

`survey.state` returns `"loading"`, `"empty"`, `"starting"`, `"running"`, `"preview"`, or
`"completed"` — useful for driving surrounding UI such as a progress indicator or a
"leave page?" guard.

## More

Backend integration guide and per-stack examples:

- <https://surveyjs.io/documentation/backend-integration.md>
- <https://surveyjs.io/backend-integration/examples>
