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

The Other input is required automatically: selecting Other and leaving the input empty raises
a built-in validation error. Use `otherErrorText` on the question only to replace the default
error message — no validator is needed to make the typed answer required.

## Result data

By default, SurveyJS records the special value and typed answer separately. With the example
above, entering `Rust` produces:

```json
{
  "language": "other",
  "language-Comment": "Rust"
}
```

The `-Comment` suffix is fixed from the JSON's point of view: it comes from the code-level
`settings.commentSuffix` and cannot be changed in survey JSON, so never emit a `commentSuffix`
property. Keep this default result shape when the application needs to distinguish a listed
choice from a custom answer.

In multi-select questions (`checkbox`, `tagbox`) the question value is an array that contains
the special value:

```json
{
  "language": ["JavaScript", "other"],
  "language-Comment": "Rust"
}
```

The typed answer is available to expressions as `{language-Comment}` — use that key in
`visibleIf`, `enableIf`, `setValueExpression`, and similar properties when logic depends on
the custom answer.

Set the `storeOthersAsComment` property to `false` only when the application needs
the typed answer at the question's key instead. It exists at two levels: on the survey (applies
to every question) and on an individual question (`true`, `false`, or `"default"`, which
inherits the survey setting):

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
preserves whether the value came from the built-in list or a respondent-entered answer. Note
also that if the typed text equals an existing choice's value, SurveyJS converts the answer
into that regular choice and clears the Other state.

Two more caveats:

- A question with `showCommentArea: true` always behaves as if `storeOthersAsComment` were
  `false`, regardless of the setting: the `-Comment` key is occupied by the comment, so the
  typed Other answer goes to the question's key.
- To limit the length of the typed answer, use the survey-level `maxCommentLength` property.

`showOtherItem` is a special-choice property on choice-based questions. Confirm that the target
question type supports it in the version-matched authoring guide and schema before emitting it.
