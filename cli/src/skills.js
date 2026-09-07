// Loading the packaged skill set, reading each skill's skill.meta.json, and filtering it
// down to what a project actually needs.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CLI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKED_SKILLS = join(CLI_ROOT, "skills");
const REPO_SKILLS = resolve(CLI_ROOT, "..", "plugins", "surveyjs", "skills");

const DEFAULT_META = { packages: ["*"], frameworks: ["*"] };

/**
 * cli/skills/ in a published install (produced by the prepack script); the plugin
 * directory when running from a checkout of this repository.
 */
export function resolveSkillsRoot() {
  for (const candidate of [PACKED_SKILLS, REPO_SKILLS]) {
    if (existsSync(candidate) && readSkillNames(candidate).length > 0) return candidate;
  }
  throw new Error(
    "surveyjs-cli could not find its skill content. Reinstall the package, or run " +
      "`node scripts/prepack-skills.js` from the cli/ directory of a repository checkout."
  );
}

function readSkillNames(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

/**
 * @returns {Array<{ name: string, dir: string, description: string, summary: string,
 *                   meta: { packages: string[], frameworks: string[] }, files: string[] }>}
 */
export function loadSkills(root = resolveSkillsRoot()) {
  return readSkillNames(root).map((name) => {
    const dir = join(root, name);
    const skillMarkdown = readFileSync(join(dir, "SKILL.md"), "utf8");
    const description = readDescription(skillMarkdown);
    return {
      name,
      dir,
      description,
      summary: summarize(description),
      meta: readMeta(dir),
      files: walk(dir).filter((rel) => rel !== "skill.meta.json")
    };
  });
}

function readMeta(dir) {
  const path = join(dir, "skill.meta.json");
  if (!existsSync(path)) return { ...DEFAULT_META };
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  return {
    packages: Array.isArray(parsed.packages) ? parsed.packages : DEFAULT_META.packages,
    frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : DEFAULT_META.frameworks
  };
}

function walk(dir) {
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(relative(dir, path).split(sep).join("/"));
    }
  };
  visit(dir);
  return files.sort();
}

/** Pull the (usually folded) `description:` value out of the SKILL.md frontmatter. */
export function readDescription(markdown) {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter) return "";
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => /^description:\s*/.test(line));
  if (start < 0) return "";
  let description = lines[start].replace(/^description:\s*>?-?\s*/, "").trim();
  for (let index = start + 1; index < lines.length && /^\s+\S/.test(lines[index]); index += 1) {
    description += ` ${lines[index].trim()}`;
  }
  return description.trim();
}

/** The lead clause of a description, for one-line listings inside marker blocks. */
export function summarize(description) {
  let text = description.split(" — ")[0].trim();
  if (text.length > 200) text = `${text.slice(0, 197).trimEnd()}...`;
  return text;
}

/**
 * Keep the skills that match what the project has installed. When no SurveyJS package is
 * detected at all we cannot narrow anything down, so the full set is written.
 */
export function selectSkills(skills, { packages = {}, framework = null } = {}) {
  const installed = Object.keys(packages);
  if (installed.length === 0) return [...skills];
  return skills.filter(
    (skill) => matchesPackages(skill.meta.packages, installed) && matchesFramework(skill.meta.frameworks, framework)
  );
}

function matchesPackages(declared, installed) {
  if (!declared || declared.length === 0 || declared.includes("*")) return true;
  return declared.some((name) => installed.includes(name));
}

function matchesFramework(declared, framework) {
  if (!declared || declared.length === 0 || declared.includes("*")) return true;
  if (!framework) return true;
  return declared.includes(framework);
}

export { PACKED_SKILLS, REPO_SKILLS, CLI_ROOT };
