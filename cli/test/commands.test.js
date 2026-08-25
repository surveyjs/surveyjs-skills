import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";

import { runDoctor } from "../src/commands/doctor.js";
import { runInitAgents } from "../src/commands/init-agents.js";
import { runUpdate } from "../src/commands/update.js";
import { captureStreams, cleanup, exists, listFiles, read, SKILLS_ROOT, useFixture } from "./helpers.js";

after(cleanup);

async function init(root, flags) {
  const streams = captureStreams();
  const result = await runInitAgents({ root, flags: { yes: true, ...flags }, ...streams, skillsRoot: SKILLS_ROOT });
  return { ...result, ...streams };
}

describe("init-agents flags", () => {
  it("--dry-run touches nothing", async () => {
    const root = useFixture("react-survey-core");
    const before = listFiles(root);
    const result = await init(root, { dryRun: true });

    assert.equal(result.code, 0);
    assert.ok(result.written.length > 0, "dry run reported no planned writes");
    assert.deepEqual(listFiles(root), before);
    assert.match(result.out.text, /Dry run/);
  });

  it("--all writes every target and --client narrows to one", async () => {
    const all = await init(useFixture("empty-project"), { all: true });
    assert.deepEqual(all.clients, ["claude", "cursor", "copilot", "agents-md"]);

    const one = await init(useFixture("empty-project"), { client: ["cursor"] });
    assert.deepEqual(one.clients, ["cursor"]);
    assert.ok(one.written.every((rel) => rel.startsWith(".cursor/") || rel === ".surveyjs-skills.json"));
  });

  it("rejects an unknown --client", async () => {
    const result = await init(useFixture("empty-project"), { client: ["windsurf"] });
    assert.equal(result.code, 1);
    assert.match(result.err.text, /Unknown client/);
    assert.match(result.err.text, /windsurf/);
  });

  it("refuses to overwrite a file it did not write, unless --force", async () => {
    const root = useFixture("react-survey-core");
    const target = join(root, ".claude", "skills", "surveyjs-form-json", "SKILL.md");
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, "hand-written, do not clobber\n", "utf8");

    const refused = await init(root, {});
    assert.equal(refused.code, 1);
    assert.match(refused.err.text, /Refusing to overwrite/);
    assert.equal(readFileSync(target, "utf8"), "hand-written, do not clobber\n");
    assert.ok(!exists(root, ".surveyjs-skills.json"), "a refused run still wrote a manifest");

    const forced = await init(root, { force: true });
    assert.equal(forced.code, 0);
    assert.match(readFileSync(target, "utf8"), /surveyjs:pinned:start/);
  });

  it("re-pins versions when the installed SurveyJS version changes", async () => {
    const root = useFixture("react-survey-core");
    await init(root, {});
    const skillPath = ".claude/skills/surveyjs-form-json/SKILL.md";
    assert.match(read(root, skillPath), /survey-core@3\.0\.1/);

    const lock = join(root, "package-lock.json");
    writeFileSync(lock, readFileSync(lock, "utf8").replaceAll('"version": "3.0.1"', '"version": "3.0.0"'), "utf8");

    const second = await init(root, {});
    assert.equal(second.code, 0);
    assert.match(read(root, skillPath), /survey-core@3\.0\.0/);
    assert.doesNotMatch(read(root, skillPath), /survey-core@3\.0\.1/);
    assert.deepEqual(JSON.parse(read(root, ".surveyjs-skills.json")).packages["survey-core"], {
      version: "3.0.0",
      range: "^3.0.1",
      source: "lockfile"
    });
  });
});

describe("init-agents cleanup", () => {
  it("removes files and marker blocks that no longer apply", async () => {
    const root = useFixture("agents-md-existing");
    const original = read(root, "AGENTS.md");

    const wide = await init(root, { all: true });
    assert.equal(wide.code, 0);
    assert.ok(exists(root, ".cursor/skills/surveyjs-dashboard/SKILL.md"));
    assert.ok(exists(root, ".github/copilot-instructions.md"));
    assert.match(read(root, "AGENTS.md"), /surveyjs:start/);

    const narrow = await init(root, { client: ["claude"] });
    assert.equal(narrow.code, 0);

    assert.ok(!exists(root, ".cursor/skills/surveyjs-dashboard/SKILL.md"), "cursor skills survived");
    assert.ok(!exists(root, ".cursor"), "an empty .cursor directory was left behind");
    assert.ok(!exists(root, ".agents"), "an empty .agents directory was left behind");
    assert.ok(exists(root, ".claude/skills/surveyjs-dashboard/SKILL.md"), "claude skills were removed");

    assert.equal(read(root, "AGENTS.md"), original, "the AGENTS.md block was not cleanly removed");
    assert.ok(
      !exists(root, ".github/copilot-instructions.md"),
      "a copilot-instructions.md that held nothing but our block was left behind empty"
    );
    assert.ok(!exists(root, ".github"), "an empty .github directory was left behind");

    const manifest = JSON.parse(read(root, ".surveyjs-skills.json"));
    assert.deepEqual(manifest.clients, ["claude"]);
    assert.deepEqual(manifest.blocks, []);
  });

  it("keeps a pre-existing instructions file when its block is dropped", async () => {
    const root = useFixture("angular-survey-creator");
    const original = read(root, ".github/copilot-instructions.md");

    await init(root, { client: ["copilot"] });
    assert.match(read(root, ".github/copilot-instructions.md"), /surveyjs:start/);

    await init(root, { client: ["claude"] });
    assert.equal(read(root, ".github/copilot-instructions.md"), original);
    assert.ok(!exists(root, ".github/skills"), "copilot skill directories survived");
  });

  it("drops a skill whose package was uninstalled", async () => {
    const root = useFixture("agents-md-existing");
    await init(root, { client: ["claude"] });
    assert.ok(exists(root, ".claude/skills/surveyjs-dashboard/SKILL.md"));

    for (const file of ["package.json", "package-lock.json"]) {
      const path = join(root, file);
      const data = JSON.parse(readFileSync(path, "utf8"));
      if (data.dependencies) delete data.dependencies["survey-analytics"];
      if (data.packages) delete data.packages["node_modules/survey-analytics"];
      writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    }

    const second = await init(root, { client: ["claude"] });
    assert.equal(second.code, 0);
    assert.ok(!exists(root, ".claude/skills/surveyjs-dashboard"), "the dashboard skill was not cleaned up");
    assert.ok(exists(root, ".claude/skills/surveyjs-integration/SKILL.md"));
  });
});

describe("doctor", () => {
  it("fails when there is no manifest", () => {
    const streams = captureStreams();
    const result = runDoctor({ root: useFixture("empty-project"), ...streams });
    assert.equal(result.code, 1);
    assert.deepEqual(result.issues, ["missing-manifest"]);
  });

  it("reports a clean install as up to date", async () => {
    const root = useFixture("react-survey-core");
    await init(root, {});
    const streams = captureStreams();
    const result = runDoctor({ root, ...streams });
    assert.equal(result.code, 0);
    assert.deepEqual(result.issues, []);
    assert.match(streams.out.text, /Up to date/);
  });

  it("reports upgraded, added, and removed packages", async () => {
    const root = useFixture("react-survey-core");
    await init(root, {});

    const packageJson = join(root, "package.json");
    const data = JSON.parse(readFileSync(packageJson, "utf8"));
    data.dependencies["survey-core"] = "3.0.0";
    delete data.dependencies["survey-react-ui"];
    data.dependencies["survey-pdf"] = "3.0.1";
    writeFileSync(packageJson, JSON.stringify(data, null, 2), "utf8");
    writeFileSync(join(root, "package-lock.json"), "{}", "utf8");

    const streams = captureStreams();
    const result = runDoctor({ root, ...streams });
    assert.equal(result.code, 1);
    assert.ok(result.issues.includes("changed:survey-core"));
    assert.ok(result.issues.includes("removed:survey-react-ui"));
    assert.ok(result.issues.includes("added:survey-pdf"));
    assert.match(streams.out.text, /survey-core 3\.0\.1 -> 3\.0\.0/);
  });

  it("warns without failing when a version cannot be verified", async () => {
    const root = useFixture("ranges-no-lockfile");
    await init(root, { client: ["claude"] });

    const streams = captureStreams();
    const result = runDoctor({ root, ...streams });

    assert.equal(result.code, 0, "an unverifiable version failed the exit code");
    assert.deepEqual(result.issues, []);
    assert.deepEqual(result.warnings, ["unverified:survey-core", "unverified:survey-vue3-ui"]);
    assert.match(streams.out.text, /Could not verify the installed version of: survey-core, survey-vue3-ui/);
    assert.match(streams.out.text, /Lockfile: none/);
  });

  it("reads a manifest written before versions carried provenance", async () => {
    const root = useFixture("react-survey-core");
    await init(root, { client: ["claude"] });

    const path = join(root, ".surveyjs-skills.json");
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    manifest.packages = { "survey-core": "3.0.1", "survey-react-ui": "3.0.0" };
    writeFileSync(path, JSON.stringify(manifest, null, 2), "utf8");

    const streams = captureStreams();
    const result = runDoctor({ root, ...streams });
    assert.deepEqual(result.issues, ["changed:survey-react-ui"]);
    assert.match(streams.out.text, /ok {7}survey-core@3\.0\.1/);
  });

  it("reports a recorded file that is missing on disk", async () => {
    const root = useFixture("react-survey-core");
    await init(root, { client: ["claude"] });
    rmSync(join(root, ".claude", "skills", "surveyjs-form-json", "SKILL.md"));

    const streams = captureStreams();
    const result = runDoctor({ root, ...streams });
    assert.equal(result.code, 1);
    assert.ok(result.issues.includes("missing:.claude/skills/surveyjs-form-json/SKILL.md"));
  });
});

describe("update", () => {
  it("fails without a manifest", async () => {
    const streams = captureStreams();
    const result = await runUpdate({ root: useFixture("empty-project"), ...streams, skillsRoot: SKILLS_ROOT });
    assert.equal(result.code, 1);
    assert.match(streams.err.text, /init-agents/);
  });

  it("re-runs placement for the recorded clients only", async () => {
    const root = useFixture("react-survey-core");
    await init(root, { client: ["cursor"] });

    const streams = captureStreams();
    const result = await runUpdate({ root, flags: {}, ...streams, skillsRoot: SKILLS_ROOT });
    assert.equal(result.code, 0);
    assert.deepEqual(result.clients, ["cursor"]);
    assert.deepEqual(result.written, [], "an update with no changes still wrote files");
    assert.match(streams.out.text, /Updating recorded clients: cursor/);
  });

  it("restores a skill file that was deleted by hand", async () => {
    const root = useFixture("react-survey-core");
    await init(root, { client: ["claude"] });
    const rel = ".claude/skills/surveyjs-form-json/SKILL.md";
    const expected = read(root, rel);
    rmSync(join(root, ".claude", "skills", "surveyjs-form-json", "SKILL.md"));

    const streams = captureStreams();
    const result = await runUpdate({ root, flags: {}, ...streams, skillsRoot: SKILLS_ROOT });
    assert.equal(result.code, 0);
    assert.deepEqual(result.written, [rel]);
    assert.equal(read(root, rel), expected);
  });
});
