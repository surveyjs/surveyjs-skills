#!/usr/bin/env node
/**
 * Fetches the upstream SurveyJS docs that the skills are written against and
 * reports when they change, so reference files can be reviewed by hand.
 *
 * Snapshots live in scripts/.doc-snapshots/ as sha256 hashes.
 *
 *   node scripts/check-upstream-docs.mjs           # report drift, exit 1 if any
 *   node scripts/check-upstream-docs.mjs --update  # accept current upstream
 *
 * This intentionally does NOT rewrite the reference files. They contain
 * hand-written judgement (which mistakes to warn about, what to check first)
 * that a scraper would destroy. Drift is a signal to review, not to regenerate.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = join(HERE, ".doc-snapshots");

/** Upstream page -> the skill files whose content depends on it. */
const WATCHED = {
  "https://surveyjs.io/llms.txt": [
    "surveyjs-integration/SKILL.md",
    "surveyjs-dashboard/SKILL.md"
  ],
  "https://surveyjs.io/form-library/documentation/get-started-react.md": [
    "surveyjs-integration/references/react.md"
  ],
  "https://surveyjs.io/form-library/documentation/get-started-angular.md": [
    "surveyjs-integration/references/angular.md"
  ],
  "https://surveyjs.io/form-library/documentation/get-started-vue.md": [
    "surveyjs-integration/references/vue.md"
  ],
  "https://surveyjs.io/form-library/documentation/get-started-html-css-javascript.md": [
    "surveyjs-integration/references/vanilla-js.md"
  ],
  "https://surveyjs.io/documentation/themes-and-custom-styles.md": [
    "surveyjs-integration/references/theming.md",
    "surveyjs-dashboard/references/theming.md"
  ],
  "https://surveyjs.io/documentation/design-tokens-css-customization.md": [
    "surveyjs-integration/references/theming.md"
  ],
  "https://surveyjs.io/documentation/theme-adapters.md": [
    "surveyjs-integration/references/theming.md"
  ],
  "https://surveyjs.io/documentation/backend-integration.md": [
    "surveyjs-integration/references/data-and-events.md"
  ],
  "https://surveyjs.io/dashboard/documentation/get-started-react.md": [
    "surveyjs-dashboard/references/frameworks.md",
    "surveyjs-dashboard/references/setup-and-data.md"
  ],
  "https://surveyjs.io/dashboard/documentation/get-started-angular.md": [
    "surveyjs-dashboard/references/frameworks.md"
  ],
  "https://surveyjs.io/dashboard/documentation/get-started-vue.md": [
    "surveyjs-dashboard/references/frameworks.md"
  ],
  "https://surveyjs.io/dashboard/documentation/get-started-html-css-javascript.md": [
    "surveyjs-dashboard/references/frameworks.md"
  ],
  "https://surveyjs.io/dashboard/documentation/chart-types.md": [
    "surveyjs-dashboard/references/setup-and-data.md"
  ],
  "https://surveyjs.io/dashboard/documentation/api-reference/dashboard.md": [
    "surveyjs-dashboard/references/customization.md"
  ],
  "https://surveyjs.io/dashboard/documentation/api-reference/idashboardoptions.md": [
    "surveyjs-dashboard/references/setup-and-data.md",
    "surveyjs-dashboard/references/customization.md"
  ],
  "https://surveyjs.io/dashboard/documentation/api-reference/idashboarditemoptions.md": [
    "surveyjs-dashboard/references/setup-and-data.md"
  ],
  "https://surveyjs.io/dashboard/documentation/api-reference/ivisualizationpaneloptions.md": [
    "surveyjs-dashboard/references/customization.md"
  ],
  "https://surveyjs.io/dashboard/documentation/api-reference/visualizationpanel.md": [
    "surveyjs-dashboard/SKILL.md"
  ],
  "https://surveyjs.io/dashboard/documentation/set-up-table-view/react.md": [
    "surveyjs-dashboard/references/customization.md"
  ],
  "https://surveyjs.io/dashboard/examples/localize-survey-data-dashboard-ui/documentation.md": [
    "surveyjs-dashboard/references/customization.md"
  ],
  "https://surveyjs.io/dashboard/examples/save-dashboard-state-to-local-storage/documentation.md": [
    "surveyjs-dashboard/references/customization.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/surveyjs-howtos-and-troubleshooting/main/categories/data-visualization/custom-survey-data-visualizer.md": [
    "surveyjs-dashboard/references/customization.md"
  ]
};

const slug = (url) => url.replace(/^https:\/\//, "").replace(/[^a-z0-9]+/gi, "-");
const sha = (text) => createHash("sha256").update(text).digest("hex");

async function readSnapshot(url) {
  try {
    return (await readFile(join(SNAPSHOT_DIR, `${slug(url)}.sha256`), "utf8")).trim();
  } catch {
    return null;
  }
}

async function main() {
  const update = process.argv.includes("--update");
  await mkdir(SNAPSHOT_DIR, { recursive: true });

  const drifted = [];
  const failed = [];

  for (const [url, dependents] of Object.entries(WATCHED)) {
    let body;
    try {
      const res = await fetch(url, { headers: { accept: "text/plain, text/markdown" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body = await res.text();
    } catch (err) {
      failed.push({ url, reason: err.message });
      continue;
    }

    const current = sha(body);
    const previous = await readSnapshot(url);

    if (update || previous === null) {
      await writeFile(join(SNAPSHOT_DIR, `${slug(url)}.sha256`), `${current}\n`);
      if (previous === null && !update) {
        console.log(`baseline recorded  ${url}`);
      }
      continue;
    }

    if (previous !== current) drifted.push({ url, dependents });
  }

  for (const { url, reason } of failed) {
    console.error(`could not fetch    ${url} (${reason})`);
  }

  if (drifted.length === 0) {
    console.log(failed.length ? "No drift in the pages that were reachable." : "No drift.");
    return failed.length ? 2 : 0;
  }

  console.log(`\n${drifted.length} upstream page(s) changed:\n`);
  for (const { url, dependents } of drifted) {
    console.log(`  ${url}`);
    for (const file of dependents) console.log(`    review: plugins/surveyjs/skills/${file}`);
  }
  console.log(
    "\nRe-read the changed pages, update the reference files where the facts moved,\n" +
      "then run with --update to accept the new baseline.\n"
  );
  return 1;
}

process.exit(await main());
