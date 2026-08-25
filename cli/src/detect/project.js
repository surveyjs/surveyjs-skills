// What SurveyJS the consumer project has installed, at what version, and which UI framework
// it renders with.
//
// Two things this deliberately does not do. It does not stop at package.json: the Creator
// install the docs recommend declares only the renderer, so the packages that matter most
// arrive transitively. And it does not treat a range as a version: an unresolvable `^3.0.1`
// is reported as the range it is, never as 3.0.1.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Packages that make a project "a SurveyJS project" as far as this CLI is concerned. */
export const KNOWN_PACKAGES = [
  "survey-core",
  "survey-react-ui",
  "survey-angular-ui",
  "survey-vue3-ui",
  "survey-js-ui",
  "survey-jquery",
  "survey-knockout-ui",
  "survey-react",
  "survey-angular",
  "survey-vue-ui",
  "survey-creator-core",
  "survey-creator-react",
  "survey-creator-angular",
  "survey-creator-vue",
  "survey-creator-js",
  "survey-creator-knockout",
  "survey-analytics",
  "survey-pdf",
  "ai-form-response-extractor"
];

/**
 * Never a SurveyJS product, whatever it is called. `survey-cli` is this package: a project
 * that installs it as a devDependency must not be told it has a SurveyJS product called
 * survey-cli, and — before KNOWN_PACKAGES became the only rule — a project whose sole
 * `survey-` dependency was the CLI matched no skill at all and got nothing written.
 */
const EXCLUDED_PACKAGES = new Set(["survey-cli"]);

const LOCKFILES = ["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"];

export const FRAMEWORKS = ["react", "angular", "vue3", "jquery", "vanilla"];

/**
 * Membership in KNOWN_PACKAGES is the whole rule. A `survey-` prefix match was tempting as a
 * way to catch products added after this CLI shipped, but it also catches tooling and
 * unrelated packages, and a false positive here ends up asserted in every written skill.
 * An unknown SurveyJS package simply leaves `packages` empty, which writes the full skill set.
 */
export function isSurveyPackage(name) {
  return !EXCLUDED_PACKAGES.has(name) && KNOWN_PACKAGES.includes(name);
}

/**
 * @returns {{ root: string, hasPackageJson: boolean, packageName: string | null,
 *             lockfile: string | null, lockfileParsed: boolean | null,
 *             packages: Record<string, { version: string | null, range: string | null, source: string }>,
 *             framework: string | null, dependencies: Record<string, string> }}
 */
export function detectProject(root) {
  const packageJsonPath = join(root, "package.json");
  if (!existsSync(packageJsonPath)) {
    return {
      root,
      hasPackageJson: false,
      packageName: null,
      lockfile: null,
      lockfileParsed: null,
      packages: {},
      framework: null,
      dependencies: {}
    };
  }

  const manifest = parseJson(packageJsonPath) ?? {};
  const dependencies = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
    ...(manifest.peerDependencies ?? {}),
    ...(manifest.optionalDependencies ?? {})
  };

  const lockfile = LOCKFILES.find((name) => existsSync(join(root, name))) ?? null;
  const lock = lockfile ? readLockVersions(join(root, lockfile), lockfile) : { versions: new Map(), parsed: false };

  const packages = {};
  for (const name of collectPackageNames(root, dependencies, lock.versions)) {
    packages[name] = resolveEntry(root, name, dependencies[name], lock.versions);
  }

  return {
    root,
    hasPackageJson: true,
    packageName: typeof manifest.name === "string" ? manifest.name : null,
    lockfile,
    lockfileParsed: lockfile ? lock.parsed : null,
    packages,
    framework: detectFramework(dependencies, packages),
    dependencies
  };
}

/** Packages whose exact installed version could not be verified. */
export function unresolvedPackages(packages) {
  return Object.keys(packages)
    .filter((name) => !packages[name]?.version)
    .sort();
}

/**
 * Every SurveyJS package this project has, declared or not.
 *
 * The Survey Creator install the docs recommend is `npm install survey-creator-react` on its
 * own — survey-creator-core, survey-core, and survey-react-ui arrive as its dependencies and
 * never appear in package.json. Looking only at declared dependencies would leave such a
 * project with the Creator skill and nothing about the form JSON it is editing.
 *
 * Declared dependencies use the loose `survey-` prefix rule; transitive discovery is limited
 * to KNOWN_PACKAGES so an unrelated `survey-something` deep in a lockfile is not picked up.
 */
function collectPackageNames(root, dependencies, lockVersions) {
  const names = new Set(Object.keys(dependencies).filter(isSurveyPackage));

  for (const name of KNOWN_PACKAGES) {
    if (names.has(name)) continue;
    if (existsSync(join(root, "node_modules", ...name.split("/"), "package.json"))) names.add(name);
    else if (lockVersions.has(name)) names.add(name);
  }

  return [...names].sort();
}

const RENDERER_PACKAGES = [
  [["survey-react-ui", "survey-creator-react", "survey-react"], "react"],
  [["survey-angular-ui", "survey-creator-angular", "survey-angular"], "angular"],
  [["survey-vue3-ui", "survey-creator-vue", "survey-vue-ui"], "vue3"],
  [["survey-jquery"], "jquery"]
];

/**
 * A declared renderer always wins over an installed one: in a monorepo the shared lockfile can
 * hold renderers for frameworks this particular project does not use.
 */
export function detectFramework(dependencies, installed = {}) {
  const declared = (name) => Object.prototype.hasOwnProperty.call(dependencies, name);
  const present = (name) => Object.prototype.hasOwnProperty.call(installed, name);

  for (const [names, framework] of RENDERER_PACKAGES) {
    if (names.some(declared)) return framework;
  }
  if (declared("survey-js-ui") || declared("survey-creator-js")) return declared("jquery") ? "jquery" : "vanilla";

  for (const [names, framework] of RENDERER_PACKAGES) {
    if (names.some(present)) return framework;
  }
  if (present("survey-js-ui") || present("survey-creator-js")) return declared("jquery") ? "jquery" : "vanilla";

  if (declared("next") || declared("react") || declared("react-dom")) return "react";
  if (declared("@angular/core")) return "angular";
  if (declared("vue") || declared("nuxt")) return "vue3";
  if (declared("jquery")) return "jquery";
  return "vanilla";
}

/**
 * What we know about one package, and how we know it.
 *
 * `version` is set only when it was actually verified — read out of node_modules, out of a
 * lockfile, or pinned exactly in package.json. A caret or tilde range is NOT a version: the
 * project may well have resolved something newer, so `version` stays null and callers must
 * present the range as a range. Claiming "survey-core@3.0.1" off `^3.0.1` would make the
 * pinned note in every written skill a guess dressed up as a fact.
 *
 * @returns {{ version: string | null, range: string | null,
 *             source: "node_modules" | "lockfile" | "package.json" | "range" | "unknown" }}
 */
function resolveEntry(root, name, range, lockVersions) {
  const declared = typeof range === "string" ? range : null;

  const installed = parseJson(join(root, "node_modules", ...name.split("/"), "package.json"))?.version;
  if (typeof installed === "string") return { version: installed, range: declared, source: "node_modules" };

  const locked = lockVersions.get(name);
  if (locked) return { version: locked, range: declared, source: "lockfile" };

  if (isExactPin(declared)) return { version: declared.trim(), range: declared, source: "package.json" };
  if (declared) return { version: null, range: declared, source: "range" };
  return { version: null, range: null, source: "unknown" };
}

/** `"3.0.1"` is a verified version; `"^3.0.1"`, `">=3 <4"`, and `"workspace:*"` are not. */
export function isExactPin(range) {
  return typeof range === "string" && /^\s*=?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\s*$/.test(range);
}

function parseJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * @returns {{ versions: Map<string, string>, parsed: boolean }} `parsed: false` means the
 * lockfile exists but we could not read versions out of it, so nothing may claim it was used.
 * bun.lockb is the standing case: it is binary, and decoding it would mean shelling out to bun.
 */
function readLockVersions(path, kind) {
  try {
    if (kind === "package-lock.json" || kind === "npm-shrinkwrap.json") return { versions: readNpmLock(path), parsed: true };
    if (kind === "pnpm-lock.yaml") return { versions: readPnpmLock(path), parsed: true };
    if (kind === "yarn.lock") return { versions: readYarnLock(path), parsed: true };
    if (kind === "bun.lock") return { versions: readBunLock(path), parsed: true };
  } catch {
    // A lockfile we cannot parse is not an error: the package falls back to its declared range,
    // and `parsed: false` keeps the output honest about that.
  }
  return { versions: new Map(), parsed: false };
}

/**
 * Bun's text lockfile (bun.lock, Bun 1.2+) is JSONC with trailing commas, so it is matched
 * rather than JSON.parsed. Every `packages` entry starts with a "<name>@<version>" tuple.
 */
function readBunLock(path) {
  const versions = new Map();
  const text = readFileSync(path, "utf8");

  for (const match of text.matchAll(/"(?:(?:@[^"/]+\/)?[^"]+)":\s*\[\s*"([^"]+)"/g)) {
    const tuple = match[1];
    const at = tuple.lastIndexOf("@");
    if (at <= 0) continue;
    const name = tuple.slice(0, at);
    const version = tuple.slice(at + 1);
    // Skip npm aliases, git refs, and file: specifiers, which are not versions.
    if (!/^\d/.test(version)) continue;
    if (!versions.has(name)) versions.set(name, version);
  }
  return versions;
}

function readNpmLock(path) {
  const versions = new Map();
  const data = JSON.parse(readFileSync(path, "utf8"));

  for (const [key, entry] of Object.entries(data.packages ?? {})) {
    if (!key.startsWith("node_modules/")) continue;
    const name = key.slice(key.lastIndexOf("node_modules/") + "node_modules/".length);
    if (typeof entry?.version === "string" && !versions.has(name)) versions.set(name, entry.version);
  }
  for (const [name, entry] of Object.entries(data.dependencies ?? {})) {
    if (typeof entry?.version === "string" && !versions.has(name)) versions.set(name, entry.version);
  }
  return versions;
}

function readPnpmLock(path) {
  const versions = new Map();
  const text = readFileSync(path, "utf8");

  // importers: -> <name>: -> version: 3.0.1  (the resolution the project actually got)
  const importer = /^ {6}([@a-z0-9][^:\s]*):\r?\n(?: {8}.*\r?\n)*? {8}version: ['"]?([^'"\s(]+)/gim;
  for (const match of text.matchAll(importer)) {
    if (!versions.has(match[1])) versions.set(match[1], stripPeerSuffix(match[2]));
  }

  // packages:/snapshots: -> '<name>@<version>':
  const packageKey = /^ {2}'?\/?((?:@[^/\s'@]+\/)?[^/\s'@]+)@([^'\s:(]+)/gm;
  for (const match of text.matchAll(packageKey)) {
    if (!versions.has(match[1])) versions.set(match[1], stripPeerSuffix(match[2]));
  }
  return versions;
}

function readYarnLock(path) {
  const versions = new Map();
  const text = readFileSync(path, "utf8");
  let current = null;

  for (const line of text.split(/\r?\n/)) {
    if (/^[^\s#]/.test(line) && line.trimEnd().endsWith(":")) {
      const heading = line.trimEnd().slice(0, -1);
      const first = heading.split(",")[0].trim().replace(/^"|"$/g, "");
      const at = first.lastIndexOf("@");
      current = at > 0 ? first.slice(0, at) : first;
      continue;
    }
    const match = line.match(/^\s+version:?\s+"?([^"\s]+)"?\s*$/);
    if (match && current && !versions.has(current)) versions.set(current, match[1]);
  }
  return versions;
}

function stripPeerSuffix(version) {
  return version.split("(")[0];
}
