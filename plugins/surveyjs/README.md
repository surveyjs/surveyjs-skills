# surveyjs plugin

Agent skills for building and customizing [SurveyJS](https://surveyjs.io) forms.

## Skills

| Skill | Scope | Status |
| :---- | :---- | :---- |
| `surveyjs:surveyjs-form-json` | Authoring and validating survey/form JSON definitions | Placeholder |
| `surveyjs:surveyjs-integration` | Form Library integration in React, Angular, Vue, and vanilla JS | Authored |
| `surveyjs:surveyjs-creator-customization` | Survey Creator customization | Placeholder |

## Staying current

`surveyjs-integration` is written against SurveyJS v3 and hashes the upstream doc pages it
depends on. A weekly Action runs `scripts/check-upstream-docs.mjs` and opens an issue when
one of those pages changes, so the reference files get reviewed rather than silently drifting.

```
node scripts/check-upstream-docs.mjs            # report drift
node scripts/check-upstream-docs.mjs --update   # accept the new baseline
```

## Install

```
/plugin marketplace add surveyjs/surveyjs-skills
/plugin install surveyjs@surveyjs-skills
```

## License

MIT — see [LICENSE](../../LICENSE).
