# Renamed Creator API

Survey Creator renamed most of its event and option surface onto a `<subject><Verb>`
convention. **Every old name below still works** — the library keeps it as an alias, so stale
code neither throws nor warns at runtime. That is what makes this table necessary: nothing else
will tell you.

If you are reading existing code, a name from the left column dates it to before v2. If you are
writing new code, never emit one.

This table is extracted from the `@deprecated` annotations in `survey-creator-core`
(`creator-base.ts`, `creator-options.ts`), so it reflects what the library itself declares.
To regenerate it against a newer version, read those files and pair each
`@deprecated Use the [X]` comment with the declaration below it.

## Events

| Deprecated | Current |
| :-- | :-- |
| `onConditionQuestionsGetList` | `onConditionGetQuestionList` |
| `onDefineElementMenuItems` | `onElementGetActions` |
| `onDesignerSurveyCreated` | `onSurveyInstanceCreated` |
| `onGetObjectDisplayName` | `onElementGetDisplayName` |
| `onGetPageActions` | `onPageGetFooterActions` |
| `onGetPropertyReadOnly` | `onPropertyGetReadOnly` |
| `onLogicItemDisplayText` | `onLogicRuleGetDisplayText` |
| `onPreviewSurveyCreated` | `onSurveyInstanceCreated` |
| `onPropertyGridShowModal` | `onPropertyGridShowPopup` |
| `onPropertyGridSurveyCreated` | `onSurveyInstanceCreated` |
| `onPropertyValidationCustomError` | `onPropertyDisplayCustomError` |
| `onPropertyValueChanging` | `onBeforePropertyChanged` |
| `onSelectedElementChanged` | `onElementSelected` |
| `onSelectedElementChanging` | `onElementSelecting` |
| `onSetPropertyEditorOptions` | `onConfigureTablePropertyEditor` |
| `onShowingProperty` | `onPropertyShowing` |
| `onSurveyPropertyValueChanged` | `onAfterPropertyChanged` |

## Options, properties and methods

| Deprecated | Current |
| :-- | :-- |
| `addPluginTab` | `addTab(tabOptions)` |
| `allowEditExpressionsInTextEditor` | `logicAllowTextEditExpressions` |
| `fastCopyQuestion` | `copyQuestion` |
| `inplaceEditForValues` | `inplaceEditChoiceValues` |
| `isAutoSave` | `autoSaveEnabled` |
| `makeNewViewActive` | `switchTab` |
| `maximumChoicesCount` | `maxChoices` |
| `maximumColumnsCount` | `maxColumns` |
| `maximumRateValues` | `maxRateValues` |
| `maximumRowsCount` | `maxRows` |
| `maxLogicItemsInCondition` | `logicMaxItemsInCondition` |
| `maxNestedPanels` | `maxPanelNestingLevel` |
| `minimumChoicesCount` | `minChoices` |
| `showDefaultLanguageInPreviewTab` | `previewAllowSelectLanguage` |
| `showInvisibleElementsInPreviewTab` | `previewAllowHiddenElements` |
| `showObjectTitles` | `useElementTitles` |
| `showPagesInPreviewTab` | `previewAllowSelectPage` |
| `showPropertyGrid` | `showSidebar` |
| `showSimulatorInPreviewTab` | `previewAllowSimulateDevices` |
| `showSurveyTitle` | `showSurveyHeader` |
| `showTitlesInExpressions` | `useElementTitles` |

## Removed, not renamed

| Gone | Use instead |
| :-- | :-- |
| `creator.render(element)` | The framework component (`<SurveyCreatorComponent>`, `<survey-creator>`), or `renderSurveyCreator(creator, element)` from `survey-creator-js` |
| `survey-creator` npm package (Knockout build) | `survey-creator-core` plus a renderer package |
| `haveCommercialLicense` | `setLicenseKey(key)` — see <https://surveyjs.io/remove-alert-banner> |

`render()` is the sharpest dating signal in the list: it does not fail to compile, so an answer
built on it produces an empty page rather than an error.

## Three events became one

`onDesignerSurveyCreated`, `onPreviewSurveyCreated` and `onPropertyGridSurveyCreated` all
collapsed into `onSurveyInstanceCreated`. Branch on `options.area` to tell which surface fired:

```js
creator.onSurveyInstanceCreated.add((sender, options) => {
  if (options.area === "designer-tab")  { /* the survey on the design surface */ }
  if (options.area === "preview-tab")   { /* the survey in the Preview tab */ }
  if (options.area === "property-grid") { /* the property grid, which is itself a survey */ }
});
```

`area` names the Creator UI element the survey was instantiated for. Those three are the common
ones; the full set also covers the theme and translation tabs, the logic rule editors and
several pop-up editors. Read `SurveyInstanceCreatedEvent` in `survey-creator-core` for the
list that matches your version rather than guessing a value.

Code that still registers the three separate handlers is pre-v2 even when every name in it
resolves.
