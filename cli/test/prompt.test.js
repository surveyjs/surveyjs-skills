import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { after, describe, it } from "node:test";

import { runInitAgents } from "../src/commands/init-agents.js";
import { confirm, isInteractive, selectClients } from "../src/ui/prompt.js";
import { cleanup, exists, SKILLS_ROOT, useFixture } from "./helpers.js";

after(cleanup);

/** A readline-compatible stdin/stdout pair that claims to be a TTY. */
function fakeTty(answer) {
  const input = new PassThrough();
  const output = new PassThrough();
  input.isTTY = true;
  output.isTTY = true;
  output.resume();
  setImmediate(() => input.write(`${answer}\n`));
  return { input, output };
}

const OPTIONS = [
  { id: "claude", label: "Claude Code", detected: true },
  { id: "cursor", label: "Cursor", detected: false },
  { id: "copilot", label: "GitHub Copilot", detected: false },
  { id: "agents-md", label: "AGENTS.md agents", detected: false }
];

describe("ui/prompt", () => {
  it("treats a non-TTY stdin as non-interactive", () => {
    assert.equal(isInteractive({ input: new PassThrough(), output: new PassThrough() }), false);
  });

  it("keeps the preselection on an empty answer", async () => {
    const chosen = await selectClients({ options: OPTIONS, preselected: ["claude"], io: fakeTty("") });
    assert.deepEqual(chosen, ["claude"]);
  });

  it("parses numbers and ignores out-of-range entries", async () => {
    assert.deepEqual(
      await selectClients({ options: OPTIONS, preselected: [], io: fakeTty("2, 4, 9") }),
      ["cursor", "agents-md"]
    );
  });

  it("understands 'all'", async () => {
    assert.deepEqual(
      await selectClients({ options: OPTIONS, preselected: [], io: fakeTty("all") }),
      ["claude", "cursor", "copilot", "agents-md"]
    );
  });

  it("confirms with a default", async () => {
    assert.equal(await confirm("ok?", { defaultValue: true, io: fakeTty("") }), true);
    assert.equal(await confirm("ok?", { defaultValue: true, io: fakeTty("n") }), false);
    assert.equal(await confirm("ok?", { defaultValue: false, io: fakeTty("yes") }), true);
  });
});

describe("init-agents interactivity", () => {
  it("asks which clients to use when stdin is a TTY and --yes is absent", async () => {
    const root = useFixture("react-survey-core");
    const streams = { out: { text: "", write: (c) => ((streams.out.text += c), true) }, err: { write: () => true } };
    const result = await runInitAgents({
      root,
      flags: {},
      out: streams.out,
      err: streams.err,
      io: fakeTty("3"),
      skillsRoot: SKILLS_ROOT
    });

    assert.equal(result.code, 0);
    assert.deepEqual(result.clients, ["copilot"], "the answer did not override the detected clients");
    assert.ok(exists(root, ".github/skills/surveyjs-form-json/SKILL.md"));
    assert.ok(!exists(root, ".claude/skills/surveyjs-form-json"));
  });

  it("does not prompt with --yes, even on a TTY", async () => {
    const root = useFixture("react-survey-core");
    const out = { text: "", write: (c) => ((out.text += c), true) };
    const result = await runInitAgents({
      root,
      flags: { yes: true },
      out,
      err: { write: () => true },
      io: fakeTty("3"),
      skillsRoot: SKILLS_ROOT
    });

    assert.equal(result.code, 0);
    assert.deepEqual(result.clients, ["claude", "cursor"]);
    assert.doesNotMatch(out.text, /Which AI clients/);
  });
});
