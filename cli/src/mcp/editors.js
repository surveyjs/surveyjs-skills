// The code editors `install-mcp` can register the SurveyJS MCP server with. Every editor keeps
// its MCP servers in a JSON file of its own — a different location and a different entry shape
// per editor — so both live in one table here. Each path links to the editor's own
// documentation: a wrong path writes a config that silently never loads.

import { join } from "node:path";

export const MCP_SERVER_URL = "https://mcp.surveyjs.io/mcp";

/** The key the server is registered under in every editor's config. */
export const MCP_SERVER_NAME = "surveyjs";

export const DEFAULT_EDITOR = "vscode";

/** %APPDATA% — the roaming config dir on Windows. */
const appData = (env) => env.vars.APPDATA || join(env.home, "AppData", "Roaming");

/** %LOCALAPPDATA% — the local (non-roaming) config dir on Windows. */
const localAppData = (env) => env.vars.LOCALAPPDATA || join(env.home, "AppData", "Local");

/** The per-user config dir the OS convention puts application settings in. */
function userConfigDir(env) {
  if (env.platform === "win32") return appData(env);
  if (env.platform === "darwin") return join(env.home, "Library", "Application Support");
  return env.vars.XDG_CONFIG_HOME || join(env.home, ".config");
}

/** Editors that take a remote server directly, in the common { type, url } shape. */
const httpEntry = { type: "http", url: MCP_SERVER_URL };

/** Editors whose config only runs local commands: the standard mcp-remote bridge. */
const bridgeEntry = { command: "npx", args: ["-y", "mcp-remote", MCP_SERVER_URL] };

/**
 * `projectConfig` is posix-relative to the project root and is what `install-mcp` writes by
 * default. `userConfig(env)` is an absolute path outside the project, written only with --user.
 * An editor without `projectConfig` reads its servers from one user-level file and nothing else.
 */
export const MCP_EDITORS = [
  {
    id: "vscode",
    label: "Visual Studio Code",
    // https://code.visualstudio.com/docs/copilot/customization/mcp-servers
    serversKey: "servers",
    entry: httpEntry,
    projectConfig: ".vscode/mcp.json",
    userConfig: (env) => join(userConfigDir(env), "Code", "User", "mcp.json"),
    note: "Open the Chat view and pick Agent mode to use the server."
  },
  {
    id: "vscode-insiders",
    label: "Visual Studio Code - Insiders",
    // https://code.visualstudio.com/docs/copilot/customization/mcp-servers
    serversKey: "servers",
    entry: httpEntry,
    projectConfig: ".vscode/mcp.json",
    userConfig: (env) => join(userConfigDir(env), "Code - Insiders", "User", "mcp.json"),
    note: "Open the Chat view and pick Agent mode to use the server."
  },
  {
    id: "cursor",
    label: "Cursor",
    // https://cursor.com/docs/context/mcp
    serversKey: "mcpServers",
    entry: { url: MCP_SERVER_URL },
    projectConfig: ".cursor/mcp.json",
    userConfig: (env) => join(env.home, ".cursor", "mcp.json"),
    note: "Restart Cursor to pick up the change."
  },
  {
    id: "windsurf",
    label: "Windsurf",
    // https://docs.windsurf.com/windsurf/cascade/mcp
    serversKey: "mcpServers",
    entry: { serverUrl: MCP_SERVER_URL },
    userConfig: (env) => join(env.home, ".codeium", "windsurf", "mcp_config.json"),
    note: "Refresh the plugins in Windsurf's Cascade panel to pick up the change."
  },
  {
    id: "webstorm",
    label: "WebStorm (GitHub Copilot plugin)",
    // https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp
    serversKey: "servers",
    entry: httpEntry,
    userConfig: (env) =>
      join(env.platform === "win32" ? localAppData(env) : join(env.home, ".config"), "github-copilot", "intellij", "mcp.json"),
    note:
      "This file is read by the GitHub Copilot plugin in any JetBrains IDE, not just WebStorm.\n" +
      "JetBrains AI Assistant keeps its own list: add the server under\n" +
      "Settings | Tools | AI Assistant | Model Context Protocol (MCP) instead."
  },
  {
    id: "visual-studio",
    label: "Visual Studio",
    // https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers
    serversKey: "servers",
    entry: httpEntry,
    projectConfig: ".mcp.json",
    userConfig: (env) => join(env.home, ".mcp.json"),
    note: "Needs Visual Studio 2022 17.14 or later; the server appears in Copilot Chat's Agent mode."
  },
  {
    id: "claude-code",
    label: "Claude Code",
    // https://code.claude.com/docs/en/mcp — project scope .mcp.json, user scope ~/.claude.json
    serversKey: "mcpServers",
    entry: httpEntry,
    projectConfig: ".mcp.json",
    userConfig: (env) => join(env.home, ".claude.json"),
    note: "Run /mcp inside Claude Code to check the server."
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    // https://modelcontextprotocol.io/quickstart/user
    serversKey: "mcpServers",
    entry: bridgeEntry,
    userConfig: (env) => join(userConfigDir(env), "Claude", "claude_desktop_config.json"),
    note:
      "Claude Desktop's config only runs local servers, so this goes through 'npx mcp-remote':\n" +
      "Node.js has to be on PATH. Restart Claude Desktop to pick up the change."
  },
  {
    id: "zed",
    label: "Zed",
    // https://zed.dev/docs/ai/mcp
    serversKey: "context_servers",
    entry: { source: "custom", ...bridgeEntry },
    projectConfig: ".zed/settings.json",
    userConfig: (env) => {
      if (env.platform === "win32") return join(appData(env), "Zed", "settings.json");
      // Zed uses ~/.config even on macOS, but honors XDG_CONFIG_HOME on Linux.
      if (env.platform === "darwin") return join(env.home, ".config", "zed", "settings.json");
      return join(userConfigDir(env), "zed", "settings.json");
    },
    note: "This entry goes through 'npx mcp-remote': Node.js has to be on PATH when Zed starts it."
  },
  {
    id: "cline",
    label: "Cline (VS Code extension)",
    // https://docs.cline.bot/mcp/configuring-mcp-servers
    serversKey: "mcpServers",
    entry: { url: MCP_SERVER_URL, type: "streamableHttp" },
    userConfig: (env) =>
      join(userConfigDir(env), "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
    note: "Open Cline's MCP Servers panel to check the connection."
  }
];

export const MCP_EDITOR_IDS = MCP_EDITORS.map((editor) => editor.id);

/** The editors that can be installed without --user: the ones with a project-level config. */
export const PROJECT_MCP_EDITOR_IDS = MCP_EDITORS.filter((editor) => editor.projectConfig).map((editor) => editor.id);

export function findMcpEditor(id) {
  const lower = String(id).toLowerCase();
  return MCP_EDITORS.find((editor) => editor.id === lower);
}
