# SurveyJS CLI

Give your AI coding client guidance for working with SurveyJS. This CLI installs [SurveyJS agent skills](../plugins/surveyjs/skills/) that match the packages in your project. It can also connect your editor to the SurveyJS MCP server so your assistant can search the documentation.

Requires Node.js 22 or later.

## Quick Start

Open a terminal in your project root and run `init-agents`. It finds your SurveyJS packages, asks you to confirm which AI clients to use, and installs the matching skills.

```sh
# Detect clients and install matching SurveyJS skills
npx surveyjs-cli@latest init-agents
```

To choose clients yourself, pass `--client`. If you want to review the changes first, use `--dry-run`.

```sh
# Install skills for specific clients (Claude Code and Cursor)
npx surveyjs-cli@latest init-agents --client=claude,cursor

# Preview changes without writing files
npx surveyjs-cli@latest init-agents --dry-run
```

The skills are saved in each client's skill directory. The CLI also creates `.surveyjs-skills.json` to track what it installed. Commit these files so everyone working on the project uses the same guidance.

## Commands

Use `npx surveyjs-cli@latest <command>` to run any command.

| Command | Description |
| :--- | :--- |
| `init-agents` | [Install skills](#agent-skills) for your project's packages and AI clients. |
| `update` | [Refresh the skills](#keeping-skills-updated) for your selected clients. |
| `doctor` | [Check whether the installed skills need an update](#keeping-skills-updated). |
| `install-mcp` | [Add the SurveyJS MCP server](#mcp-server-setup) to an editor's configuration. |

## Options

| Option | Description |
| :--- | :--- |
| `--client=<name>` | [Choose clients](#supported-clients) for `init-agents`. Repeat the option or separate names with commas. |
| `--all` | Install skills for [all supported clients](#supported-clients). |
| `--editor=<name>` | [Choose editors](#supported-editors) for `install-mcp`. Repeat the option or separate names with commas. |
| `--user` | [Write user configuration](#mcp-server-setup) for `install-mcp`. |
| `--yes`, `-y` | Skip prompts. |
| `--dry-run` | Preview changes without writing files. |
| `--force` | Replace conflicting skill files the CLI does not track, or rewrite MCP configuration without its comments. |
| `--help`, `-h` | Show usage. |
| `--version`, `-v` | Show the CLI version. |

## Agent Skills

### Supported Clients

Use the names below with `--client` to choose where to install skills. For clients that read `AGENTS.md`, including Codex, choose `agents-md`.

| `--client` | Skill directory | Instructions file |
| :--- | :--- | :--- |
| `claude` | `.claude/skills/<name>/` | None |
| `cursor` | `.cursor/skills/<name>/` | None |
| `copilot` | `.github/skills/<name>/` | `.github/copilot-instructions.md` |
| `agents-md` | `.agents/skills/<name>/` | `AGENTS.md` |

If you omit `--client`, the CLI suggests the clients it detects and lets you change the selection. With `--yes` or in a terminal that cannot accept input, it uses the detected clients automatically. If it finds none, it uses `agents-md`.

### How Skills Are Selected

The CLI checks `package.json`, installed packages, and npm, pnpm, Yarn, or Bun text lockfiles to find the SurveyJS products you use. This includes SurveyJS packages installed as dependencies of other packages. It then installs skills for those products. If it finds no SurveyJS packages, it installs all skills.

Each skill includes the package versions the CLI finds. When only a version range is available, the skill states that the exact version is unknown.

### Keeping Skills Updated

After changing your SurveyJS dependencies, run `update`. It uses `.surveyjs-skills.json` to refresh skills for the same clients and remove files that no longer apply.

```sh
# Refresh skills after changing SurveyJS dependencies
npx surveyjs-cli@latest update
```

Use `doctor` to check for changes to your packages or CLI version, or for missing skill files. It returns a nonzero exit code when it finds a problem, so you can use it in CI. If it cannot determine an exact package version, it reports a warning without failing the check.

```sh
# Check whether an update is needed
npx surveyjs-cli@latest doctor
```

When updating `AGENTS.md` or Copilot instructions, the CLI changes only the section between `<!-- surveyjs:start -->` and `<!-- surveyjs:end -->`. Your surrounding instructions stay intact.

For skill files, the CLI uses `.surveyjs-skills.json` to check which files it manages. If a file it does not track conflicts with the new content, the command stops. Pass `--force` if you want to replace that file.

## MCP Server Setup

To let your assistant search SurveyJS documentation, use `install-mcp`. It adds the server at `https://mcp.surveyjs.io/mcp` to your editor's configuration.

Choose an editor with `--editor`. By default, the command saves the configuration in your project, so you can commit it and share it with your team.

```sh
# Add the MCP server to VS Code's project configuration
npx surveyjs-cli@latest install-mcp --editor=vscode

# Add the MCP server to Claude Code and Cursor project configurations
npx surveyjs-cli@latest install-mcp --editor=claude-code,cursor
```

To save the configuration for your user account, add `--user`. Editors such as Windsurf require this option because they do not support project configuration files.

```sh
# Add the MCP server to Windsurf's user configuration
npx surveyjs-cli@latest install-mcp --editor=windsurf --user
```

If you omit `--editor`, the CLI asks you to choose one. In scripts or CI, always pass `--editor` so the command can run without a prompt.

### Supported Editors

The table below shows where the CLI saves the configuration for each editor.

| `--editor` | Project configuration | User configuration (`--user`) |
| :--- | :--- | :--- |
| `vscode` | `.vscode/mcp.json` | `mcp.json` in the VS Code user profile |
| `vscode-insiders` | `.vscode/mcp.json` | `mcp.json` in the VS Code Insiders user profile |
| `cursor` | `.cursor/mcp.json` | `~/.cursor/mcp.json` |
| `windsurf` | None | `~/.codeium/windsurf/mcp_config.json` |
| `webstorm` | None | GitHub Copilot's `mcp.json` for JetBrains IDEs |
| `visual-studio` | `.mcp.json` | `~/.mcp.json` |
| `claude-code` | `.mcp.json` | `~/.claude.json` |
| `claude-desktop` | None | `claude_desktop_config.json` in the OS configuration directory |
| `zed` | `.zed/settings.json` | Zed's `settings.json` |
| `cline` | None | `cline_mcp_settings.json` in VS Code's `globalStorage` |

> Claude Desktop and Zed use `npx mcp-remote` to connect to the server. Make sure Node.js is on `PATH` when these apps start.

### Updating Existing Configuration

The `install-mcp` command adds or replaces the `surveyjs` server entry while keeping your other servers and settings. If a configuration file is invalid, the command stops before writing any files so you can fix it first.

The CLI saves configuration as plain JSON, which does not support comments. If your file has comments, the CLI shows the server entry for you to add it manually. You can instead pass `--force` to rewrite the file and remove its comments.

## Development

To change a skill, edit its source in [`plugins/surveyjs/skills/`](../plugins/surveyjs/skills/). During packaging, the `prepack` script copies these sources into `cli/skills/`, which is excluded from Git.

Run the following commands from `cli/` to check your changes and preview the package:

```sh
# Run the CLI test suite
npm test

# Preview package contents without creating a tarball
npm pack --dry-run
```

## License

[MIT](LICENSE).
