// Plan / analyze / commit. Nothing touches disk until commit(), so --dry-run and the
// conflict check both work off the same fully-built plan.
//
// Every path that reaches the filesystem goes through resolveInside() first. Paths in the
// plan are ours, but paths in .surveyjs-skills.json are repository data: running this CLI in
// a cloned repository must never let that file's contents reach outside the project root.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { removeBlock, upsertBlock } from "./markers.js";

export const fromPosix = (value) => value.split("/").join(sep);

export function readIfExists(absolute) {
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : null;
}

/** True when `absolute` is `root` itself or lives under it. */
export function isInside(root, absolute) {
  const step = relative(root, absolute);
  return step === "" || (!step.startsWith(`..${sep}`) && step !== ".." && !isAbsolute(step));
}

/**
 * Absolute path for a posix-relative path inside `root`, or null when the path is absolute,
 * empty, or escapes the root. Callers must treat null as "refuse to touch this".
 */
export function resolveInside(root, rel) {
  if (typeof rel !== "string" || rel.trim() === "") return null;
  // Recorded paths are always posix. A backslash is therefore never something this CLI
  // wrote, and its meaning is platform-dependent: `..\x` escapes the root on Windows but is
  // an ordinary filename on Linux. Rejecting it everywhere keeps one manifest from behaving
  // differently on two machines, and costs nothing, since no legitimate entry contains one.
  if (rel.includes("\\")) return null;
  // A Windows drive letter is not absolute on POSIX, so isAbsolute alone would let it past.
  if (isAbsolute(rel) || /^[A-Za-z]:/.test(rel)) return null;
  const absolute = resolve(root, fromPosix(rel));
  if (absolute === resolve(root)) return null;
  return isInside(root, absolute) ? absolute : null;
}

/** Collects the files and marker blocks a run intends to produce. */
export function createPlan() {
  const files = new Map();
  const blocks = new Map();
  return {
    /** @param {string} rel posix-relative path inside the project root */
    file(rel, content) {
      files.set(rel, { rel, content });
    },
    block(rel, body) {
      blocks.set(rel, { rel, body });
    },
    get files() {
      return [...files.values()].sort((a, b) => a.rel.localeCompare(b.rel));
    },
    get blocks() {
      return [...blocks.values()].sort((a, b) => a.rel.localeCompare(b.rel));
    }
  };
}

/**
 * Compare the plan against what is on disk and against the previous run's manifest.
 *
 * A file that already exists, differs from the plan, and was not written by a previous run
 * is a conflict: it belongs to someone else and needs --force before we overwrite it.
 *
 * A recorded path that escapes the project root is dropped into `analysis.rejected` and never
 * touched. A planned path that escapes is a bug in this CLI, so it throws.
 */
export function analyzePlan({ root, plan, previousFiles = [], previousBlocks = [], force = false }) {
  const known = new Set(previousFiles);
  const analysis = {
    create: [],
    update: [],
    unchanged: [],
    conflicts: [],
    blocks: [],
    removeFiles: [],
    removeBlocks: [],
    rejected: []
  };

  for (const entry of plan.files) {
    const absolute = requireInside(root, entry.rel);
    const current = readIfExists(absolute);
    const resolved = { ...entry, absolute };
    if (current === null) analysis.create.push(resolved);
    else if (current === entry.content) analysis.unchanged.push(resolved);
    else if (known.has(entry.rel) || force) analysis.update.push(resolved);
    else analysis.conflicts.push(resolved);
  }

  for (const entry of plan.blocks) {
    const absolute = requireInside(root, entry.rel);
    const current = readIfExists(absolute);
    const result = upsertBlock(current ?? "", entry.body);
    analysis.blocks.push({
      rel: entry.rel,
      absolute,
      content: result.text,
      action: current === null ? "created" : result.action
    });
  }

  const plannedFiles = new Set(plan.files.map((entry) => entry.rel));
  for (const rel of previousFiles) {
    if (plannedFiles.has(rel)) continue;
    const absolute = resolveInside(root, rel);
    if (absolute === null) {
      analysis.rejected.push(rel);
      continue;
    }
    analysis.removeFiles.push({ rel, absolute });
  }

  const plannedBlocks = new Set(plan.blocks.map((entry) => entry.rel));
  for (const rel of previousBlocks) {
    if (plannedBlocks.has(rel)) continue;
    const absolute = resolveInside(root, rel);
    if (absolute === null) {
      analysis.rejected.push(rel);
      continue;
    }
    const current = readIfExists(absolute);
    if (current === null) continue;
    const result = removeBlock(current);
    if (result.action === "unchanged") continue;
    // A file that held nothing but our block was created by a previous run: drop it whole
    // rather than leaving an empty AGENTS.md or copilot-instructions.md behind.
    analysis.removeBlocks.push({ rel, absolute, content: result.text, deleteFile: result.text.trim() === "" });
  }

  analysis.removeFiles.sort((a, b) => a.rel.localeCompare(b.rel));
  analysis.removeBlocks.sort((a, b) => a.rel.localeCompare(b.rel));
  analysis.rejected.sort();
  return analysis;
}

function requireInside(root, rel) {
  const absolute = resolveInside(root, rel);
  if (absolute === null) throw new Error(`survey-cli built a path outside the project root: ${rel}`);
  return absolute;
}

/**
 * Apply an analysis. With dryRun the same report comes back without a single write.
 * @returns {{ written: string[], removed: string[], unchanged: string[] }}
 */
export function commitPlan({ root, analysis, dryRun = false }) {
  const written = [];
  const removed = [];
  const unchanged = analysis.unchanged.map((entry) => entry.rel).sort();

  for (const entry of [...analysis.create, ...analysis.update]) {
    if (!dryRun) writeText(entry.absolute, entry.content);
    written.push(entry.rel);
  }

  for (const entry of analysis.blocks) {
    if (entry.action === "unchanged") {
      unchanged.push(entry.rel);
      continue;
    }
    if (!dryRun) writeText(entry.absolute, entry.content);
    written.push(entry.rel);
  }

  for (const entry of analysis.removeFiles) {
    if (!existsSync(entry.absolute)) continue;
    if (!dryRun) deleteFile(root, entry.absolute);
    removed.push(entry.rel);
  }

  for (const entry of analysis.removeBlocks) {
    if (entry.deleteFile) {
      if (!dryRun) deleteFile(root, entry.absolute);
      removed.push(entry.rel);
      continue;
    }
    if (!dryRun) writeText(entry.absolute, entry.content);
    removed.push(`${entry.rel} (surveyjs block)`);
  }

  return { written: written.sort(), removed: removed.sort(), unchanged: unchanged.sort() };
}

function writeText(absolute, content) {
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content, "utf8");
}

function deleteFile(root, absolute) {
  rmSync(absolute, { force: true });
  pruneEmptyDirectories(root, dirname(absolute));
}

function pruneEmptyDirectories(root, directory) {
  let current = directory;
  while (isInside(root, current) && resolve(current) !== resolve(root)) {
    let entries;
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }
    if (entries.length > 0) return;
    rmdirSync(current);
    current = dirname(current);
  }
}
