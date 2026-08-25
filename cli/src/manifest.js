// .surveyjs-skills.json — the record of what a previous run wrote, so re-runs are
// idempotent and can clean up what no longer applies. Deliberately free of timestamps:
// identical inputs must produce a byte-identical manifest.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MANIFEST_FILE = ".surveyjs-skills.json";

const CLI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function cliVersion() {
  return JSON.parse(readFileSync(join(CLI_ROOT, "package.json"), "utf8")).version;
}

export function manifestPath(root) {
  return join(root, MANIFEST_FILE);
}

/** @returns {object | null} */
export function readManifest(root) {
  const path = manifestPath(root);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function buildManifest({ cliVersion: version, project, clients, skills, files, blocks }) {
  return {
    cliVersion: version,
    generator: "survey-cli",
    source: "https://github.com/surveyjs/surveyjs-skills",
    framework: project.framework,
    lockfile: project.lockfile,
    lockfileParsed: project.lockfileParsed ?? null,
    packages: sortObject(project.packages),
    clients: [...clients].sort(),
    skills: skills.map((skill) => skill.name).sort(),
    files: [...files].sort(),
    blocks: [...blocks].sort()
  };
}

/**
 * Manifests written before versions carried provenance stored `{ name: "3.0.1" }`. Read those
 * as verified versions so `doctor` keeps working against a manifest an older CLI produced.
 */
export function normalizePackages(packages) {
  const normalized = {};
  for (const [name, value] of Object.entries(packages ?? {})) {
    if (typeof value === "string") normalized[name] = { version: value, range: null, source: "legacy" };
    else if (value && typeof value === "object") {
      normalized[name] = { version: value.version ?? null, range: value.range ?? null, source: value.source ?? "unknown" };
    }
  }
  return normalized;
}

export function serializeManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
