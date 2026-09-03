import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { runInitAgents } from "../src/commands/init-agents.js";
import { detectClients } from "../src/detect/clients.js";
import { detectProject } from "../src/detect/project.js";
import { captureStreams, cleanup, listFiles, matchGolden, read, SKILLS_ROOT, useFixture } from "./helpers.js";

after(cleanup);

/** Run init-agents twice and snapshot the first run plus proof the second changed nothing. */
async function runTwice(root, flags = {}) {
  const first = captureStreams();
  const one = await runInitAgents({ root, flags: { yes: true, ...flags }, ...first, skillsRoot: SKILLS_ROOT });
  const treeAfterFirst = listFiles(root);
  const contentsAfterFirst = Object.fromEntries(treeAfterFirst.map((rel) => [rel, read(root, rel)]));

  const second = captureStreams();
  const two = await runInitAgents({ root, flags: { yes: true, ...flags }, ...second, skillsRoot: SKILLS_ROOT });
  const treeAfterSecond = listFiles(root);
  const contentsAfterSecond = Object.fromEntries(treeAfterSecond.map((rel) => [rel, read(root, rel)]));

  return { one, two, first, second, treeAfterFirst, contentsAfterFirst, treeAfterSecond, contentsAfterSecond };
}

function snapshot(root, run, blockFiles = []) {
  const project = detectProject(root);
  return {
    detected: {
      packages: project.packages,
      framework: project.framework,
      lockfile: project.lockfile,
      clients: detectClients(root).detected
    },
    clients: run.one.clients,
    skills: run.one.skills,
    written: run.one.written,
    tree: run.treeAfterFirst,
    blocks: Object.fromEntries(blockFiles.map((rel) => [rel, run.contentsAfterFirst[rel]]))
  };
}

describe("init-agents golden fixtures", () => {
  it("react + survey-core writes the form/integration/styling skills for Claude Code and Cursor", async () => {
    const root = useFixture("react-survey-core");
    const run = await runTwice(root);

    assert.equal(run.one.code, 0);
    assert.deepEqual(run.one.clients, ["claude", "cursor"]);
    assert.deepEqual(run.one.skills, ["surveyjs-brand-styling", "surveyjs-form-json", "surveyjs-integration"]);

    matchGolden("react-survey-core", snapshot(root, run), assert);

    assert.deepEqual(run.treeAfterSecond, run.treeAfterFirst, "second run changed the file set");
    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst, "second run changed file contents");
    assert.deepEqual(run.two.written, [], "second run wrote files");
    assert.deepEqual(run.two.removed, [], "second run removed files");
  });

  it("angular + survey-creator-core writes Copilot skills and a copilot-instructions block", async () => {
    const root = useFixture("angular-survey-creator");
    const run = await runTwice(root);

    assert.equal(run.one.code, 0);
    assert.deepEqual(run.one.clients, ["copilot"]);
    assert.deepEqual(run.one.skills, [
      "surveyjs-brand-styling",
      "surveyjs-creator-customization",
      "surveyjs-creator-presets",
      "surveyjs-form-json",
      "surveyjs-integration"
    ]);

    matchGolden("angular-survey-creator", snapshot(root, run, [".github/copilot-instructions.md"]), assert);

    const instructions = run.contentsAfterFirst[".github/copilot-instructions.md"];
    assert.match(instructions, /^# Repository instructions/, "pre-existing content was rewritten");
    assert.match(instructions, /Run `pnpm test` before proposing a change\./);
    assert.match(instructions, /<!-- surveyjs:start -->[\s\S]*<!-- surveyjs:end -->/);

    assert.deepEqual(run.treeAfterSecond, run.treeAfterFirst);
    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst);
    assert.deepEqual(run.two.written, []);
  });

  it("survey-pdf only, with no client markers, falls back to the AGENTS.md target", async () => {
    const root = useFixture("pdf-only");
    const run = await runTwice(root);

    assert.equal(run.one.code, 0);
    assert.deepEqual(run.one.clients, ["agents-md"]);
    assert.deepEqual(run.one.skills, ["surveyjs-form-json", "surveyjs-pdf-generator"]);

    matchGolden("pdf-only", snapshot(root, run, ["AGENTS.md"]), assert);

    assert.deepEqual(run.treeAfterSecond, run.treeAfterFirst);
    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst);
    assert.deepEqual(run.two.written, []);
  });

  it("an empty project gets the full skill set", async () => {
    const root = useFixture("empty-project");
    const run = await runTwice(root, { all: true });

    assert.equal(run.one.code, 0);
    assert.deepEqual(run.one.clients, ["claude", "cursor", "copilot", "agents-md"]);
    assert.deepEqual(run.one.skills, [
      "surveyjs-brand-styling",
      "surveyjs-creator-customization",
      "surveyjs-creator-presets",
      "surveyjs-dashboard",
      "surveyjs-form-json",
      "surveyjs-integration",
      "surveyjs-pdf-generator",
      "surveyjs-response-extractor"
    ]);

    matchGolden("empty-project", snapshot(root, run, ["AGENTS.md", ".github/copilot-instructions.md"]), assert);

    assert.deepEqual(run.treeAfterSecond, run.treeAfterFirst);
    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst);
    assert.deepEqual(run.two.written, []);
  });

  it("a renderer-only Creator install still gets the form, integration, and styling skills", async () => {
    const root = useFixture("creator-react-only");
    const run = await runTwice(root);

    assert.equal(run.one.code, 0);
    assert.deepEqual(run.one.clients, ["claude"]);
    // survey-core, survey-creator-core, and survey-react-ui are transitive here: package.json
    // declares survey-creator-react alone, which is what the Creator setup docs tell people to do.
    assert.deepEqual(run.one.skills, [
      "surveyjs-brand-styling",
      "surveyjs-creator-customization",
      "surveyjs-creator-presets",
      "surveyjs-form-json",
      "surveyjs-integration"
    ]);

    const pinned = run.contentsAfterFirst[".claude/skills/surveyjs-form-json/SKILL.md"];
    assert.match(pinned, /`survey-core@3\.0\.1`/, "the transitive core version was not pinned");
    assert.match(pinned, /`survey-creator-react@3\.0\.1`/);

    matchGolden("creator-react-only", snapshot(root, run), assert);

    assert.deepEqual(run.treeAfterSecond, run.treeAfterFirst);
    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst);
    assert.deepEqual(run.two.written, []);
  });

  it("a bun.lock project resolves exact versions out of the text lockfile", async () => {
    const root = useFixture("bun-project");
    const run = await runTwice(root);

    assert.equal(run.one.code, 0);
    const project = detectProject(root);
    assert.equal(project.lockfile, "bun.lock");
    assert.equal(project.lockfileParsed, true);
    assert.equal(project.packages["survey-core"].source, "lockfile");
    assert.equal(project.packages["survey-core"].version, "3.0.1");

    assert.match(run.contentsAfterFirst["AGENTS.md"], /Installed in this project: `survey-core@3\.0\.1`/);

    matchGolden("bun-project", snapshot(root, run, ["AGENTS.md"]), assert);

    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst);
    assert.deepEqual(run.two.written, []);
  });

  it("declared ranges with no lockfile are written as ranges, not as versions", async () => {
    const root = useFixture("ranges-no-lockfile");
    const run = await runTwice(root);

    assert.equal(run.one.code, 0);
    const project = detectProject(root);
    assert.equal(project.lockfile, null);
    assert.equal(project.packages["survey-core"].version, null, "a caret range was treated as a version");
    assert.equal(project.packages["survey-vue3-ui"].version, null);
    // "3.0.1" with no range operator is an exact pin, and that one IS verified.
    assert.equal(project.packages["survey-pdf"].version, "3.0.1");
    assert.equal(project.packages["survey-pdf"].source, "package.json");

    const agents = run.contentsAfterFirst["AGENTS.md"];
    assert.match(agents, /Installed in this project: `survey-pdf@3\.0\.1`\./);
    assert.match(agents, /Also declared: `survey-core@\^3\.0\.1`, `survey-vue3-ui@\^3\.0\.1`/);
    assert.match(agents, /exact installed version could not be verified/);
    assert.doesNotMatch(agents, /`survey-core@3\.0\.1`/, "a range was rendered as an exact version");

    matchGolden("ranges-no-lockfile", snapshot(root, run, ["AGENTS.md"]), assert);

    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst);
    assert.deepEqual(run.two.written, []);
  });

  it("a pre-existing AGENTS.md keeps every line outside the markers", async () => {
    const root = useFixture("agents-md-existing");
    const before = read(root, "AGENTS.md");
    const run = await runTwice(root);

    assert.equal(run.one.code, 0);
    assert.deepEqual(run.one.clients, ["agents-md"]);
    assert.deepEqual(run.one.skills, [
      "surveyjs-brand-styling",
      "surveyjs-dashboard",
      "surveyjs-form-json",
      "surveyjs-integration"
    ]);

    const after = run.contentsAfterFirst["AGENTS.md"];
    const [preserved] = after.split("<!-- surveyjs:start -->");
    assert.equal(preserved, `${before}\n`, "text before the block is not the original file");
    assert.ok(after.endsWith("<!-- surveyjs:end -->\n"), "the block is not the tail of the file");

    matchGolden("agents-md-existing", snapshot(root, run, ["AGENTS.md"]), assert);

    assert.deepEqual(run.treeAfterSecond, run.treeAfterFirst);
    assert.deepEqual(run.contentsAfterSecond, run.contentsAfterFirst);
    assert.deepEqual(run.two.written, []);
  });
});
