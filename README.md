# SurveyJS Agent Skills

Skills that give AI coding agents instructions for building forms with [SurveyJS](https://surveyjs.io). When you ask an agent to work on a form, it can use the relevant skill to choose the right APIs and avoid common mistakes.

## Installation

To share the skills with your team, follow Project Setup. To install them for your own agent, follow the section for that agent below.

### Project Setup

Open a terminal in your project root and run the command below. The CLI finds your SurveyJS packages and asks which AI clients you want to use, then installs the matching skills with package version information.

```sh
# Install skills for your project's packages and AI clients
npx surveyjs-cli@latest init-agents
```

Commit the generated files so that your team's agents can use the same instructions. When your packages change, follow the [CLI documentation](cli/README.md#updating-existing-configuration) to update the skills.

### OpenAI Codex

```sh
# Add the marketplace that contains the SurveyJS plugin
codex plugin marketplace add surveyjs/surveyjs-skills

# Install the plugin from that marketplace
codex plugin add surveyjs@surveyjs-skills
```

### Claude Code

Run these commands in Claude Code, then restart it to load the skills:

```sh
# Add the marketplace that contains the SurveyJS plugin
/plugin marketplace add surveyjs/surveyjs-skills

# Install the plugin from that marketplace
/plugin install surveyjs@surveyjs-skills
```

### Google Gemini CLI

Clone this repository, then run from its root:

```sh
# Install the SurveyJS plugin as a Gemini extension
gemini extensions install ./plugins/surveyjs
```

### GitHub Copilot CLI

```sh
# Install the SurveyJS plugin from its directory in this repository
copilot plugin install surveyjs/surveyjs-skills:plugins/surveyjs
```

### xAI Grok Build

```sh
# Add the marketplace that contains the SurveyJS plugin
grok plugin marketplace add surveyjs/surveyjs-skills

# Install the SurveyJS plugin
grok plugin install surveyjs
```

### Other Agents

If your agent supports `SKILL.md` files, copy or link the folders in [`plugins/surveyjs/skills/`](plugins/surveyjs/skills/) into the skills directory it reads. For example, use `.cursor/skills/` for Cursor or `.cline/skills/` for Cline.

## Using the Skills

After installation, ask your agent to work on a SurveyJS task. It selects a skill based on your request. To choose one yourself, include its name, for example: `Use surveyjs-form-json to add a conditional page to this survey.`

Use this table to find the skill for your task:

| Skill | Purpose |
| :---- | :---- |
| [`surveyjs-form-json`](plugins/surveyjs/skills/surveyjs-form-json/) | Write survey JSON and fix validation, conditions, and expressions. |
| [`surveyjs-linter`](plugins/surveyjs/skills/surveyjs-linter/) | Find logic errors in survey JSON and add automated checks. |
| [`surveyjs-integration`](plugins/surveyjs/skills/surveyjs-integration/) | Add a form to your app, handle events, and save responses. |
| [`surveyjs-brand-styling`](plugins/surveyjs/skills/surveyjs-brand-styling/) | Style a survey to match your app or brand. |
| [`surveyjs-creator-customization`](plugins/surveyjs/skills/surveyjs-creator-customization/) | Add Survey Creator to your app and customize its interface. |
| [`surveyjs-dashboard`](plugins/surveyjs/skills/surveyjs-dashboard/) | Visualize responses with charts, tables, filters, and exports. |
| [`surveyjs-pdf-generator`](plugins/surveyjs/skills/surveyjs-pdf-generator/) | Export fillable or read-only PDFs and fill existing PDF forms. |
| [`surveyjs-response-extractor`](plugins/surveyjs/skills/surveyjs-response-extractor/) | Read answers from scanned forms, photos, and PDFs. |

## Contributing

To fix or improve a skill, follow the steps in [CONTRIBUTING.md](CONTRIBUTING.md).

We check the docs used by the skills each week and open an issue if they change. To check them yourself, run:

```sh
# Check for changes in the docs
node scripts/check-upstream-docs.mjs
```

If the docs have changed, read the changes and fix any outdated skill instructions. Then run this command so that the next check reports only new changes:

```sh
# Mark the doc changes as reviewed
node scripts/check-upstream-docs.mjs --update
```

To report a security issue, follow [SECURITY.md](SECURITY.md).

## License

The skills are available under the [MIT license](LICENSE). To use SurveyJS in your app, check the [license terms for your SurveyJS products](https://surveyjs.io/licensing).
