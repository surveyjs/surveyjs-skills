import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { after, describe, it } from "node:test";

import { CLI_ROOT, cleanup, listFiles, useFixture } from "./helpers.js";

after(cleanup);

const BIN = join(CLI_ROOT, "bin", "surveyjs-cli.js");

function run(args, { cwd = CLI_ROOT } = {}) {
  try {
    const stdout = execFileSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8", stdio: "pipe" });
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

describe("bin/surveyjs-cli.js", () => {
  it("prints the package version", () => {
    const expected = JSON.parse(readFileSync(join(CLI_ROOT, "package.json"), "utf8")).version;
    assert.deepEqual(run(["--version"]), { code: 0, stdout: `${expected}\n`, stderr: "" });
  });

  it("prints usage with --help and exits 0", () => {
    const result = run(["--help"]);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /surveyjs-cli <command> \[options\]/);
    assert.match(result.stdout, /no telemetry/);
  });

  it("exits 2 with usage when given no command", () => {
    assert.equal(run([]).code, 2);
  });

  it("exits 2 on an unknown command or option", () => {
    assert.equal(run(["nope"]).code, 2);
    assert.equal(run(["init-agents", "--nope"]).code, 2);
  });

  it("runs init-agents end to end in a non-TTY process without --yes", () => {
    const root = useFixture("react-survey-core");
    const result = run(["init-agents"], { cwd: root });

    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /survey-core@3\.0\.1/);
    assert.match(result.stdout, /Commit these files/);
    assert.ok(existsSync(join(root, ".surveyjs-skills.json")));
    assert.ok(existsSync(join(root, ".claude", "skills", "surveyjs-form-json", "SKILL.md")));

    const before = listFiles(root);
    assert.equal(run(["doctor"], { cwd: root }).code, 0);
    assert.equal(run(["update"], { cwd: root }).code, 0);
    assert.deepEqual(listFiles(root), before);
  });
});
