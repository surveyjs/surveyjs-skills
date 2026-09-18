# Contributing

You can help by fixing mistakes, improving examples, updating skills, or working on the CLI. This guide explains how to report a problem and submit a change.

## Reporting Issues

Search the [existing issues](https://github.com/surveyjs/surveyjs-skills/issues) before opening a new one. If the problem has already been reported, add any useful details to that issue.

For a bug report, include:

- The skill or CLI command you used.
- Steps or a small example that shows the problem.
- What you expected and what happened instead.
- Your AI client and relevant package versions. For CLI bugs, also include your operating system and Node.js version.

For a feature request, explain what you want to do and how the change would help. Discuss large changes in an issue before starting work. Small fixes can go straight to a pull request.

Report security problems privately by following [SECURITY.md](SECURITY.md).

## Getting Started

Install Node.js 22 or later to run all repository checks. Then fork this repository, clone your fork, and open a terminal in its root directory.

Create a branch for your change:

```sh
# Create a branch and switch to it
git switch -c improve-surveyjs-skills
```

## Making Changes

Keep each pull request focused on one problem or improvement. Update the related docs when behavior changes, and add or update tests when changing CLI behavior.

### Skills

Edit skills in `plugins/surveyjs/skills/`. Keep `SKILL.md` focused on when to use the skill and how to complete the task. Put detailed examples and product information in `references/`, and link each Markdown reference file from `SKILL.md`.

Use official SurveyJS docs, package source code, or files shipped with the relevant package version to check your instructions. Review generated content before submitting it, and leave out credentials, private URLs, destructive commands, and unfinished placeholders.

When adding a skill:

- Use a lowercase folder name with hyphens, and use the same value for `name` in the YAML block at the top of `SKILL.md`.
- Write a `description` that tells an agent when to use the skill.
- Add `skill.meta.json` with the npm `packages` and UI `frameworks` it supports. The CLI uses these fields to select skills; `["*"]` means all.
- Update the skill lists in the READMEs and the expected skill list in `scripts/validate-repo.mjs`.

### Plugin Versions

If you change the plugin version, use the same version in all plugin manifests and marketplace entries that contain one. The repository check below catches version mismatches.

## Checking Your Changes

Run this check from the repository root before opening a pull request:

```sh
# Check plugin files, skill structure, and links
node scripts/validate-repo.mjs
```

### CLI Changes

If you changed the CLI or the skills it packages, also run:

```sh
# Move into the CLI directory
cd cli

# Run the CLI tests
node --test

# Check which files would be included in the npm package
npm pack --dry-run

# Return to the repository root
cd ..
```

### Changes to Source Docs

When updating a skill to match changes in the docs it uses, run:

```sh
# Check for changes in the docs
node scripts/check-upstream-docs.mjs
```

This check needs an internet connection. If it reports changes, read them and fix any outdated skill instructions. Then run the command below so that the next check reports only new changes:

```sh
# Mark the doc changes as reviewed
node scripts/check-upstream-docs.mjs --update
```

Include the updated files in `scripts/.doc-snapshots/` in your pull request. The command only records which docs were checked; it does not update the skills for you.

## Submitting a Pull Request

Push your branch to your fork and open a pull request against `main`. In the description, include:

- What changed and why.
- A link to the related issue, if there is one.
- Links to the docs or source code you used to check any skill changes.
- The checks you ran and their results, including any checks with an AI client. Mention checks you could not run.

Make sure the automated checks pass, and respond to review comments so that maintainers can finish reviewing your change.

## License

By contributing, you agree that your changes will be shared under the repository's [MIT license](LICENSE).
