import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasBlock, removeBlock, renderBlock, upsertBlock } from "../src/fs/markers.js";

describe("marker blocks", () => {
  it("appends a block to a file that has none, keeping the original text", () => {
    const original = "# Guide\n\nBuild with npm run build.\n";
    const { text, action } = upsertBlock(original, "BODY");
    assert.equal(action, "inserted");
    assert.equal(text, original + "\n" + renderBlock("BODY") + "\n");
    assert.ok(text.startsWith(original));
  });

  it("creates a block-only file from empty text", () => {
    assert.deepEqual(upsertBlock("", "BODY"), { text: renderBlock("BODY") + "\n", action: "inserted" });
  });

  it("replaces in place without touching text before or after", () => {
    const original = "intro\n\n" + renderBlock("OLD") + "\n\noutro\n";
    const { text, action } = upsertBlock(original, "NEW");
    assert.equal(action, "replaced");
    assert.equal(text, "intro\n\n" + renderBlock("NEW") + "\n\noutro\n");
  });

  it("reports an identical rewrite as unchanged", () => {
    const original = "intro\n\n" + renderBlock("BODY") + "\n";
    assert.deepEqual(upsertBlock(original, "BODY"), { text: original, action: "unchanged" });
  });

  it("removes a block and the blank lines it added", () => {
    const original = "# Guide\n\nBuild with npm run build.\n";
    const withBlock = upsertBlock(original, "BODY").text;
    assert.ok(hasBlock(withBlock));
    assert.deepEqual(removeBlock(withBlock), { text: original, action: "removed" });
  });

  it("removes a block from the middle without collapsing the rest", () => {
    const { text } = removeBlock("intro\n\n" + renderBlock("BODY") + "\n\noutro\n");
    assert.equal(text, "intro\n\noutro\n");
  });

  it("leaves text with no block alone", () => {
    assert.deepEqual(removeBlock("plain\n"), { text: "plain\n", action: "unchanged" });
  });
});
