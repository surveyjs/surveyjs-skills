// `surveyjs-cli init-agents` — detect, filter, place, record.

import process from "node:process";

import { detectProject, unresolvedPackages } from "../detect/project.js";
import { CLIENT_DEFINITIONS, detectClients } from "../detect/clients.js";
import { analyzePlan, commitPlan, createPlan } from "../fs/write.js";
import { buildManifest, cliVersion, MANIFEST_FILE, readManifest, serializeManifest } from "../manifest.js";
import { loadSkills, selectSkills } from "../skills.js";
import { getTarget, TARGET_IDS } from "../targets/index.js";
import { isInteractive, selectClients } from "../ui/prompt.js";

/** Client written when nothing is detected and nobody can be asked: the portable one. */
const NON_INTERACTIVE_FALLBACK = "agents-md";

const SOURCE_LABELS = {
  node_modules: "installed",
  lockfile: "lockfile",
  "package.json": "pinned in package.json",
  range: "declared range, not resolved",
  unknown: "version unknown"
};

function lockfileLabel(project) {
  if (!project.lockfile) return "none";
  return project.lockfileParsed ? project.lockfile : `${project.lockfile} (present, but surveyjs-cli cannot read it)`;
}

export async function runInitAgents({
  root = process.cwd(),
  flags = {},
  out = process.stdout,
  err = process.stderr,
  io = {},
  skillsRoot
} = {}) {
  const version = cliVersion();
  const project = detectProject(root);
  const { detected, markers } = detectClients(root);

  reportDetection({ out, project, detected, markers });

  const clients = await resolveClients({ flags, detected, out, err, io });
  if (clients === null) return { code: 1, written: [], removed: [] };

  const allSkills = loadSkills(skillsRoot);
  let skills = selectSkills(allSkills, project);
  if (skills.length === 0) {
    // Detected SurveyJS packages that no skill claims — a legacy renderer, say. Writing
    // everything is the same answer as for a project with no SurveyJS at all, and far better
    // than writing nothing and failing.
    out.write(
      `\nNo skill is specific to ${Object.keys(project.packages).join(", ")}; writing the full ` +
        "skill set instead.\n"
    );
    skills = allSkills;
  }

  const context = { cliVersion: version, packages: project.packages, framework: project.framework };
  const planner = createPlan();
  for (const id of clients) getTarget(id).plan({ planner, skills, context });

  const previous = readManifest(root);
  const analysis = analyzePlan({
    root,
    plan: planner,
    previousFiles: Array.isArray(previous?.files) ? previous.files : [],
    previousBlocks: Array.isArray(previous?.blocks) ? previous.blocks : [],
    force: Boolean(flags.force)
  });

  if (analysis.conflicts.length > 0) {
    err.write(
      `\nRefusing to overwrite ${analysis.conflicts.length} file(s) this CLI did not write:\n` +
        analysis.conflicts.map((entry) => `  ${entry.rel}\n`).join("") +
        "Re-run with --force to replace them.\n"
    );
    return { code: 1, written: [], removed: [], conflicts: analysis.conflicts.map((entry) => entry.rel) };
  }

  const manifest = buildManifest({
    cliVersion: version,
    project,
    clients,
    skills,
    files: planner.files.map((entry) => entry.rel),
    blocks: planner.blocks.map((entry) => entry.rel)
  });
  planner.file(MANIFEST_FILE, serializeManifest(manifest));

  // Re-analyze so the manifest itself takes part in the create/update/unchanged split.
  const finalAnalysis = analyzePlan({
    root,
    plan: planner,
    previousFiles: [...(Array.isArray(previous?.files) ? previous.files : []), MANIFEST_FILE],
    previousBlocks: Array.isArray(previous?.blocks) ? previous.blocks : [],
    force: true
  });

  warnAboutRejectedPaths({ err, rejected: finalAnalysis.rejected });

  const result = commitPlan({ root, analysis: finalAnalysis, dryRun: Boolean(flags.dryRun) });
  report({ out, flags, clients, skills, project, result });

  return { code: 0, ...result, clients, skills: manifest.skills, manifest };
}

/**
 * .surveyjs-skills.json is repository data, and a cloned repository can carry a hostile one.
 * Paths in it that point outside the project are never touched, but they are worth saying out
 * loud: either the file was hand-edited badly, or someone tried to use it to delete your files.
 */
function warnAboutRejectedPaths({ err, rejected }) {
  if (rejected.length === 0) return;
  err.write(
    `\nIgnored ${rejected.length} path(s) in ${MANIFEST_FILE} that point outside this project:\n` +
      rejected.map((rel) => `  ${rel}\n`).join("") +
      "Nothing outside the project root is ever written or deleted. Check that file into version " +
      "control only as surveyjs-cli wrote it.\n"
  );
}

function reportDetection({ out, project, detected, markers }) {
  const packages = Object.entries(project.packages);
  if (packages.length === 0) {
    out.write("SurveyJS packages: none detected — writing the full skill set.\n");
  } else {
    out.write("SurveyJS packages:\n");
    for (const [name, entry] of packages) {
      const version = entry.version ? `@${entry.version}` : entry.range ? `@${entry.range}` : "";
      out.write(`  ${name}${version}  (${SOURCE_LABELS[entry.source] ?? entry.source})\n`);
    }
  }
  out.write(`UI framework: ${project.framework ?? "unknown"}\n`);
  out.write(`Lockfile: ${lockfileLabel(project)}\n`);

  const unresolved = unresolvedPackages(project.packages);
  if (unresolved.length > 0) {
    out.write(
      `  Note: the exact installed version of ${unresolved.join(", ")} could not be verified, so the\n` +
        "  written skills state the declared range instead of claiming a version.\n"
    );
  }

  if (detected.length === 0) {
    out.write("AI clients: none detected\n");
    return;
  }
  out.write("AI clients:\n");
  for (const id of detected) {
    const client = CLIENT_DEFINITIONS.find((entry) => entry.id === id);
    out.write(`  ${client.label} (${markers[id].join(", ")})\n`);
  }
}

async function resolveClients({ flags, detected, out, err, io }) {
  if (flags.all) return [...TARGET_IDS];

  if (flags.client?.length) {
    const unknown = flags.client.filter((id) => !TARGET_IDS.includes(id));
    if (unknown.length > 0) {
      err.write(`Unknown client(s): ${unknown.join(", ")}. Known clients: ${TARGET_IDS.join(", ")}\n`);
      return null;
    }
    return TARGET_IDS.filter((id) => flags.client.includes(id));
  }

  const interactive = !flags.yes && isInteractive(io);
  if (!interactive) {
    if (detected.length > 0) return detected;
    out.write(
      `\nNo AI client detected and no --client given; writing the portable ` +
        `${NON_INTERACTIVE_FALLBACK} target. Pass --client or --all to choose.\n`
    );
    return [NON_INTERACTIVE_FALLBACK];
  }

  const options = CLIENT_DEFINITIONS.map((client) => ({
    id: client.id,
    label: client.label,
    detected: detected.includes(client.id)
  }));
  const preselected = detected.length > 0 ? detected : [NON_INTERACTIVE_FALLBACK];
  const chosen = await selectClients({ options, preselected, io });
  if (chosen.length === 0) {
    err.write("No client selected. Nothing was written.\n");
    return null;
  }
  return TARGET_IDS.filter((id) => chosen.includes(id));
}

function report({ out, flags, clients, skills, project, result }) {
  const prefix = flags.dryRun ? "would write" : "wrote";

  out.write(`\nClients: ${clients.join(", ")}\n`);
  out.write(`Skills: ${skills.map((skill) => skill.name).join(", ")}\n\n`);

  if (result.written.length === 0) out.write("Nothing to write — everything is already up to date.\n");
  for (const rel of result.written) out.write(`${prefix}  ${rel}\n`);
  for (const rel of result.unchanged) out.write(`unchanged ${rel}\n`);
  for (const rel of result.removed) out.write(`${flags.dryRun ? "would remove" : "removed"} ${rel}\n`);

  out.write("\n");
  if (flags.dryRun) {
    out.write("Dry run — nothing was written to disk.\n");
    return;
  }
  if (result.written.length === 0 && result.removed.length === 0) {
    out.write("No changes to commit.\n");
    return;
  }
  const versionNote = Object.keys(project.packages).length > 0 ? " They pin your installed SurveyJS versions" : "";
  out.write(
    `Commit these files so teammates and CI agents get the same SurveyJS guidance.${versionNote}` +
      `${versionNote ? ", so re-run this command after a SurveyJS upgrade" : ""}.\n`
  );
}
