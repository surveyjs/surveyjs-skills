# surveyjs-cli

Puts the [SurveyJS agent skills](../plugins/surveyjs/skills/) into whichever AI coding clients
your project already uses, filtered to the SurveyJS products you actually have installed and
pinned to the versions you actually have installed.

```
npx surveyjs-cli@latest init-agents
```

No runtime dependencies, no install scripts, no network calls, no telemetry. Node 22+.

## What `init-agents` does

1. **Reads your project.** `package.json` plus `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`,
   `bun.lock`, or `node_modules/` gives the installed version of every SurveyJS package and the UI
   framework you render with (react / angular / vue3 / jquery / vanilla). Transitive packages count:
   `npm install survey-creator-react` on its own — what the Creator docs tell you to do — pulls
   `survey-creator-core`, `survey-core`, and `survey-react-ui` without listing them in
   `package.json`, and all four are detected.
2. **Detects your AI clients** from the config locations each one documents (table below).
3. **Filters the skills.** Each skill declares the packages it applies to in a `skill.meta.json`
   beside its `SKILL.md`; only matching skills are written. A project with `survey-pdf` and
   nothing else gets `surveyjs-form-json` and `surveyjs-pdf-generator`. A project with no
   SurveyJS at all gets the full set, because there is nothing to narrow by.
4. **Writes them.** Directories we own are written whole. Files we do not own — `AGENTS.md`,
   `.github/copilot-instructions.md` — only get a block between `<!-- surveyjs:start -->` and
   `<!-- surveyjs:end -->`; the rest of the file is never rewritten.
5. **Pins the versions** into every written `SKILL.md`, so the skill text says which SurveyJS
   version it describes — and only when the version was actually verified. See
   [Versions it will and will not claim](#versions-it-will-and-will-not-claim).
6. **Records what it wrote** in `.surveyjs-skills.json`. Re-runs are idempotent and clean up
   anything recorded there that no longer applies.

## Client targets

| `--client` | Skill directory | Managed block | Path source |
| :--- | :--- | :--- | :--- |
| `claude` | `.claude/skills/<name>/` | — | [Claude Code — skills](https://code.claude.com/docs/en/skills) |
| `cursor` | `.cursor/skills/<name>/` | — | [Cursor — Agent Skills](https://cursor.com/docs/skills) |
| `copilot` | `.github/skills/<name>/` | `.github/copilot-instructions.md` | [GitHub — add agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills), [VS Code — agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills), [GitHub — repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) |
| `agents-md` | `.agents/skills/<name>/` | `AGENTS.md` | [agents.md](https://agents.md/), plus the Cursor and Copilot docs above for `.agents/skills/` |

`agents-md` is the portable target: OpenAI Codex, Gemini CLI, Jules, and anything else that reads
`AGENTS.md`. It is also what gets written when no client is detected and nobody can be asked.

With no `--client` and no `--all`, the detected clients are used. In a TTY you get to confirm or
change that selection; with `--yes`, or when stdin is not a TTY (CI), the detected set is used
as-is.

## Commands

```
surveyjs-cli init-agents [options]   detect, filter, write, record
surveyjs-cli doctor                  compare .surveyjs-skills.json against what is installed now
surveyjs-cli update                  re-run placement for the clients already recorded
surveyjs-cli install-mcp [options]   add the SurveyJS MCP server to an editor's MCP config
```

`doctor` exits non-zero when the recorded state is stale — a SurveyJS upgrade, an added or
removed package, a different surveyjs-cli, a recorded file missing from disk — so it works as a CI
check. A version it simply could not verify is reported as a warning and does **not** fail the
exit code: a project with no committed lockfile and no `node_modules` in CI cannot fix that, and
failing the build over it would be noise.

## `install-mcp`

Registers the SurveyJS MCP server, `https://mcp.surveyjs.io/mcp`, so the AI assistant in your
editor can search the SurveyJS documentation.

```
npx surveyjs-cli@latest install-mcp --editor=vscode              # .vscode/mcp.json in this project
npx surveyjs-cli@latest install-mcp --editor=claude-code,cursor  # .mcp.json and .cursor/mcp.json
npx surveyjs-cli@latest install-mcp --editor=windsurf --user     # ~/.codeium/windsurf/mcp_config.json
npx surveyjs-cli@latest install-mcp --editor=zed --dry-run       # print the entry, write nothing
```

By default the command writes the editor's **project-level** config, inside the project root like
everything else this CLI writes, so you can commit it and share the server with the team. It writes
the **user-level** config in your home directory only when you pass `--user`. Editors without a
project-level config fail without `--user` and write nothing.

| `--editor` | Project-level config | User-level config (`--user`) | Path source |
| :--- | :--- | :--- | :--- |
| `vscode` | `.vscode/mcp.json` | `mcp.json` in the VS Code user profile | [VS Code — MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) |
| `vscode-insiders` | `.vscode/mcp.json` | `mcp.json` in the VS Code Insiders user profile | [VS Code — MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) |
| `cursor` | `.cursor/mcp.json` | `~/.cursor/mcp.json` | [Cursor — MCP](https://cursor.com/docs/context/mcp) |
| `windsurf` | — | `~/.codeium/windsurf/mcp_config.json` | [Windsurf — MCP](https://docs.windsurf.com/windsurf/cascade/mcp) |
| `webstorm` | — | GitHub Copilot's `mcp.json` for JetBrains IDEs | [GitHub — extend Copilot Chat with MCP](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp) |
| `visual-studio` | `.mcp.json` | `~/.mcp.json` | [Visual Studio — MCP servers](https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers) |
| `claude-code` | `.mcp.json` | `~/.claude.json` | [Claude Code — MCP](https://code.claude.com/docs/en/mcp) |
| `claude-desktop` | — | `claude_desktop_config.json` in the OS config directory | [MCP — connect local servers](https://modelcontextprotocol.io/quickstart/user) |
| `zed` | `.zed/settings.json` | Zed's `settings.json` | [Zed — MCP](https://zed.dev/docs/ai/mcp) |
| `cline` | — | `cline_mcp_settings.json` in VS Code's `globalStorage` | [Cline — configuring MCP servers](https://docs.cline.bot/mcp/configuring-mcp-servers) |

- Only the `surveyjs` entry is added or replaced; other servers and settings in the file are kept.
  Re-runs are idempotent.
- The file is written back as plain JSON. If it contains comments, the command refuses, prints the
  entry to add by hand, and rewrites the file only with `--force`.
- A file that is not valid JSON(C) stops the run before any file is written.
- Claude Desktop and Zed get the server through `npx mcp-remote`, so Node.js has to be on `PATH`
  when the editor starts it. The CLI itself still makes no network calls.
- Without `--editor`, a TTY gets a prompt (default `vscode`); `--yes` or a non-TTY stdin fails with
  exit code 2 instead of guessing.
- `install-mcp` does not record anything in `.surveyjs-skills.json`: the MCP config is a shared
  file, not one this CLI owns.

## Options

| Option | Effect |
| :--- | :--- |
| `--client=<name>` | Write for this client. Repeatable, and comma-separated values work. |
| `--all` | Write for every known client. |
| `--editor=<name>` | `install-mcp`: add the server for this editor. Repeatable, and comma-separated values work. |
| `--user` | `install-mcp`: write the editor's user-level config in your home directory instead of the project-level one. |
| `--yes`, `-y` | Never prompt. Fully non-interactive, for CI. |
| `--dry-run` | Print what would change; touch nothing. |
| `--force` | Overwrite files at owned paths that a previous run did not write. |
| `--help`, `-h` / `--version`, `-v` | Usage / version. |

Without `--force`, a file at a path we own that exists, differs from what we would write, and is
not listed in `.surveyjs-skills.json` aborts the whole run before anything is written. That is
the case where someone hand-edited a skill, and silently replacing it would lose their work.

## Versions it will and will not claim

Every package carries where its version came from, and only a verified version is ever printed as
one:

| `source` | Means | Written as |
| :--- | :--- | :--- |
| `node_modules` | Read from the installed package | `survey-core@3.0.1` |
| `lockfile` | Read from the lockfile | `survey-core@3.0.1` |
| `package.json` | Pinned exactly, no range operator | `survey-core@3.0.1` |
| `range` | Only a range is known — no readable lockfile, nothing installed | `survey-core@^3.0.1`, labelled as an unresolved range |

So a project with `"survey-core": "^3.0.1"`, no lockfile, and no `node_modules` gets skills that
say "declared `survey-core@^3.0.1`, exact installed version could not be verified" rather than
claiming 3.0.1, which may well be wrong. `bun.lockb` is binary and is reported as unreadable
rather than guessed at; `bun.lock` (Bun 1.2+) is parsed.

## `.surveyjs-skills.json`

```json
{
  "cliVersion": "0.1.0",
  "generator": "surveyjs-cli",
  "source": "https://github.com/surveyjs/surveyjs-skills",
  "framework": "react",
  "lockfile": "package-lock.json",
  "lockfileParsed": true,
  "packages": {
    "survey-core": { "version": "3.0.1", "range": "^3.0.1", "source": "lockfile" },
    "survey-react-ui": { "version": "3.0.1", "range": "^3.0.1", "source": "lockfile" }
  },
  "clients": ["claude", "cursor"],
  "skills": ["surveyjs-brand-styling", "surveyjs-form-json", "surveyjs-integration"],
  "files": ["..."],
  "blocks": []
}
```

Commit it along with the written skills. It carries no timestamps, so identical inputs produce an
identical file and a re-run is a no-op in `git status`.

Paths inside it are treated as untrusted input. An entry that points outside the project root —
`../something`, an absolute path — is refused and reported, never written to or deleted, so
running `init-agents` inside a repository you just cloned cannot touch anything above it.

## Development

The skill content lives once in git, at [`plugins/surveyjs/skills/`](../plugins/surveyjs/skills/).
`cli/skills/` is gitignored and produced by the `prepack` script when the package is packed or
published:

```
node scripts/prepack-skills.js   # copy plugins/surveyjs/skills -> cli/skills
node --test                      # golden-file tests over test/fixtures/
UPDATE_GOLDEN=1 node --test      # accept new golden output in test/golden/
npm pack --dry-run               # inspect the tarball
```

At runtime the CLI reads `cli/skills/` when it exists and falls back to
`../plugins/surveyjs/skills/` when running from a checkout.

Adding a client target means adding a module under `src/targets/`, registering it in
`src/targets/index.js`, and adding its detection markers to `src/detect/clients.js`. Both need a
link to the client's own documentation for the path — a wrong path writes files into someone's
repository that silently never load.

## License

MIT — see [LICENSE](LICENSE).
