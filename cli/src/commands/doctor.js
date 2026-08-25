// `survey-cli doctor` — is what was written still true?
//
// Two distinct outcomes, deliberately separated. An *issue* means the recorded state is wrong
// and a re-run would change something: it fails the exit code so `doctor` can gate CI. A
// *warning* means we could not tell — no readable lockfile, no node_modules — which is not the
// project's fault and must not fail a build it cannot fix.

import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { detectProject, unresolvedPackages } from "../detect/project.js";
import { fromPosix } from "../fs/write.js";
import { cliVersion, MANIFEST_FILE, normalizePackages, readManifest } from "../manifest.js";

export function runDoctor({ root = process.cwd(), out = process.stdout, err = process.stderr } = {}) {
  const manifest = readManifest(root);
  if (!manifest) {
    err.write(`No ${MANIFEST_FILE} in ${root}. Run \`npx survey-cli@latest init-agents\` first.\n`);
    return { code: 1, issues: ["missing-manifest"], warnings: [] };
  }

  const version = cliVersion();
  const project = detectProject(root);
  const issues = [];
  const warnings = [];

  out.write(`Recorded by survey-cli ${manifest.cliVersion}; running survey-cli ${version}.\n`);
  if (manifest.cliVersion !== version) {
    issues.push("cli-version");
    out.write("  stale: written by a different survey-cli. Re-run `survey-cli update`.\n");
  }

  const recorded = normalizePackages(manifest.packages);
  const current = project.packages;
  const names = [...new Set([...Object.keys(recorded), ...Object.keys(current)])].sort();

  out.write("\nSurveyJS packages:\n");
  if (names.length === 0) out.write("  none recorded and none installed\n");
  for (const name of names) {
    const was = recorded[name];
    const now = current[name];

    if (!now) {
      issues.push(`removed:${name}`);
      out.write(`  removed  ${name} (was ${describe(was)})\n`);
    } else if (!was) {
      issues.push(`added:${name}`);
      out.write(`  added    ${name}@${describe(now)}\n`);
    } else if (!was.version || !now.version) {
      warnings.push(`unverified:${name}`);
      out.write(`  unknown  ${name} (${describe(was)} -> ${describe(now)}; exact version not verified)\n`);
    } else if (was.version !== now.version) {
      issues.push(`changed:${name}`);
      out.write(`  changed  ${name} ${was.version} -> ${now.version}\n`);
    } else {
      out.write(`  ok       ${name}@${now.version}\n`);
    }
  }

  const unresolved = unresolvedPackages(current);
  if (unresolved.length > 0) {
    out.write(
      `\nCould not verify the installed version of: ${unresolved.join(", ")}.\n` +
        `  Lockfile: ${describeLockfile(project)}. Install dependencies or commit a lockfile survey-cli\n` +
        "  can read (package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lock) for exact pinning.\n"
    );
  }

  if ((manifest.framework ?? null) !== (project.framework ?? null)) {
    issues.push("framework");
    out.write(`\nUI framework changed: ${manifest.framework ?? "unknown"} -> ${project.framework ?? "unknown"}\n`);
  }

  const missing = (manifest.files ?? []).filter((rel) => !existsSync(join(root, fromPosix(rel))));
  out.write(`\nRecorded files: ${(manifest.files ?? []).length}, missing on disk: ${missing.length}\n`);
  for (const rel of missing) {
    issues.push(`missing:${rel}`);
    out.write(`  missing ${rel}\n`);
  }

  const blocksMissing = (manifest.blocks ?? []).filter((rel) => !existsSync(join(root, fromPosix(rel))));
  for (const rel of blocksMissing) {
    issues.push(`missing-block:${rel}`);
    out.write(`  missing ${rel} (surveyjs block)\n`);
  }

  out.write("\n");
  if (issues.length === 0 && warnings.length === 0) {
    out.write("Up to date.\n");
    return { code: 0, issues, warnings };
  }
  if (issues.length === 0) {
    out.write(`Up to date, with ${warnings.length} unverifiable package version(s).\n`);
    return { code: 0, issues, warnings };
  }
  out.write(`${issues.length} issue(s). Run \`npx survey-cli@latest update\` to refresh what is recorded.\n`);
  return { code: 1, issues, warnings };
}

function describe(entry) {
  if (!entry) return "absent";
  if (entry.version) return entry.version;
  if (entry.range) return `${entry.range} (range)`;
  return "unknown";
}

function describeLockfile(project) {
  if (!project.lockfile) return "none";
  return project.lockfileParsed ? project.lockfile : `${project.lockfile} (could not be read)`;
}
