// Installs the real tarball into a scratch project and runs the installed binary.
//
// This is the only test that exercises what a published install actually does: `npm pack`
// runs the prepack script, so the skills come from cli/skills/ rather than the repository
// fallback, and survey-cli sits in the consumer's node_modules where detection can see it.
// Both of those went wrong in ways no source-tree test could have caught.

import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { after, before, describe, it } from "node:test";

import { CLI_ROOT } from "./helpers.js";

// npm has to go through a shell on Windows, where it is a .cmd; a single command string
// avoids the deprecation warning that an args array plus shell:true raises.
const npm = (args, cwd) => execSync(`npm ${args}`, { cwd, stdio: "pipe", encoding: "utf8" });
const workspaces = [];
let tarball = null;

before(() => {
  const output = npm("pack --silent", CLI_ROOT);
  const name = output.trim().split(/\r?\n/).pop();
  tarball = join(CLI_ROOT, name);
  assert.ok(existsSync(tarball), `npm pack produced no tarball (got ${JSON.stringify(name)})`);
});

after(() => {
  while (workspaces.length > 0) rmSync(workspaces.pop(), { recursive: true, force: true });
  if (tarball && existsSync(tarball)) rmSync(tarball, { force: true });
  rmSync(join(CLI_ROOT, "skills"), { recursive: true, force: true });
});

/**
 * A scratch project with survey-cli installed from the tarball, as a consumer would.
 *
 * survey-cli is installed first, into a project with no other dependencies, so npm never has
 * to reach the registry — the tarball is local and has none. The SurveyJS dependencies are
 * added afterwards and their node_modules entries written by hand, which keeps the test
 * offline and fast while still reproducing what matters: a real install layout with
 * survey-cli sitting in both package.json and node_modules alongside them.
 */
function install(dependencies, extraFiles = {}) {
  const root = mkdtempSync(join(tmpdir(), "survey-cli-packed-"));
  workspaces.push(root);
  const manifestPath = join(root, "package.json");
  writeFileSync(manifestPath, `${JSON.stringify({ name: "consumer", private: true, version: "1.0.0" }, null, 2)}\n`);

  // --offline guarantees the run touches no registry: the tarball is local and has no
  // dependencies, so anything that needed the network would be a defect worth failing on.
  npm(`install --no-audit --no-fund --offline --save-dev "${tarball}"`, root);

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.dependencies = dependencies;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  for (const [name, range] of Object.entries(dependencies)) {
    const dir = join(root, "node_modules", ...name.split("/"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version: range.replace(/^[^\d]*/, "") }), "utf8");
  }

  for (const [rel, content] of Object.entries(extraFiles)) {
    const absolute = join(root, ...rel.split("/"));
    mkdirSync(join(absolute, ".."), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }
  return root;
}

function run(root, args) {
  const bin = join(root, "node_modules", "survey-cli", "bin", "survey-cli.js");
  try {
    return { code: 0, stdout: execFileSync(process.execPath, [bin, ...args], { cwd: root, encoding: "utf8" }) };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

describe("installed from the tarball", { timeout: 180_000 }, () => {
  it("serves skills out of the packed skills/ directory, not the repository", () => {
    const root = install({ "survey-core": "^3.0.1", "survey-react-ui": "^3.0.1" }, { ".claude/settings.json": "{}" });
    const packedSkills = join(root, "node_modules", "survey-cli", "skills");
    assert.ok(existsSync(join(packedSkills, "surveyjs-form-json", "SKILL.md")), "prepack did not ship the skills");
    assert.ok(existsSync(join(packedSkills, "surveyjs-form-json", "skill.meta.json")), "skill.meta.json was not packed");
    assert.equal(readdirSync(packedSkills).length, 8);

    const result = run(root, ["init-agents", "--yes", "--client=claude"]);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(existsSync(join(root, ".claude", "skills", "surveyjs-form-json", "SKILL.md")));
  });

  it("does not report itself as one of the project's SurveyJS packages", () => {
    const root = install({ "survey-core": "^3.0.1", "survey-react-ui": "^3.0.1" }, { ".claude/settings.json": "{}" });
    const result = run(root, ["init-agents", "--yes", "--client=claude"]);

    assert.equal(result.code, 0, result.stderr);
    assert.doesNotMatch(result.stdout, /survey-cli@/, "survey-cli was listed as a SurveyJS package");

    // Only the version line matters here: the skill body legitimately says
    // `npx survey-cli@latest init-agents` as the instruction for re-running after an upgrade.
    const skill = readFileSync(join(root, ".claude", "skills", "surveyjs-form-json", "SKILL.md"), "utf8");
    const versionLine = skill.match(/^> Installed in this project:.*$/m)?.[0];
    assert.equal(versionLine, "> Installed in this project: `survey-core@3.0.1`, `survey-react-ui@3.0.1`. UI framework: **react**.");

    const manifest = JSON.parse(readFileSync(join(root, ".surveyjs-skills.json"), "utf8"));
    assert.deepEqual(Object.keys(manifest.packages), ["survey-core", "survey-react-ui"]);
  });

  it("writes the full skill set for a project that has survey-cli and no SurveyJS yet", () => {
    const root = install({}, { ".claude/settings.json": "{}" });
    const result = run(root, ["init-agents", "--yes", "--client=claude"]);

    assert.equal(result.code, 0, `a first run before installing SurveyJS failed: ${result.stderr}`);
    assert.match(result.stdout, /none detected — writing the full skill set/);
    const manifest = JSON.parse(readFileSync(join(root, ".surveyjs-skills.json"), "utf8"));
    assert.equal(manifest.skills.length, 8);
    assert.deepEqual(manifest.packages, {});
  });

  it("writes the full skill set rather than failing when no skill claims the packages", () => {
    const root = install({ "survey-knockout-ui": "1.9.0" }, { ".claude/settings.json": "{}" });
    const result = run(root, ["init-agents", "--yes", "--client=claude"]);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(JSON.parse(readFileSync(join(root, ".surveyjs-skills.json"), "utf8")).skills.length > 0);
  });
});
