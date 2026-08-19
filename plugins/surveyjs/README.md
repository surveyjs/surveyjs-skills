# SurveyJS plugin

Portable agent skills for building and customizing [SurveyJS](https://surveyjs.io) forms. This
package includes manifests for OpenAI Codex, Claude Code, Google Gemini CLI, and xAI Grok Build.

## Skills

| Skill | Use it for |
| :---- | :---- |
| `surveyjs-form-json` | Writing and debugging the survey JSON itself — question types, validators, `visibleIf` and expressions, triggers, matrices, localization, quiz scoring |
| `surveyjs-integration` | Getting the Form Library into a React, Next.js, Angular, Vue, vanilla JS, or jQuery app — install, render, theme, handle events, save results |
| `surveyjs-creator-customization` | Embedding the drag-and-drop builder — toolbox and property grid, creator events, UI presets, builder theming |

## Staying current

`surveyjs-integration` is written against SurveyJS v3 and hashes the upstream doc pages it
depends on. A weekly Action runs `scripts/check-upstream-docs.mjs` and opens an issue when
one of those pages changes, so the reference files get reviewed rather than silently drifting.

```
node scripts/check-upstream-docs.mjs            # report drift
node scripts/check-upstream-docs.mjs --update   # accept the new baseline
```

## OpenAI Codex

This directory is the OpenAI plugin package. Its `.codex-plugin/plugin.json` manifest registers
the skills in `skills/`. Install it through a Codex plugin marketplace or upload it as a
skills-only plugin through the OpenAI plugin submission flow.

Codex activates matching skills automatically. To request one explicitly, refer to it by name,
for example: `Use $surveyjs-integration to add this form to my React app.`

## Claude Code

```
/plugin marketplace add surveyjs/surveyjs-skills
/plugin install surveyjs@surveyjs-skills
```

## Google Gemini CLI

From the repository root, install or link this directory as a Gemini extension:

```
gemini extensions install ./plugins/surveyjs
# Development checkout:
gemini extensions link ./plugins/surveyjs
```

Gemini discovers all three skills automatically from `skills/`.

## xAI Grok Build

Install through the repository's Grok marketplace:

```
grok plugin marketplace add surveyjs/surveyjs-skills
grok plugin install surveyjs
```

Or load this directory directly during local development:

```
grok --plugin-dir ./plugins/surveyjs
```

## License

MIT — see [LICENSE](../../LICENSE).
