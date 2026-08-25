// Marker block handling for files this CLI does not own (AGENTS.md, Copilot instruction
// files). Everything between the markers is regenerated; everything outside them is left
// byte-for-byte alone.

export const BLOCK_START = "<!-- surveyjs:start -->";
export const BLOCK_END = "<!-- surveyjs:end -->";

const BLOCK_PATTERN = /<!-- surveyjs:start -->[\s\S]*?<!-- surveyjs:end -->/;
const BLOCK_WITH_PADDING = /(\n*)<!-- surveyjs:start -->[\s\S]*?<!-- surveyjs:end -->(\n*)/;

/** Wrap a body in the surveyjs markers. */
export function renderBlock(body) {
  return `${BLOCK_START}\n${String(body).trim()}\n${BLOCK_END}`;
}

/** True when the text already carries a surveyjs block. */
export function hasBlock(text) {
  return BLOCK_PATTERN.test(text ?? "");
}

/**
 * Insert the block, or replace an existing one in place.
 * @returns {{ text: string, action: "inserted" | "replaced" | "unchanged" }}
 */
export function upsertBlock(text, body) {
  const original = text ?? "";
  const block = renderBlock(body);

  if (BLOCK_PATTERN.test(original)) {
    const next = original.replace(BLOCK_PATTERN, () => block);
    return { text: next, action: next === original ? "unchanged" : "replaced" };
  }

  if (original.trim() === "") return { text: `${block}\n`, action: "inserted" };

  const separator = original.endsWith("\n\n") ? "" : original.endsWith("\n") ? "\n" : "\n\n";
  return { text: `${original}${separator}${block}\n`, action: "inserted" };
}

/**
 * Drop the block and the blank lines it introduced, leaving the surrounding text intact.
 * @returns {{ text: string, action: "removed" | "unchanged" }}
 */
export function removeBlock(text) {
  const original = text ?? "";
  const match = original.match(BLOCK_WITH_PADDING);
  if (!match) return { text: original, action: "unchanged" };

  const before = original.slice(0, match.index);
  const after = original.slice(match.index + match[0].length);

  let next;
  if (before.trim() === "") next = after.replace(/^\n+/, "");
  else if (after.trim() === "") next = `${before.replace(/\n+$/, "")}\n`;
  else next = `${before.replace(/\n+$/, "")}\n\n${after.replace(/^\n+/, "")}`;

  return { text: next, action: "removed" };
}
