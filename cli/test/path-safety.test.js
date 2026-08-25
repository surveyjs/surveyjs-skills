// A cloned repository can carry a hostile .surveyjs-skills.json. Nothing in it may reach
// outside the project root, and running init-agents in such a repository must be inert.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { after, describe, it } from "node:test";

import { runInitAgents } from "../src/commands/init-agents.js";
import { isInside, resolveInside } from "../src/fs/write.js";
import { captureStreams, SKILLS_ROOT } from "./helpers.js";

const sandboxes = [];
after(() => {
  while (sandboxes.length > 0) rmSync(sandboxes.pop(), { recursive: true, force: true });
});

/** A project directory with a sibling file that must never be touched. */
function sandbox(manifest) {
  const box = mkdtempSync(join(tmpdir(), "survey-cli-safety-"));
  sandboxes.push(box);
  const root = join(box, "project");
  mkdirSync(root, { recursive: true });
  writeFileSync(join(box, "sibling.txt"), "PRECIOUS\n", "utf8");
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "p", dependencies: { "survey-pdf": "3.0.1" } }),
    "utf8"
  );
  writeFileSync(join(root, ".surveyjs-skills.json"), JSON.stringify(manifest), "utf8");
  return { box, root };
}

/**
 * Paths a manifest must never be able to act on, on any platform.
 *
 * `..\sibling.txt` and `C:/Windows/system.ini` are the interesting pair: each escapes on
 * Windows and is a merely odd filename on POSIX. resolveInside refuses both everywhere so
 * one manifest cannot mean two things on two machines — asserting that here is the point.
 */
const ESCAPES = [
  "../sibling.txt",
  "../../sibling.txt",
  "nested/../../sibling.txt",
  "/etc/passwd",
  "C:/Windows/system.ini",
  "..\\sibling.txt",
  "nested\\..\\..\\sibling.txt",
  "..",
  ""
];

describe("resolveInside", () => {
  const root = resolve(sep, "projects", "app");

  it("resolves an ordinary relative path", () => {
    assert.equal(resolveInside(root, ".claude/skills/x/SKILL.md"), join(root, ".claude", "skills", "x", "SKILL.md"));
  });

  it("refuses anything that leaves the root", () => {
    for (const rel of ESCAPES) {
      assert.equal(resolveInside(root, rel), null, `accepted ${JSON.stringify(rel)}`);
    }
  });

  it("refuses the root itself and non-strings", () => {
    assert.equal(resolveInside(root, "."), null);
    assert.equal(resolveInside(root, undefined), null);
    assert.equal(resolveInside(root, 42), null);
  });

  it("does not mistake a sibling directory with a shared prefix for a child", () => {
    assert.equal(isInside(root, `${root}-backup`), false);
    assert.equal(isInside(root, join(root, "child")), true);
    assert.equal(isInside(root, root), true);
  });
});

describe("hostile manifest", () => {
  it("never deletes a file outside the project root", async () => {
    for (const escape of ESCAPES) {
      const { box, root } = sandbox({
        cliVersion: "0.1.0",
        clients: ["agents-md"],
        packages: {},
        skills: [],
        files: [escape],
        blocks: []
      });

      const streams = captureStreams();
      const result = await runInitAgents({
        root,
        flags: { yes: true, client: ["agents-md"] },
        ...streams,
        skillsRoot: SKILLS_ROOT
      });

      assert.equal(result.code, 0, `run failed for ${JSON.stringify(escape)}`);
      assert.ok(existsSync(join(box, "sibling.txt")), `${JSON.stringify(escape)} deleted a file outside the project`);
      assert.match(streams.err.text, /point outside this project/, `no warning for ${JSON.stringify(escape)}`);
      assert.ok(!result.removed.includes(escape), "an out-of-root path was reported as removed");
    }
  });

  it("never rewrites a marker-block file outside the project root", async () => {
    const { box, root } = sandbox({
      cliVersion: "0.1.0",
      clients: ["agents-md"],
      packages: {},
      skills: [],
      files: [],
      blocks: ["../sibling.txt"]
    });
    writeFileSync(join(box, "sibling.txt"), "<!-- surveyjs:start -->\nold\n<!-- surveyjs:end -->\n", "utf8");

    const streams = captureStreams();
    await runInitAgents({
      root,
      flags: { yes: true, client: ["claude"] },
      ...streams,
      skillsRoot: SKILLS_ROOT
    });

    assert.equal(
      readText(join(box, "sibling.txt")),
      "<!-- surveyjs:start -->\nold\n<!-- surveyjs:end -->\n",
      "a file outside the project root was rewritten"
    );
    assert.match(streams.err.text, /point outside this project/);
  });

  it("still writes the legitimate part of the run", async () => {
    const { root } = sandbox({
      cliVersion: "0.1.0",
      clients: ["agents-md"],
      packages: {},
      skills: [],
      files: ["../sibling.txt", ".agents/skills/stale/SKILL.md"],
      blocks: []
    });

    const streams = captureStreams();
    const result = await runInitAgents({
      root,
      flags: { yes: true, client: ["agents-md"] },
      ...streams,
      skillsRoot: SKILLS_ROOT
    });

    assert.equal(result.code, 0);
    assert.ok(existsSync(join(root, ".agents", "skills", "surveyjs-pdf-generator", "SKILL.md")));
  });
});

function readText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}
