# The UI Preset Editor — no-code preset authoring, saving, and loading

The UI Preset Editor is a plugin that adds a hidden `presets` tab to a Survey Creator and a
button in the Creator Settings panel to open it. Inside, a user configures Languages, Tabs,
Toolbox, Property Grid, and Options visually, previews the result on the live Creator, and
saves the outcome as a named preset JSON. It is a **PRO / Enterprise** feature: a Basic-tier or
missing license shows an alert banner. State this whenever recommending the editor.

The editor is only needed to *create or edit* presets visually. Applying presets never
requires it.

Official sources: the guide sections
[Enable the UI Preset Editor](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#enable-the-ui-preset-editor),
[Activate a SurveyJS License](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#activate-a-surveyjs-license),
and [Save and Load Custom Presets](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#save-and-load-custom-presets);
the [`UIPresetEditor`](https://surveyjs.io/survey-creator/documentation/api-reference/uipreseteditor)
API reference; and the [UI Preset Editor demo](https://surveyjs.io/survey-creator/examples/ui-preset-editor/),
which has the full runnable code per framework.

## Enabling

```js
import { UIPresetEditor } from "survey-creator-core/ui-preset-editor";
import { registerUIPreset } from "survey-creator-core";
import SurveyCreatorUIPreset from "survey-creator-core/ui-presets";

registerUIPreset(SurveyCreatorUIPreset);   // optional: offer Basic/Advanced/Expert as starting points

const creator = new SurveyCreatorModel(options);
const presetEditor = new UIPresetEditor(creator);
```

Classic script: `<script src="https://unpkg.com/survey-creator-core/ui-preset-editor.min.js">`,
then `new SurveyCreatorCore.UIPresetEditor(creator)`. Translations for the editor's own
strings are a separate bundle from the Creator's: `import "survey-creator-core/ui-preset-editor/i18n"`
loads all of them, alongside `survey-creator-core/survey-creator-core.i18n` for the Creator.

Construct the editor right after the Creator, before rendering. It attaches through the
Creator's plugin system, so no extra component is rendered by the framework packages.

## Public API (`UIPresetEditor`)

| Member | Purpose |
| :-- | :-- |
| `savePresetFunc(saveNo, callback)` | Called when the user saves. Persist `presetEditor.preset`, then `callback(saveNo, true|false)`. Same contract as the Creator's `saveSurveyFunc` |
| `preset` | The `IPreset` (`{ name, visible, json }`) currently being edited — what to persist |
| `addPreset(preset)` | Register a stored preset with the editor (and the Creator's preset registry) at startup |
| `removePreset(nameOrPreset)` | Drop one |
| `getPreset(name)` | Look one up |
| `availablePresets` | `IPresetListItem[]` — `{ name, visible }` for every preset the editor knows |
| `onPresetListSaved` | Fires after the **Manage Presets** dialog saves; `options.presets` is the new list (order and visibility). Persist it if you want the list to survive a reload |
| `saveToFileHandler` | Used by the editor's download-JSON action; override to change how files are saved |

`saveNo` is an incrementing change counter. Compare it to the last completed save before
writing, so an earlier slow request cannot overwrite a later one.

## Save and load — localStorage

Mirrors the official
[Example: Save to `localStorage`](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#example-save-to-localstorage).

```js
const KEY = "survey-creator-presets";
const presetEditor = new UIPresetEditor(creator);

(JSON.parse(localStorage.getItem(KEY)) || []).forEach(p => presetEditor.addPreset(p));

presetEditor.savePresetFunc = (saveNo, callback) => {
  const current = presetEditor.preset;
  const presets = JSON.parse(localStorage.getItem(KEY)) || [];
  const index = presets.findIndex(p => p.name === current.name);
  if (index > -1) presets[index] = current; else presets.push(current);
  localStorage.setItem(KEY, JSON.stringify(presets));
  callback(saveNo, true);
};
```

## Save and load — your own API

Mirrors the official
[Example: Save to a Web Service](https://surveyjs.io/survey-creator/documentation/ui-preset-editor#example-save-to-a-web-service),
with the preset-list persistence added.

```js
const presetEditor = new UIPresetEditor(creator);

fetch("/api/creator-presets")
  .then(r => (r.ok ? r.json() : []))
  .then(presets => presets.forEach(p => presetEditor.addPreset(p)))
  .catch(() => { /* leave the editor with registered presets only */ });

presetEditor.savePresetFunc = (saveNo, callback) => {
  fetch("/api/creator-presets", {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify(presetEditor.preset)
  })
    .then(r => callback(saveNo, r.ok))
    .catch(() => callback(saveNo, false));
};

presetEditor.onPresetListSaved.add((_, { presets }) => {
  fetch("/api/creator-presets/order", { method: "PUT", body: JSON.stringify(presets),
    headers: { "Content-Type": "application/json" } });
});
```

Store presets keyed by `name`; that is also the identity the Creator Settings dropdown and
`creator.activePresetName` use. There is no SurveyJS-hosted storage — persistence is always
your backend or the browser.

## What the editor does to the live Creator

- Opening the editor switches `creator.activeTab` to `presets` and blocks tab changes until
  the user leaves; leaving restores the previous tab.
- Every change is previewed by applying the working preset to the Creator, so the normal
  reset semantics apply while the editor is open. Unsaved edits are reverted on exit.
- Import and export JSON buttons read and write a full `IPreset` file, which is a convenient
  way to move a preset from the editor into source control.

## Applying a stored preset without the editor

Production builders usually do not embed the editor. Load the JSON that the editor produced and
apply it:

```js
const preset = await (await fetch(`/api/creator-presets/${tenant}`)).json();   // { name, json }
new UIPreset(preset).applyTo(creator);
```

Apply before the first render when possible. Applying after render works too and repaints the
tabs, toolbox, and property grid in place.
