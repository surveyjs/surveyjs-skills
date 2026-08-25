import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

export const TEST_DIR = dirname(fileURLToPath(import.meta.url));
export const CLI_ROOT = resolve(TEST_DIR, "..");
export const FIXTURES = join(TEST_DIR, "fixtures");
export const GOLDEN = join(TEST_DIR, "golden");
export const SKILLS_ROOT = resolve(CLI_ROOT, "..", "plugins", "surveyjs", "skills");

const created = [];

/** Copy a fixture project into a throwaway directory and return its path. */
export function useFixture(name) {
  const root = mkdtempSync(join(tmpdir(), `survey-cli-${name}-`));
  cpSync(join(FIXTURES, name), root, { recursive: true });
  created.push(root);
  return root;
}

export function makeTempProject(files = {}) {
  const root = mkdtempSync(join(tmpdir(), "survey-cli-tmp-"));
  created.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const absolute = join(root, ...rel.split("/"));
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }
  return root;
}

export function cleanup() {
  while (created.length > 0) rmSync(created.pop(), { recursive: true, force: true });
}

/** Capture what a command writes to its out/err streams. */
export function captureStreams() {
  const out = { text: "", write: (chunk) => ((out.text += chunk), true) };
  const err = { text: "", write: (chunk) => ((err.text += chunk), true) };
  return { out, err };
}

/** Every file under `root`, as sorted posix-relative paths. */
export function listFiles(root) {
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else files.push(relative(root, path).split(sep).join("/"));
    }
  };
  visit(root);
  return files.sort();
}

export function read(root, rel) {
  return readFileSync(join(root, ...rel.split("/")), "utf8");
}

export function exists(root, rel) {
  return existsSync(join(root, ...rel.split("/")));
}

/** Golden-file compare. Set UPDATE_GOLDEN=1 to rewrite the expectation. */
export function matchGolden(name, actual, assert) {
  const path = join(GOLDEN, `${name}.json`);
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;
  if (process.env.UPDATE_GOLDEN === "1" || !existsSync(path)) {
    mkdirSync(GOLDEN, { recursive: true });
    writeFileSync(path, serialized, "utf8");
    return;
  }
  assert.deepStrictEqual(actual, JSON.parse(readFileSync(path, "utf8")), `golden mismatch: test/golden/${name}.json`);
}
