import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { CLI_ROOT, SKILLS_ROOT } from "./helpers.js";
import { loadSkills } from "../src/skills.js";
import { CLIENT_IDS } from "../src/detect/clients.js";
import { TARGET_IDS, TARGETS } from "../src/targets/index.js";

const packageJson = JSON.parse(readFileSync(join(CLI_ROOT, "package.json"), "utf8"));

describe("package.json", () => {
  it("declares no runtime dependencies", () => {
    assert.equal(packageJson.dependencies, undefined);
    assert.equal(packageJson.devDependencies, undefined);
    assert.equal(packageJson.optionalDependencies, undefined);
    assert.equal(packageJson.peerDependencies, undefined);
  });

  it("declares no install lifecycle script", () => {
    for (const hook of ["preinstall", "install", "postinstall"]) {
      assert.equal(packageJson.scripts?.[hook], undefined, `${hook} script is present`);
    }
  });

  it("ships the generated skills directory and a prepack that produces it", () => {
    assert.ok(packageJson.files.includes("skills"));
    assert.equal(packageJson.scripts.prepack, "node scripts/prepack-skills.js");
    assert.ok(existsSync(join(CLI_ROOT, "scripts", "prepack-skills.js")));
  });

  it("is named surveyjs-cli, exposes the surveyjs-cli bin, and floors Node at an LTS release", () => {
    assert.equal(packageJson.name, "surveyjs-cli");
    assert.deepEqual(packageJson.bin, { "surveyjs-cli": "./bin/surveyjs-cli.js" });
    assert.match(packageJson.engines.node, /^>=(2[2-9]|[3-9]\d)\./);
  });
});

describe("source", () => {
  const files = [
    "bin/surveyjs-cli.js",
    "src/commands/init-agents.js",
    "src/commands/doctor.js",
    "src/commands/update.js",
    "src/detect/project.js",
    "src/detect/clients.js",
    "src/targets/claude.js",
    "src/targets/cursor.js",
    "src/targets/copilot.js",
    "src/targets/agents-md.js",
    "src/fs/write.js",
    "src/fs/markers.js",
    "src/ui/prompt.js",
    "src/skills.js",
    "src/content.js",
    "src/manifest.js"
  ];

  it("imports only Node built-ins", () => {
    for (const rel of files) {
      const source = readFileSync(join(CLI_ROOT, ...rel.split("/")), "utf8");
      for (const match of source.matchAll(/^import[\s\S]*?from "([^"]+)";$/gm)) {
        const specifier = match[1];
        assert.ok(
          specifier.startsWith("node:") || specifier.startsWith("."),
          `${rel} imports a third-party module: ${specifier}`
        );
      }
    }
  });

  it("makes no network calls", () => {
    for (const rel of files) {
      const source = readFileSync(join(CLI_ROOT, ...rel.split("/")), "utf8");
      assert.doesNotMatch(source, /\bfetch\s*\(|node:https?|require\("https?"\)/, `${rel} looks like it calls out`);
    }
  });
});

describe("targets", () => {
  it("has one target per known client id", () => {
    assert.deepEqual([...TARGET_IDS].sort(), [...CLIENT_IDS].sort());
  });

  it("documents the source for every target's paths", () => {
    for (const target of TARGETS) {
      assert.match(target.source, /^https:\/\//, `${target.id} has no documentation source`);
      assert.ok(target.skillsDir.length > 0);
    }
  });
});

describe("skill content", () => {
  it("resolves the packaged skill set from the repository checkout", () => {
    const skills = loadSkills(SKILLS_ROOT);
    assert.deepEqual(
      skills.map((skill) => skill.name),
      [
        "surveyjs-brand-styling",
        "surveyjs-creator-customization",
        "surveyjs-dashboard",
        "surveyjs-form-json",
        "surveyjs-integration",
        "surveyjs-pdf-generator",
        "surveyjs-response-extractor"
      ]
    );
    for (const skill of skills) assert.ok(skill.files.includes("SKILL.md"));
  });
});
