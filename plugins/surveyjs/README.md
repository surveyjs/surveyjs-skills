# SurveyJS plugin

Portable agent skills for building and customizing [SurveyJS](https://surveyjs.io) forms. This
package includes manifests for OpenAI Codex, Claude Code, GitHub Copilot, Google Gemini CLI, and
xAI Grok Build.

## Skills

| Skill | Use it for |
| :---- | :---- |
| `surveyjs-form-json` | Writing and debugging the survey JSON itself — question types, validators, `visibleIf` and expressions, triggers, matrices, localization, quiz scoring |
| `surveyjs-integration` | Getting the Form Library into a React, Next.js, Angular, Vue, vanilla JS, or jQuery app — install, render, theme, handle events, save results |
| `surveyjs-creator-customization` | Embedding the drag-and-drop builder — toolbox and property grid, creator events, UI presets, builder theming |
| `surveyjs-dashboard` | Visualizing collected responses with Dashboard — install `survey-analytics`, configure charts and tables, filtering, theming, localization, custom visualizers, table view export |
| `surveyjs-pdf-generator` | Exporting forms and responses to PDF with `survey-pdf` — fillable or read-only PDFs, page options, fonts, headers/footers, themes and layout presets, and filling existing PDF form fields with PDFFormFiller |

## Product coverage

| Product or area | Status | Skill |
| :---- | :---- | :---- |
| SurveyJS JSON schemas | Supported | `surveyjs-form-json` |
| Form Library | Supported | `surveyjs-integration` |
| Survey Creator | Supported | `surveyjs-creator-customization` |
| Dashboard | Supported | `surveyjs-dashboard` |
| PDF Generator | Supported | `surveyjs-pdf-generator` |
| AI Form Response Extractor | Not currently included | — |

AI Form Response Extractor is a separate product area and is not handled by the Form Library
integration skill.

Form Library and AI Form Response Extractor are MIT-licensed. Survey Creator, Dashboard, and PDF
Generator require commercial developer licenses when integrated into a commercial application.
See [SurveyJS licensing](https://surveyjs.io/licensing).

## Staying current

`surveyjs-integration`, `surveyjs-dashboard`, and `surveyjs-pdf-generator` are written against
SurveyJS v3 and hash the upstream doc pages they depend on. A weekly Action runs `scripts/check-upstream-docs.mjs` and
opens an issue when one of those pages changes, so the reference files get reviewed rather than
silently drifting.

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

Gemini discovers all five skills automatically from `skills/`.

## GitHub Copilot CLI

Install this plugin directly from its repository subdirectory:

```
copilot plugin install surveyjs/surveyjs-skills:plugins/surveyjs
```

The shared `plugin.json` manifest registers all five skills. Copilot can also consume the
repository's `.claude-plugin/marketplace.json` marketplace.

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

## Other compatible agents

The directories under `skills/` use the portable `SKILL.md` convention. Copy or link those
directories into `.agents/skills/` for agents that support the shared location. Provider-specific
locations such as `.cursor/skills/` and `.cline/skills/` work with the same files and require no
content changes.

## License

MIT — see [LICENSE](../../LICENSE).
