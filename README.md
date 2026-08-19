# SurveyJS Agent Skills

Agent skills that teach AI coding agents to build with [SurveyJS](https://surveyjs.io) — writing
survey JSON, embedding the Form Library in a web app, and customizing Survey Creator.

This repository packages one `surveyjs` plugin for OpenAI Codex, Claude Code, Google Gemini CLI,
and xAI Grok Build. The plugin contains three portable skills. Each skill loads only when the work
calls for it and carries reference files the agent reads on demand.

## Why

Models have a lot of SurveyJS in their training data, and much of it is out of date — old package
names, APIs that were renamed in v3, styling hooks that are now internal. These skills pin the
current facts and list the specific mistakes to check generated code against, so answers stop
drifting toward whatever was true a few major versions ago.

## Install with OpenAI Codex

The OpenAI plugin package is [`plugins/surveyjs`](plugins/surveyjs). It includes a native
`.codex-plugin/plugin.json` manifest and can be installed from a Codex plugin marketplace or
uploaded as a skills-only plugin through the OpenAI plugin submission flow.

After installation, Codex selects a skill automatically when a request matches its description.
You can also request one explicitly, for example: `Use $surveyjs-form-json to add a conditional
page to this survey.`

## Install with Claude Code

```
/plugin marketplace add surveyjs/surveyjs-skills
/plugin install surveyjs@surveyjs-skills
```

Restart Claude Code, and the skills activate on their own when a task matches. You can also
invoke one directly, for example: `Use surveyjs-form-json to add a conditional page to this
survey.`

## Install with Google Gemini CLI

Clone this repository, then install the plugin directory as a Gemini extension:

```
gemini extensions install ./plugins/surveyjs
```

For local extension development, use `gemini extensions link ./plugins/surveyjs`. Gemini discovers
the skills automatically from the extension's `skills/` directory.

## Install with xAI Grok Build

Add this repository as a Grok marketplace and install the plugin:

```
grok plugin marketplace add surveyjs/surveyjs-skills
grok plugin install surveyjs
```

For local development, load the plugin directory directly with
`grok --plugin-dir ./plugins/surveyjs`.

## Skills

| Skill | Use it for |
| :---- | :---- |
| `surveyjs-form-json` | Writing and debugging the survey JSON itself — question types, validators, `visibleIf` and expressions, triggers, matrices, localization, quiz scoring |
| `surveyjs-integration` | Getting the Form Library into a React, Next.js, Angular, Vue, vanilla JS, or jQuery app — install, render, theme, handle events, save results |
| `surveyjs-creator-customization` | Embedding the drag-and-drop builder — toolbox and property grid, creator events, UI presets, builder theming |

The skills are written against **SurveyJS v3**.

Note on licensing: the Form Library is MIT, but **Survey Creator, the PDF Generator, and the
Dashboard are commercial products**. The creator skill says so wherever it matters — see
[surveyjs.io/licensing](https://surveyjs.io/licensing).

## Staying current

`surveyjs-integration` hashes the upstream surveyjs.io doc pages its reference files are based on.
A weekly GitHub Action runs the checker and opens an issue when one of those pages changes, so
the references get reviewed by hand rather than silently going stale.

```
node scripts/check-upstream-docs.mjs            # report drift, exit 1 if any
node scripts/check-upstream-docs.mjs --update   # accept the new baseline
```

The checker never rewrites the reference files. They contain hand-written judgement — which
mistakes to warn about, what to check first — that a scraper would destroy.

## Layout

```
.claude-plugin/marketplace.json     marketplace manifest
.grok-plugin/marketplace.json       xAI Grok marketplace manifest
plugins/surveyjs/                   the plugin
  .codex-plugin/plugin.json         OpenAI Codex plugin manifest
  .claude-plugin/plugin.json        Claude Code plugin manifest
  gemini-extension.json             Google Gemini CLI extension manifest
  plugin.json                       xAI Grok plugin manifest
  skills/<skill>/SKILL.md           what the agent loads first
  skills/<skill>/references/        deeper material, read on demand
scripts/check-upstream-docs.mjs     upstream doc drift checker
```

## Contributing

Issues and pull requests are welcome — corrections to anything a skill states are especially
useful. When changing a reference file, keep it about what an agent needs to get the code right,
and re-run the drift checker if the change follows an upstream doc update.

## License

MIT — see [LICENSE](LICENSE). SurveyJS itself is licensed separately per product.
