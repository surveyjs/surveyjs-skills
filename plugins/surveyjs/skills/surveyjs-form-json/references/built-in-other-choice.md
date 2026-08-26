# Built-in "Other" choice

Use SurveyJS's special Other item when respondents must be able to enter an answer that is not
in a choice list. Do not add `"Other"` as a regular entry in `choices`: that only stores the
literal value and does not display the accompanying input.

```json
{
  "type": "radiogroup",
  "name": "language",
  "title": "Which language do you use?",
  "choices": ["JavaScript", "TypeScript"],
  "showOtherItem": true,
  "otherText": "Other",
  "otherPlaceholder": "Enter a language"
}
```

- Set `showOtherItem` to `true` to render the special item and its input.
- Use `otherText` only when the default caption is unsuitable.
- Use `otherPlaceholder` to label the input. Omit either text property when its default is
  acceptable.

## Result data

By default, SurveyJS records the special value and typed answer separately. With the example
above, entering `Rust` produces:

```json
{
  "language": "other",
  "language-Comment": "Rust"
}
```

The suffix is configured by the survey's `commentSuffix` setting. Keep this default result
shape when the application needs to distinguish a listed choice from a custom answer.

Set the survey-level `storeOthersAsComment` property to `false` only when the application needs
the typed answer at the question's key instead:

```json
{
  "storeOthersAsComment": false,
  "elements": [
    {
      "type": "radiogroup",
      "name": "language",
      "choices": ["JavaScript", "TypeScript"],
      "showOtherItem": true
    }
  ]
}
```

That configuration produces `{ "language": "Rust" }` for an Other response. It no longer
preserves whether the value came from the built-in list or a respondent-entered answer.

`showOtherItem` is a special-choice property on choice-based questions. Confirm that the target
question type supports it in the version-matched authoring guide and schema before emitting it.
