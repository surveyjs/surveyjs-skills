#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "plugins", "surveyjs", "skills");
const errors = [];

const expectedSkills = [
  "surveyjs-brand-styling",
  "surveyjs-creator-customization",
  "surveyjs-dashboard",
  "surveyjs-form-json",
  "surveyjs-integration",
  "surveyjs-linter",
  "surveyjs-pdf-generator",
  "surveyjs-response-extractor"
];

const manifestFiles = [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  ".grok-plugin/marketplace.json",
  "plugins/surveyjs/.claude-plugin/plugin.json",
  "plugins/surveyjs/.codex-plugin/plugin.json",
  "plugins/surveyjs/gemini-extension.json",
  "plugins/surveyjs/plugin.json"
];

const fail = (message) => errors.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");
const read = (path) => readFileSync(path, "utf8");

function walk(directory, predicate = () => true) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "prompts"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

function parseJson(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    fail(`${rel(path)} is not valid JSON: ${error.message}`);
    return null;
  }
}

const manifests = new Map();
for (const file of manifestFiles) {
  const path = join(ROOT, ...file.split("/"));
  if (!existsSync(path)) {
    fail(`${file} is missing`);
    continue;
  }
  manifests.set(file, parseJson(path));
}

const marketplace = manifests.get(".agents/plugins/marketplace.json");
if (marketplace) {
  if (marketplace.name !== "surveyjs-skills") fail("Codex marketplace name must be surveyjs-skills");
  if (!marketplace.interface?.displayName) fail("Codex marketplace needs interface.displayName");
  const plugin = marketplace.plugins?.find((item) => item.name === "surveyjs");
  if (!plugin) {
    fail("Codex marketplace must contain the surveyjs plugin");
  } else {
    if (plugin.source?.source !== "local" || typeof plugin.source?.path !== "string") {
      fail("Codex marketplace surveyjs source must be a local path");
    } else if (!existsSync(resolve(ROOT, plugin.source.path))) {
      fail(`Codex marketplace source does not exist: ${plugin.source.path}`);
    }
    if (plugin.policy?.installation !== "AVAILABLE") fail("Codex plugin installation policy must be AVAILABLE");
    if (plugin.policy?.authentication !== "ON_INSTALL") fail("Codex plugin authentication policy must be ON_INSTALL");
  }
}

const codex = manifests.get("plugins/surveyjs/.codex-plugin/plugin.json");
if (codex) {
  const required = ["displayName", "shortDescription", "longDescription", "developerName", "category"];
  for (const field of required) {
    if (!codex.interface?.[field]) fail(`Codex manifest is missing interface.${field}`);
  }
  const prompts = codex.interface?.defaultPrompt;
  if (!Array.isArray(prompts) || prompts.length === 0 || prompts.some((prompt) => typeof prompt !== "string" || !prompt.trim())) {
    fail("Codex interface.defaultPrompt must be a nonempty array of nonempty strings");
  } else if (prompts.length > 3) {
    fail("Codex interface.defaultPrompt may contain at most three prompts");
  }
}

const versionLocations = [
  [".grok-plugin/marketplace.json", (data) => data.plugins?.[0]?.version],
  ["plugins/surveyjs/.claude-plugin/plugin.json", (data) => data.version],
  ["plugins/surveyjs/.codex-plugin/plugin.json", (data) => data.version],
  ["plugins/surveyjs/gemini-extension.json", (data) => data.version],
  ["plugins/surveyjs/plugin.json", (data) => data.version]
];
const versions = [];
for (const [file, getVersion] of versionLocations) {
  const data = manifests.get(file);
  if (!data) continue;
  const version = getVersion(data);
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    fail(`${file} has a missing or invalid semantic version`);
  } else {
    versions.push([file, version]);
  }
}
if (new Set(versions.map(([, version]) => version)).size > 1) {
  fail(`Provider manifest versions differ: ${versions.map(([file, version]) => `${file}=${version}`).join(", ")}`);
}

const actualSkills = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (actualSkills.join("\n") !== expectedSkills.join("\n")) {
  fail(`Skill inventory differs from expected: ${actualSkills.join(", ")}`);
}

for (const skillName of actualSkills) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) fail(`Invalid skill directory name: ${skillName}`);
  const skillPath = join(SKILLS_DIR, skillName, "SKILL.md");
  if (!existsSync(skillPath)) {
    fail(`${rel(skillPath)} is missing`);
    continue;
  }

  const content = read(skillPath);
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter) {
    fail(`${rel(skillPath)} has no valid YAML frontmatter`);
    continue;
  }

  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (name !== skillName) fail(`${rel(skillPath)} frontmatter name must equal ${skillName}`);

  const lines = frontmatter.split(/\r?\n/);
  const descriptionIndex = lines.findIndex((line) => /^description:\s*/.test(line));
  let description = "";
  if (descriptionIndex >= 0) {
    description = lines[descriptionIndex].replace(/^description:\s*>?\s*/, "").trim();
    for (let i = descriptionIndex + 1; i < lines.length && /^\s+/.test(lines[i]); i += 1) {
      description += ` ${lines[i].trim()}`;
    }
  }
  if (!description.trim()) fail(`${rel(skillPath)} has no description`);
  if (description.length > 1024) fail(`${rel(skillPath)} description exceeds 1024 characters`);

  const skillFiles = walk(join(SKILLS_DIR, skillName), (path) => path.endsWith(".md"));
  for (const file of skillFiles) {
    if (/\b(?:TODO|FIXME|TBD|CHANGEME)\b|\[TODO[^\]]*\]/i.test(read(file))) {
      fail(`${rel(file)} contains a placeholder`);
    }
  }

  const referenceDir = join(SKILLS_DIR, skillName, "references");
  for (const reference of walk(referenceDir, (path) => path.endsWith(".md"))) {
    const referenceLink = relative(dirname(skillPath), reference).split(sep).join("/");
    if (!content.includes(referenceLink)) fail(`${rel(reference)} is not linked from ${rel(skillPath)}`);
  }
}

for (const readme of [join(ROOT, "README.md"), join(ROOT, "plugins", "surveyjs", "README.md")]) {
  const content = read(readme);
  for (const skill of expectedSkills) {
    if (!content.includes(`\`${skill}\``)) fail(`${rel(readme)} does not list ${skill}`);
  }
}

for (const markdown of walk(ROOT, (path) => path.endsWith(".md"))) {
  const content = read(markdown);
  const links = content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of links) {
    let target = match[1].trim().replace(/^<|>$/g, "").split(/\s+[\"']/)[0];
    if (!target || /^(?:[a-z]+:|#)/i.test(target)) continue;
    target = target.split("#")[0];
    try {
      target = decodeURIComponent(target);
    } catch {
      fail(`${rel(markdown)} contains an invalid encoded link: ${target}`);
      continue;
    }
    const resolved = resolve(dirname(markdown), target);
    if (!existsSync(resolved)) fail(`${rel(markdown)} has a broken link: ${target}`);
  }
}

const checkerPath = join(ROOT, "scripts", "check-upstream-docs.mjs");
const checker = read(checkerPath);
const watchedBlock = checker.match(/const WATCHED = \{([\s\S]*?)\n\};/)?.[1] ?? "";
const watchedUrls = [...watchedBlock.matchAll(/^\s{2}"(https:\/\/[^\"]+)":/gm)].map((match) => match[1]);
const slug = (url) => url.replace(/^https:\/\//, "").replace(/[^a-z0-9]+/gi, "-");
const expectedSnapshots = new Set(watchedUrls.map((url) => `${slug(url)}.sha256`));
const snapshotDir = join(ROOT, "scripts", ".doc-snapshots");
const actualSnapshots = new Set(readdirSync(snapshotDir).filter((name) => name.endsWith(".sha256")));
for (const name of expectedSnapshots) {
  if (!actualSnapshots.has(name)) fail(`Missing upstream snapshot: scripts/.doc-snapshots/${name}`);
}
for (const name of actualSnapshots) {
  if (!expectedSnapshots.has(name)) fail(`Orphan upstream snapshot: scripts/.doc-snapshots/${name}`);
}

if (errors.length) {
  console.error(`Repository validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Repository validation passed: ${manifestFiles.length} manifests, ${actualSkills.length} skills, ` +
    `${walk(ROOT, (path) => path.endsWith(".md")).length} Markdown files, and ${actualSnapshots.size} snapshots.`
);
