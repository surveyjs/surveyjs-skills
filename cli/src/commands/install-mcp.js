// `surveyjs-cli install-mcp` — register the SurveyJS MCP server in an editor's MCP config.
//
// Project scope is the default: the config file lives inside the project root, like everything
// else this CLI writes, and can be committed. Writing an editor's user-level config — a file in
// the home directory, outside the project — happens only with --user.

import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import process from "node:process";

import { McpConfigError, mergeMcpConfig } from "../mcp/config.js";
import {
  DEFAULT_EDITOR,
  findMcpEditor,
  MCP_EDITOR_IDS,
  MCP_EDITORS,
  MCP_SERVER_NAME,
  MCP_SERVER_URL,
  PROJECT_MCP_EDITOR_IDS
} from "../mcp/editors.js";
import { readIfExists, resolveInside } from "../fs/write.js";
import { isInteractive, selectEditor } from "../ui/prompt.js";

export function defaultEnvironment() {
  return { platform: process.platform, home: homedir(), vars: process.env };
}

export async function runInstallMcp({
  root = process.cwd(),
  flags = {},
  out = process.stdout,
  err = process.stderr,
  io = {},
  env = defaultEnvironment()
} = {}) {
  const user = Boolean(flags.user);
  const fail = (code, message) => {
    err.write(`${message.trimEnd()}\n`);
    return { code, written: [], unchanged: [] };
  };

  if (flags.client?.length || flags.all) {
    return fail(2, "install-mcp takes --editor, not --client or --all. Known editors: " + MCP_EDITOR_IDS.join(", "));
  }

  const editors = await resolveEditors({ flags, user, io });
  if (editors.error) return fail(editors.code, editors.error);

  if (!user) {
    const userOnly = editors.list.filter((editor) => !editor.projectConfig);
    if (userOnly.length > 0) {
      return fail(
        2,
        userOnly
          .map((editor) => `${editor.label} has no project-level MCP config; it reads ${editor.userConfig(env)}.`)
          .join("\n") +
          "\nRe-run with --user to write that user-level file." +
          `\nEditors with a project-level config: ${PROJECT_MCP_EDITOR_IDS.join(", ")}`
      );
    }
  }

  // Plan every file before writing any, so a config that will not parse stops the whole run.
  // Two editors can share a file (.vscode/mcp.json, .mcp.json): the second merges into the first.
  const files = new Map();
  for (const editor of editors.list) {
    const absolute = user ? editor.userConfig(env) : resolveInside(root, editor.projectConfig);
    if (absolute === null) throw new Error(`surveyjs-cli built a path outside the project root: ${editor.projectConfig}`);
    const display = user ? absolute : editor.projectConfig;
    const file = files.get(absolute) ?? { absolute, display, original: readIfExists(absolute), editors: [] };
    const current = file.editors.length > 0 ? file.text : file.original;
    try {
      const merged = mergeMcpConfig(current, editor);
      file.text = merged.text;
      file.hadComments = file.hadComments || merged.hadComments;
    } catch (error) {
      if (!(error instanceof McpConfigError)) throw error;
      return fail(1, `${display}: ${error.message}.\nFix or remove the file and re-run. Nothing was written.`);
    }
    file.editors.push(editor);
    files.set(absolute, file);
  }

  const withComments = [...files.values()].filter((file) => file.hadComments);
  if (withComments.length > 0 && !flags.force) {
    return fail(
      1,
      "These configs contain comments, and the rewrite would not keep them:\n" +
        withComments.map((file) => `  ${file.display}\n`).join("") +
        "Re-run with --force to rewrite them anyway, or add the server by hand:\n" +
        editors.list.map((editor) => `  ${editor.serversKey}.${MCP_SERVER_NAME} = ${JSON.stringify(editor.entry)}\n`).join("")
    );
  }

  const prefix = flags.dryRun ? "would write" : "wrote";
  const written = [];
  const unchanged = [];
  out.write(`SurveyJS MCP server: ${MCP_SERVER_URL}\n\n`);
  for (const file of files.values()) {
    const labels = file.editors.map((editor) => editor.label).join(", ");
    if (file.text === file.original) {
      unchanged.push(file.display);
      out.write(`unchanged ${file.display}  (${labels})\n`);
      continue;
    }
    if (!flags.dryRun) {
      mkdirSync(dirname(file.absolute), { recursive: true });
      writeFileSync(file.absolute, file.text, "utf8");
    }
    written.push(file.display);
    out.write(`${prefix}  ${file.display}  (${labels})\n`);
    // The entry only, never the whole file: a user-level config such as ~/.claude.json holds
    // far more than MCP servers.
    if (flags.dryRun) {
      for (const editor of file.editors) {
        out.write(`  "${editor.serversKey}": { "${MCP_SERVER_NAME}": ${JSON.stringify(editor.entry)} }\n`);
      }
    }
  }

  out.write("\n");
  for (const editor of editors.list) out.write(`${editor.label}: ${editor.note}\n`);
  if (flags.dryRun) out.write("\nDry run — nothing was written to disk.\n");
  else if (!user && written.length > 0) out.write("\nCommit these files so everyone on the project gets the server.\n");

  return { code: 0, written, unchanged, editors: editors.list.map((editor) => editor.id) };
}

async function resolveEditors({ flags, user, io }) {
  if (flags.editor?.length) {
    const unknown = flags.editor.filter((id) => !findMcpEditor(id));
    if (unknown.length > 0) {
      return { code: 2, error: `Unknown editor(s): ${unknown.join(", ")}. Known editors: ${MCP_EDITOR_IDS.join(", ")}` };
    }
    const ids = flags.editor.map((id) => findMcpEditor(id).id);
    return { list: MCP_EDITORS.filter((editor) => ids.includes(editor.id)) };
  }

  if (flags.yes || !isInteractive(io)) {
    return { code: 2, error: `No --editor given. Pass --editor=<name>; known editors: ${MCP_EDITOR_IDS.join(", ")}` };
  }

  // Without --user, only offer what can be installed without it.
  const options = MCP_EDITORS.filter((editor) => user || editor.projectConfig);
  const chosen = await selectEditor({ options, defaultId: DEFAULT_EDITOR, io });
  if (chosen === null) return { code: 1, error: "No editor selected. Nothing was written." };
  return { list: [findMcpEditor(chosen)] };
}
