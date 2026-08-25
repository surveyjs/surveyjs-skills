import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { detectFramework, detectProject, isExactPin, unresolvedPackages } from "../src/detect/project.js";
import { detectClients } from "../src/detect/clients.js";
import { loadSkills, readDescription, selectSkills, summarize } from "../src/skills.js";
import { cleanup, makeTempProject, SKILLS_ROOT } from "./helpers.js";

after(cleanup);

const pkg = (dependencies) => JSON.stringify({ name: "p", version: "1.0.0", dependencies }, null, 2);

/** Flatten detected packages to `name -> version` for assertions that only care about that. */
const versions = (packages) =>
  Object.fromEntries(Object.entries(packages).map(([name, entry]) => [name, entry.version]));

describe("detect/project", () => {
  it("reports nothing for a directory with no package.json", () => {
    const root = makeTempProject({ "README.md": "hi\n" });
    assert.deepEqual(detectProject(root), {
      root,
      hasPackageJson: false,
      packageName: null,
      lockfile: null,
      lockfileParsed: null,
      packages: {},
      framework: null,
      dependencies: {}
    });
  });

  it("prefers the version installed in node_modules over the lockfile and the range", () => {
    const root = makeTempProject({
      "package.json": pkg({ "survey-core": "^3.0.0" }),
      "package-lock.json": JSON.stringify({ packages: { "node_modules/survey-core": { version: "3.0.0" } } }),
      "node_modules/survey-core/package.json": JSON.stringify({ name: "survey-core", version: "3.0.1" })
    });
    assert.deepEqual(versions(detectProject(root).packages), { "survey-core": "3.0.1" });
    assert.equal(detectProject(root).packages["survey-core"].source, "node_modules");
  });

  it("falls back to the lockfile, then to a labelled range", () => {
    const locked = makeTempProject({
      "package.json": pkg({ "survey-core": "^3.0.0" }),
      "package-lock.json": JSON.stringify({ packages: { "node_modules/survey-core": { version: "3.0.0" } } })
    });
    assert.deepEqual(versions(detectProject(locked).packages), { "survey-core": "3.0.0" });
    assert.equal(detectProject(locked).packages["survey-core"].source, "lockfile");

    const ranged = makeTempProject({ "package.json": pkg({ "survey-core": "~3.0.1" }) });
    assert.deepEqual(detectProject(ranged).packages, {
      "survey-core": { version: null, range: "~3.0.1", source: "range" }
    });
  });

  it("reads a lockfileVersion 1 package-lock", () => {
    const root = makeTempProject({
      "package.json": pkg({ "survey-pdf": "^3.0.0" }),
      "package-lock.json": JSON.stringify({ lockfileVersion: 1, dependencies: { "survey-pdf": { version: "3.0.0" } } })
    });
    assert.deepEqual(versions(detectProject(root).packages), { "survey-pdf": "3.0.0" });
  });

  it("ignores dependencies that are not SurveyJS", () => {
    const root = makeTempProject({ "package.json": pkg({ react: "^19.2.8", lodash: "^4.0.0" }) });
    assert.deepEqual(detectProject(root).packages, {});
  });

  it("survives an unparseable lockfile", () => {
    const root = makeTempProject({
      "package.json": pkg({ "survey-core": "^3.0.1" }),
      "package-lock.json": "{ this is not json"
    });
    const project = detectProject(root);
    assert.equal(project.lockfileParsed, false);
    assert.deepEqual(project.packages, {
      "survey-core": { version: null, range: "^3.0.1", source: "range" }
    });
  });

  it("finds SurveyJS packages that arrive as transitive dependencies", () => {
    const viaNodeModules = makeTempProject({
      "package.json": pkg({ "survey-creator-react": "^3.0.1", react: "^19.2.8" }),
      "node_modules/survey-creator-react/package.json": JSON.stringify({ version: "3.0.1" }),
      "node_modules/survey-creator-core/package.json": JSON.stringify({ version: "3.0.1" }),
      "node_modules/survey-core/package.json": JSON.stringify({ version: "3.0.1" }),
      "node_modules/survey-react-ui/package.json": JSON.stringify({ version: "3.0.1" })
    });
    assert.deepEqual(versions(detectProject(viaNodeModules).packages), {
      "survey-core": "3.0.1",
      "survey-creator-core": "3.0.1",
      "survey-creator-react": "3.0.1",
      "survey-react-ui": "3.0.1"
    });

    const viaLockfile = makeTempProject({
      "package.json": pkg({ "survey-creator-angular": "^3.0.1" }),
      "package-lock.json": JSON.stringify({
        packages: {
          "node_modules/survey-creator-angular": { version: "3.0.1" },
          "node_modules/survey-creator-core": { version: "3.0.1" },
          "node_modules/survey-core": { version: "3.0.1" },
          "node_modules/survey-angular-ui": { version: "3.0.1" }
        }
      })
    });
    assert.deepEqual(Object.keys(detectProject(viaLockfile).packages), [
      "survey-angular-ui",
      "survey-core",
      "survey-creator-angular",
      "survey-creator-core"
    ]);
  });

  it("limits transitive discovery to known packages", () => {
    const root = makeTempProject({
      "package.json": pkg({ "survey-core": "3.0.1" }),
      "node_modules/survey-core/package.json": JSON.stringify({ version: "3.0.1" }),
      "node_modules/survey-monkey-importer/package.json": JSON.stringify({ version: "9.9.9" })
    });
    assert.deepEqual(Object.keys(detectProject(root).packages), ["survey-core"]);
  });

  it("does not treat survey-cli itself as a SurveyJS product", () => {
    const root = makeTempProject({
      "package.json": JSON.stringify({ name: "p", devDependencies: { "survey-cli": "^0.1.0" } }),
      "node_modules/survey-cli/package.json": JSON.stringify({ version: "0.1.0" })
    });
    assert.deepEqual(detectProject(root).packages, {});
  });

  it("does not claim unrelated survey- packages", () => {
    const root = makeTempProject({ "package.json": pkg({ "survey-monkey-importer": "1.0.0" }) });
    assert.deepEqual(detectProject(root).packages, {});
  });

  it("detects v1-era packages without any skill claiming to describe them", () => {
    const root = makeTempProject({
      "package.json": pkg({ "survey-jquery": "1.9.0" }),
      "node_modules/survey-jquery/package.json": JSON.stringify({ version: "1.9.0" })
    });
    const project = detectProject(root);

    // Reported accurately, because it is installed...
    assert.deepEqual(versions(project.packages), { "survey-jquery": "1.9.0" });
    assert.equal(project.framework, "jquery");

    // ...but no skill claims it: the skills describe v3, and survey-jquery is not v3. The
    // full set is written by the caller's fallback rather than pretending one skill fits.
    assert.deepEqual(selectSkills(loadSkills(SKILLS_ROOT), project), []);
  });

  it("reads a bun.lock text lockfile", () => {
    const root = makeTempProject({
      "package.json": pkg({ "survey-core": "^3.0.1" }),
      "bun.lock": [
        "{",
        '  "lockfileVersion": 1,',
        '  "packages": {',
        '    "survey-core": ["survey-core@3.0.1", "", {}, "sha512-aaaa=="],',
        "  }",
        "}"
      ].join("\n")
    });
    const project = detectProject(root);
    assert.equal(project.lockfileParsed, true);
    assert.deepEqual(project.packages["survey-core"], {
      version: "3.0.1",
      range: "^3.0.1",
      source: "lockfile"
    });
  });

  it("admits that bun.lockb cannot be read instead of guessing from the range", () => {
    const root = makeTempProject({
      "package.json": pkg({ "survey-core": "^3.0.1" }),
      "bun.lockb": "binary; survey-cli never parses it"
    });
    const project = detectProject(root);
    assert.equal(project.lockfile, "bun.lockb");
    assert.equal(project.lockfileParsed, false);
    assert.equal(project.packages["survey-core"].version, null);
    assert.equal(project.packages["survey-core"].source, "range");
  });

  it("treats an exact pin in package.json as verified but a range as not", () => {
    assert.equal(isExactPin("3.0.1"), true);
    assert.equal(isExactPin("=3.0.1"), true);
    assert.equal(isExactPin("3.0.1-beta.1"), true);
    assert.equal(isExactPin("^3.0.1"), false);
    assert.equal(isExactPin("~3.0.1"), false);
    assert.equal(isExactPin(">=3.0.1 <4"), false);
    assert.equal(isExactPin("workspace:*"), false);
    assert.equal(isExactPin("*"), false);
    assert.equal(isExactPin(undefined), false);
  });

  it("reports unresolved packages", () => {
    const root = makeTempProject({ "package.json": pkg({ "survey-core": "^3.0.1", "survey-pdf": "3.0.1" }) });
    assert.deepEqual(unresolvedPackages(detectProject(root).packages), ["survey-core"]);
  });

  it("prefers a declared renderer over one found only in a shared lockfile", () => {
    assert.equal(detectFramework({ "survey-vue3-ui": "^3" }, { "survey-react-ui": {} }), "vue3");
    assert.equal(detectFramework({ "survey-creator-core": "^3" }, { "survey-react-ui": {} }), "react");
    assert.equal(detectFramework({}, {}), "vanilla");
  });

  it("maps dependencies to a UI framework", () => {
    assert.equal(detectFramework({ "survey-react-ui": "^3" }), "react");
    assert.equal(detectFramework({ "survey-angular-ui": "^3" }), "angular");
    assert.equal(detectFramework({ "survey-vue3-ui": "^3" }), "vue3");
    assert.equal(detectFramework({ "survey-js-ui": "^3", jquery: "^3" }), "jquery");
    assert.equal(detectFramework({ "survey-js-ui": "^3" }), "vanilla");
    assert.equal(detectFramework({ "survey-core": "^3", next: "^15" }), "react");
    assert.equal(detectFramework({ "survey-core": "^3", "@angular/core": "^19" }), "angular");
    assert.equal(detectFramework({ "survey-core": "^3" }), "vanilla");
  });

});

describe("detect/clients", () => {
  it("detects nothing in a bare project", () => {
    const root = makeTempProject({ "package.json": pkg({}) });
    assert.deepEqual(detectClients(root).detected, []);
  });

  it("does not treat a bare .github directory as Copilot", () => {
    const root = makeTempProject({ ".github/workflows/ci.yml": "name: ci\n" });
    assert.deepEqual(detectClients(root).detected, []);
  });

  it("detects each client from its documented config location", () => {
    const root = makeTempProject({
      ".claude/settings.json": "{}",
      ".cursor/rules/style.mdc": "---\n---\n",
      ".github/copilot-instructions.md": "hi\n",
      "AGENTS.md": "hi\n"
    });
    const { detected, markers } = detectClients(root);
    assert.deepEqual(detected, ["claude", "cursor", "copilot", "agents-md"]);
    assert.ok(markers.claude.includes(".claude/settings.json"));
    assert.ok(markers.copilot.includes(".github/copilot-instructions.md"));
  });
});

describe("skill filtering", () => {
  const skills = loadSkills(SKILLS_ROOT);

  it("every packaged skill declares a skill.meta.json", () => {
    for (const skill of skills) {
      assert.ok(skill.meta.packages.length > 0, skill.name + " declares no packages");
      assert.ok(skill.meta.frameworks.length > 0, skill.name + " declares no frameworks");
    }
  });

  it("never copies skill.meta.json into a consumer project", () => {
    for (const skill of skills) assert.ok(!skill.files.includes("skill.meta.json"));
  });

  it("writes everything when no SurveyJS package is installed", () => {
    assert.equal(selectSkills(skills, { packages: {}, framework: "react" }).length, skills.length);
  });

  it("narrows to the products in use", () => {
    assert.deepEqual(
      selectSkills(skills, { packages: { "survey-analytics": "3.0.1" }, framework: "react" }).map((s) => s.name),
      ["surveyjs-dashboard", "surveyjs-form-json"]
    );
    assert.deepEqual(
      selectSkills(skills, { packages: { "ai-form-response-extractor": "0.1.0" }, framework: null }).map((s) => s.name),
      ["surveyjs-form-json", "surveyjs-response-extractor"]
    );
  });

  it("honours a framework restriction in skill.meta.json", () => {
    const reactOnly = [{ name: "a", meta: { packages: ["survey-core"], frameworks: ["react"] } }];
    assert.equal(selectSkills(reactOnly, { packages: { "survey-core": "3" }, framework: "react" }).length, 1);
    assert.equal(selectSkills(reactOnly, { packages: { "survey-core": "3" }, framework: "vue3" }).length, 0);
    assert.equal(selectSkills(reactOnly, { packages: { "survey-core": "3" }, framework: null }).length, 1);
  });

  it("reads folded frontmatter descriptions and trims them for listings", () => {
    const markdown = "---\nname: x\ndescription: >\n  First clause — second clause.\n---\n\nbody\n";
    assert.equal(readDescription(markdown), "First clause — second clause.");
    assert.equal(summarize(readDescription(markdown)), "First clause");
  });
});
