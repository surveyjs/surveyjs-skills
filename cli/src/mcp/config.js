// Merging the SurveyJS server into an editor's existing MCP config. Pure text in, text out, so
// every case is testable without a disk.

import { MCP_SERVER_NAME } from "./editors.js";

export class McpConfigError extends Error {}

/**
 * Parse JSON with comments and trailing commas (JSONC) — the format VS Code's mcp.json and Zed's
 * settings.json are documented to accept. No dependency: comments and trailing commas are
 * removed outside string literals and the rest goes to JSON.parse.
 * @returns {{ value: unknown, hadComments: boolean }}
 */
export function parseJsonc(text) {
  let hadComments = false;
  const withoutComments = outsideStrings(text, (source, index) => {
    if (source[index] !== "/" || (source[index + 1] !== "/" && source[index + 1] !== "*")) return null;
    hadComments = true;
    if (source[index + 1] === "/") {
      const end = source.indexOf("\n", index);
      return { skip: (end === -1 ? source.length : end) - index };
    }
    const end = source.indexOf("*/", index + 2);
    return { skip: (end === -1 ? source.length : end + 2) - index };
  });
  // A comma is trailing when the next thing after it is a closing bracket; comments are gone by now.
  // Sticky, so the look-ahead starts at the comma instead of slicing a copy of the rest of the file:
  // ~/.claude.json can be megabytes.
  const closing = /\s*[}\]]/y;
  const withoutTrailingCommas = outsideStrings(withoutComments, (source, index) => {
    if (source[index] !== ",") return null;
    closing.lastIndex = index + 1;
    return closing.test(source) ? { skip: 1 } : null;
  });
  return { value: JSON.parse(withoutTrailingCommas), hadComments };
}

/**
 * Copy `text`, letting `drop` remove spans that start outside string literals. String literals
 * are copied whole, so a "//" or ",}" inside a value is never mistaken for syntax.
 */
function outsideStrings(text, drop) {
  let result = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] === '"') {
      let end = index + 1;
      while (end < text.length && text[end] !== '"') end += text[end] === "\\" ? 2 : 1;
      result += text.slice(index, end + 1);
      index = end + 1;
      continue;
    }
    const dropped = drop(text, index);
    if (dropped) {
      index += dropped.skip;
      continue;
    }
    result += text[index];
    index += 1;
  }
  return result;
}

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Add or replace the `surveyjs` entry under the editor's servers key and keep everything else.
 * The result is plain JSON, which every editor accepts; comments in the input do not survive,
 * and `hadComments` says so.
 * @param {string | null} existing the config file's current text, or null when there is none
 * @returns {{ text: string, hadComments: boolean }}
 */
export function mergeMcpConfig(existing, editor) {
  let config = {};
  let hadComments = false;
  if (existing !== null && existing.trim() !== "") {
    try {
      ({ value: config, hadComments } = parseJsonc(existing));
    } catch (error) {
      throw new McpConfigError(`the existing config is not valid JSON: ${error.message}`);
    }
    if (!isObject(config)) {
      throw new McpConfigError("the existing config is not a JSON object, so there is nothing to merge into");
    }
  }

  const section = config[editor.serversKey];
  if (section !== undefined && !isObject(section)) {
    throw new McpConfigError(
      `the existing config's '${editor.serversKey}' section is not an object of servers, ` +
        "so merging into it would discard what is there"
    );
  }
  config[editor.serversKey] = { ...section, [MCP_SERVER_NAME]: editor.entry };
  return { text: `${JSON.stringify(config, null, 2)}\n`, hadComments };
}
