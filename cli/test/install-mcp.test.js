import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { after, describe, it } from "node:test";

import { runInstallMcp } from "../src/commands/install-mcp.js";
import { McpConfigError, mergeMcpConfig, parseJsonc } from "../src/mcp/config.js";
import {
  DEFAULT_EDITOR,
  findMcpEditor,
  MCP_EDITOR_IDS,
  MCP_EDITORS,
  MCP_SERVER_NAME,
  MCP_SERVER_URL,
  PROJECT_MCP_EDITOR_IDS
} from "../src/mcp/editors.js";
import { selectEditor } from "../src/ui/prompt.js";
import { captureStreams, cleanup, exists, listFiles, makeTempProject, read } from "./helpers.js";

after(cleanup);

const win = {
  platform: "win32",
  home: "C:\\Users\\dev",
  vars: { APPDATA: "C:\\Users\\dev\\AppData\\Roaming", LOCALAPPDATA: "C:\\Users\\dev\\AppData\\Local" }
};
const mac = { platform: "darwin", home: "/Users/dev", vars: {} };
const linux = { platform: "linux", home: "/home/dev", vars: {} };

const editor = (id) => findMcpEditor(id);
const userConfig = (id, env) => editor(id).userConfig(env);
const merge = (existing, id) => JSON.parse(mergeMcpConfig(existing, editor(id)).text);

describe("mcp/editors", () => {
  it("covers the ten supported editors, vscode first because it is the default", () => {
    assert.deepEqual(MCP_EDITOR_IDS, [
      "vscode",
      "vscode-insiders",
      "cursor",
      "windsurf",
      "webstorm",
      "visual-studio",
      "claude-code",
      "claude-desktop",
      "zed",
      "cline"
    ]);
    assert.equal(MCP_EDITOR_IDS[0], DEFAULT_EDITOR);
  });

  it("points every entry at the SurveyJS MCP server, directly or through mcp-remote", () => {
    for (const entry of MCP_EDITORS) assert.ok(JSON.stringify(entry.entry).includes(MCP_SERVER_URL), entry.id);
  });

  it("finds editors case-insensitively and nothing for a stranger", () => {
    assert.equal(findMcpEditor("WebStorm")?.id, "webstorm");
    assert.equal(findMcpEditor("emacs"), undefined);
  });

  it("keeps project-level configs as posix paths inside the project", () => {
    assert.deepEqual(PROJECT_MCP_EDITOR_IDS, ["vscode", "vscode-insiders", "cursor", "visual-studio", "claude-code", "zed"]);
    assert.deepEqual(
      Object.fromEntries(MCP_EDITORS.filter((entry) => entry.projectConfig).map((entry) => [entry.id, entry.projectConfig])),
      {
        vscode: ".vscode/mcp.json",
        "vscode-insiders": ".vscode/mcp.json",
        cursor: ".cursor/mcp.json",
        "visual-studio": ".mcp.json",
        "claude-code": ".mcp.json",
        zed: ".zed/settings.json"
      }
    );
  });

  it("puts vscode's user config in each OS's settings directory", () => {
    assert.equal(userConfig("vscode", win), join("C:\\Users\\dev\\AppData\\Roaming", "Code", "User", "mcp.json"));
    assert.equal(userConfig("vscode", mac), join("/Users/dev", "Library", "Application Support", "Code", "User", "mcp.json"));
    assert.equal(userConfig("vscode", linux), join("/home/dev", ".config", "Code", "User", "mcp.json"));
    assert.equal(userConfig("vscode", { ...linux, vars: { XDG_CONFIG_HOME: "/xdg" } }), join("/xdg", "Code", "User", "mcp.json"));
  });

  it("keeps zed in ~/.config on macOS but honors XDG_CONFIG_HOME on linux", () => {
    assert.equal(userConfig("zed", mac), join("/Users/dev", ".config", "zed", "settings.json"));
    assert.equal(userConfig("zed", { ...linux, vars: { XDG_CONFIG_HOME: "/xdg" } }), join("/xdg", "zed", "settings.json"));
  });

  it("uses home-directory files for cursor, claude-code, and visual-studio", () => {
    assert.equal(userConfig("cursor", linux), join("/home/dev", ".cursor", "mcp.json"));
    assert.equal(userConfig("claude-code", mac), join("/Users/dev", ".claude.json"));
    assert.equal(userConfig("visual-studio", win), join("C:\\Users\\dev", ".mcp.json"));
  });

  it("falls back to the conventional Windows folders when the variables are unset", () => {
    const bare = { platform: "win32", home: "C:\\Users\\dev", vars: {} };
    assert.equal(userConfig("vscode", bare), join("C:\\Users\\dev", "AppData", "Roaming", "Code", "User", "mcp.json"));
    assert.equal(
      userConfig("webstorm", bare),
      join("C:\\Users\\dev", "AppData", "Local", "github-copilot", "intellij", "mcp.json")
    );
  });
});

describe("mcp/config", () => {
  it("writes only the servers key and the entry when there is no config", () => {
    assert.deepEqual(merge(null, "vscode"), { servers: { [MCP_SERVER_NAME]: { type: "http", url: MCP_SERVER_URL } } });
    assert.deepEqual(merge("  \n", "vscode"), merge(null, "vscode"));
  });

  it("keeps everything already in the config and replaces a stale surveyjs entry", () => {
    const merged = merge(
      JSON.stringify({
        inputs: [{ id: "token" }],
        servers: { other: { command: "node" }, surveyjs: { type: "http", url: "https://old.example" } }
      }),
      "vscode"
    );
    assert.deepEqual(merged.inputs, [{ id: "token" }]);
    assert.deepEqual(merged.servers.other, { command: "node" });
    assert.equal(merged.servers.surveyjs.url, MCP_SERVER_URL);
  });

  it("spells each editor's entry the way its config format wants", () => {
    assert.deepEqual(merge(null, "cursor").mcpServers.surveyjs, { url: MCP_SERVER_URL });
    assert.deepEqual(merge(null, "windsurf").mcpServers.surveyjs, { serverUrl: MCP_SERVER_URL });
    assert.deepEqual(merge(null, "cline").mcpServers.surveyjs, { url: MCP_SERVER_URL, type: "streamableHttp" });
    assert.deepEqual(merge(null, "claude-desktop").mcpServers.surveyjs, {
      command: "npx",
      args: ["-y", "mcp-remote", MCP_SERVER_URL]
    });
    assert.equal(merge(null, "zed").context_servers.surveyjs.source, "custom");
  });

  it("reads JSONC: comments and trailing commas, but never inside strings", () => {
    const { value, hadComments } = parseJsonc(`{
      // line comment
      "theme": "One Dark", /* block */
      "url": "https://example.com//path,}",
      "list": [1, 2,],
    }`);
    assert.equal(hadComments, true);
    assert.deepEqual(value, { theme: "One Dark", url: "https://example.com//path,}", list: [1, 2] });
    assert.equal(parseJsonc('{ "a": "\\"//\\"" }').hadComments, false);
  });

  it("reports that comments were dropped by the merge", () => {
    assert.equal(mergeMcpConfig('{ // note\n "servers": {} }', editor("vscode")).hadComments, true);
    assert.equal(mergeMcpConfig('{ "servers": {} }', editor("vscode")).hadComments, false);
  });

  it("refuses configs it cannot merge into without losing data", () => {
    assert.throws(() => mergeMcpConfig("{ broken", editor("vscode")), McpConfigError);
    assert.throws(() => mergeMcpConfig("[1, 2]", editor("vscode")), /not a JSON object/);
    for (const servers of ["[]", '"oops"', "null"]) {
      assert.throws(() => mergeMcpConfig(`{ "servers": ${servers} }`, editor("vscode")), /'servers' section is not an object/);
    }
  });
});

describe("install-mcp", () => {
  const homes = [];
  after(() => {
    while (homes.length > 0) rmSync(homes.pop(), { recursive: true, force: true });
  });

  /** A fake home directory, so --user runs never reach the real one. */
  function fakeHome() {
    const home = mkdtempSync(join(tmpdir(), "surveyjs-cli-home-"));
    homes.push(home);
    return { platform: "linux", home, vars: {} };
  }

  async function run(root, flags, env = fakeHome()) {
    const { out, err } = captureStreams();
    const result = await runInstallMcp({ root, flags, out, err, env });
    return { ...result, out: out.text, err: err.text, env };
  }

  it("writes the project-level config by default and nothing in the home directory", async () => {
    const root = makeTempProject({ "package.json": "{}" });
    const result = await run(root, { editor: ["vscode"] });

    assert.equal(result.code, 0, result.err);
    assert.deepEqual(result.written, [".vscode/mcp.json"]);
    assert.deepEqual(JSON.parse(read(root, ".vscode/mcp.json")).servers.surveyjs, { type: "http", url: MCP_SERVER_URL });
    assert.deepEqual(listFiles(result.env.home), []);
    assert.match(result.out, /Commit these files/);
  });

  it("writes the user-level config only with --user, and leaves the project alone", async () => {
    const root = makeTempProject({ "package.json": "{}" });
    const result = await run(root, { editor: ["cursor"], user: true });

    assert.equal(result.code, 0, result.err);
    assert.deepEqual(listFiles(result.env.home), [".cursor/mcp.json"]);
    assert.deepEqual(listFiles(root), ["package.json"]);
    assert.doesNotMatch(result.out, /Commit these files/);
  });

  it("refuses a user-level-only editor without --user, before writing anything", async () => {
    const root = makeTempProject({ "package.json": "{}" });
    const result = await run(root, { editor: ["vscode", "windsurf"] });

    assert.equal(result.code, 2);
    assert.match(result.err, /Windsurf has no project-level MCP config/);
    assert.match(result.err, /--user/);
    assert.deepEqual(listFiles(root), ["package.json"]);
    assert.deepEqual(listFiles(result.env.home), []);
  });

  it("merges two editors that share a project file into one write", async () => {
    const root = makeTempProject({ ".mcp.json": JSON.stringify({ mcpServers: { other: { command: "x" } } }) });
    const result = await run(root, { editor: ["claude-code", "visual-studio"] });

    assert.equal(result.code, 0, result.err);
    assert.deepEqual(result.written, [".mcp.json"]);
    const written = JSON.parse(read(root, ".mcp.json"));
    assert.deepEqual(written.mcpServers.other, { command: "x" });
    assert.equal(written.mcpServers.surveyjs.url, MCP_SERVER_URL);
    assert.equal(written.servers.surveyjs.url, MCP_SERVER_URL);
  });

  it("is idempotent", async () => {
    const root = makeTempProject({});
    await run(root, { editor: ["cursor"] });
    const second = await run(root, { editor: ["cursor"] });
    assert.deepEqual(second.written, []);
    assert.deepEqual(second.unchanged, [".cursor/mcp.json"]);
  });

  it("prints the entry and writes nothing on --dry-run", async () => {
    const root = makeTempProject({});
    const result = await run(root, { editor: ["cursor"], dryRun: true });

    assert.equal(result.code, 0, result.err);
    assert.equal(exists(root, ".cursor/mcp.json"), false);
    assert.match(result.out, /would write {2}\.cursor\/mcp\.json/);
    assert.ok(result.out.includes(MCP_SERVER_URL));
  });

  it("stops the whole run on a config it cannot parse", async () => {
    const root = makeTempProject({ ".cursor/mcp.json": "{ broken" });
    const result = await run(root, { editor: ["vscode", "cursor"] });

    assert.equal(result.code, 1);
    assert.match(result.err, /\.cursor\/mcp\.json: the existing config is not valid JSON/);
    assert.equal(read(root, ".cursor/mcp.json"), "{ broken");
    assert.equal(exists(root, ".vscode/mcp.json"), false);
  });

  it("keeps a config with comments unless --force", async () => {
    const original = '{\n  // team servers\n  "servers": {}\n}\n';
    const root = makeTempProject({ ".vscode/mcp.json": original });

    const refused = await run(root, { editor: ["vscode"] });
    assert.equal(refused.code, 1);
    assert.match(refused.err, /contain comments/);
    assert.equal(read(root, ".vscode/mcp.json"), original);

    const forced = await run(root, { editor: ["vscode"], force: true });
    assert.equal(forced.code, 0, forced.err);
    assert.equal(JSON.parse(read(root, ".vscode/mcp.json")).servers.surveyjs.url, MCP_SERVER_URL);
  });

  it("rejects unknown editors, --client, and a missing --editor when nobody can be asked", async () => {
    const root = makeTempProject({});
    assert.equal((await run(root, { editor: ["emacs"] })).code, 2);
    assert.equal((await run(root, { client: ["claude"] })).code, 2);
    const missing = await run(root, { yes: true });
    assert.equal(missing.code, 2);
    assert.match(missing.err, /--editor/);
    assert.deepEqual(listFiles(root), []);
  });
});

describe("ui/prompt selectEditor", () => {
  const OPTIONS = MCP_EDITORS.filter((entry) => entry.projectConfig);

  /** A readline-compatible stdin/stdout pair; each answer is written on its own line. */
  function fakeTty(...answers) {
    const input = new PassThrough();
    const output = new PassThrough();
    input.isTTY = true;
    output.isTTY = true;
    output.resume();
    setImmediate(() => {
      for (const answer of answers) input.write(`${answer}\n`);
    });
    return { input, output };
  }

  it("takes the default on an empty answer, a number off the list, or a name", async () => {
    assert.equal(await selectEditor({ options: OPTIONS, defaultId: "vscode", io: fakeTty("") }), "vscode");
    assert.equal(await selectEditor({ options: OPTIONS, defaultId: "vscode", io: fakeTty("3") }), "cursor");
    assert.equal(await selectEditor({ options: OPTIONS, defaultId: "vscode", io: fakeTty("Zed") }), "zed");
  });

  it("asks again after an answer off the list", async () => {
    assert.equal(await selectEditor({ options: OPTIONS, defaultId: "vscode", io: fakeTty("42", "windsurf", "claude-code") }), "claude-code");
  });

  it("resolves to null when the input closes before an answer", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    output.resume();
    setImmediate(() => input.end());
    assert.equal(await selectEditor({ options: OPTIONS, defaultId: "vscode", io: { input, output } }), null);
  });
});
