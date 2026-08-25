# Contributing

Corrections, new examples, and compatibility updates are welcome. Keep each skill focused on
facts an agent needs to produce correct SurveyJS code; put detailed or product-specific material
in `references/` and link it from the skill's `SKILL.md`.

## Skill requirements

- Place skills under `plugins/surveyjs/skills/<skill-name>/`.
- Use a lowercase, hyphenated directory name and make the frontmatter `name` match it exactly.
- Give every skill a specific `description` that explains when it should activate.
- Prefer official SurveyJS documentation, package source, and version-exact installed package
  artifacts as sources.
- Do not include credentials, private URLs, destructive commands, placeholders, or generated
  output that has not been reviewed.
- Link every Markdown file under a skill's `references/` directory from `SKILL.md`.
- Add a `skill.meta.json` beside `SKILL.md` declaring the npm `packages` and UI `frameworks`
  the skill applies to. `survey-cli` uses it to decide which skills a project needs; `["*"]`
  means "applies to all".

## Validation

Run the structural checks before opening a pull request:

```
node scripts/validate-repo.mjs
node scripts/check-upstream-docs.mjs
cd cli && node --test
```

If the upstream checker reports drift, review the changed source pages and update affected skill
content manually. Only then run `node scripts/check-upstream-docs.mjs --update` to accept the new
hashes. The update command is not a substitute for reviewing the source.

When changing a plugin version, keep the versioned provider manifests and marketplace entries in
sync. Pull requests should explain the user-visible change, list the official sources reviewed,
and include any provider smoke tests that were available locally.

By contributing, you agree that your contribution is licensed under this repository's MIT
License.
