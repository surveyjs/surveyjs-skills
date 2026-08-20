# SurveyJS Agent Skills

Agent skills that teach AI coding agents to build with [SurveyJS](https://surveyjs.io) — writing
survey JSON, embedding the Form Library in a web app, customizing Survey Creator, and visualizing
collected responses with Dashboard.

This repository packages one `surveyjs` plugin for OpenAI Codex, Claude Code, GitHub Copilot,
Google Gemini CLI, and xAI Grok Build. The plugin contains four portable skills. Each skill loads
only when the work calls for it and carries reference files the agent reads on demand.

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

## Install with GitHub Copilot CLI

Install the plugin directly from its repository subdirectory:

```
copilot plugin install surveyjs/surveyjs-skills:plugins/surveyjs
```

The shared `plugin.json` manifest registers all four skills. The existing Claude-compatible
marketplace can also be added with `copilot plugin marketplace add surveyjs/surveyjs-skills`.

## Install with xAI Grok Build

Add this repository as a Grok marketplace and install the plugin:

```
grok plugin marketplace add surveyjs/surveyjs-skills
grok plugin install surveyjs
```

For local development, load the plugin directory directly with
`grok --plugin-dir ./plugins/surveyjs`.

## Other compatible agents

The skills follow the portable `SKILL.md` convention. Agents that support shared skill discovery,
including Cursor, can load the four directories under `plugins/surveyjs/skills/` from a project or
user-level `.agents/skills/` directory. If an agent does not read that shared location, copy or
link the same skill directories into its native location, such as `.cursor/skills/` for Cursor or
`.cline/skills/` for Cline. No changes to the skill files are required.

## Skills

| Skill | Use it for |
| :---- | :---- |
| `surveyjs-form-json` | Writing and debugging the survey JSON itself — question types, validators, `visibleIf` and expressions, triggers, matrices, localization, quiz scoring |
| `surveyjs-integration` | Getting the Form Library into a React, Next.js, Angular, Vue, vanilla JS, or jQuery app — install, render, theme, handle events, save results |
| `surveyjs-creator-customization` | Embedding the drag-and-drop builder — toolbox and property grid, creator events, UI presets, builder theming |
| `surveyjs-dashboard` | Visualizing collected responses with Dashboard — install `survey-analytics`, configure charts and tables, filtering, theming, localization, custom visualizers, table view export |

The skills are written against **SurveyJS v3**.

## Product coverage

| Product or area | Status | Skill |
| :---- | :---- | :---- |
| SurveyJS JSON schemas | Supported | `surveyjs-form-json` |
| Form Library | Supported | `surveyjs-integration` |
| Survey Creator | Supported | `surveyjs-creator-customization` |
| Dashboard | Supported | `surveyjs-dashboard` |
| PDF Generator | Not currently included | — |
| AI Form Response Extractor | Not currently included | — |

The unsupported products are intentional scope boundaries, not features of
`surveyjs-integration`. They should receive dedicated skills before this plugin claims to cover
their installation or APIs.

Note on licensing: Form Library and AI Form Response Extractor are MIT-licensed. **Survey Creator,
Dashboard, and PDF Generator require commercial developer licenses** when integrated into a
commercial application. The relevant skills state licensing requirements where they matter — see
[surveyjs.io/licensing](https://surveyjs.io/licensing).

## Staying current

`surveyjs-integration` and `surveyjs-dashboard` hash the upstream surveyjs.io doc pages their
reference files are based on. A weekly GitHub Action runs the checker and opens an issue when one
of those pages changes, so the references get reviewed by hand rather than silently going stale.

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
  plugin.json                       GitHub Copilot and xAI Grok plugin manifest
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
