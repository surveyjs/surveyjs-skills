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
const REQUEST_TIMEOUT_MS = 20_000;

/** Upstream page -> the skill files whose content depends on it. */
const WATCHED = {
  "https://surveyjs.io/llms.txt": [
    "surveyjs-integration/SKILL.md",
    "surveyjs-dashboard/SKILL.md",
    "surveyjs-pdf-generator/SKILL.md",
    "surveyjs-response-extractor/SKILL.md"
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
    "surveyjs-dashboard/references/theming.md",
    "surveyjs-brand-styling/references/theming.md",
    "surveyjs-brand-styling/references/predefined-themes.md"
  ],
  "https://surveyjs.io/documentation/design-tokens-css-customization.md": [
    "surveyjs-integration/references/theming.md",
    "surveyjs-brand-styling/references/design-tokens.md",
    "surveyjs-brand-styling/references/custom-css.md"
  ],
  "https://surveyjs.io/documentation/theme-adapters.md": [
    "surveyjs-integration/references/theming.md",
    "surveyjs-brand-styling/references/theme-adapters.md"
  ],
  "https://surveyjs.io/documentation/backend-integration.md": [
    "surveyjs-integration/references/data-and-events.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/get-started-react.md": [
    "surveyjs-creator-customization/references/setup.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/get-started-angular.md": [
    "surveyjs-creator-customization/references/setup.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/get-started-vue.md": [
    "surveyjs-creator-customization/references/setup.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/get-started-html-css-javascript.md": [
    "surveyjs-creator-customization/references/setup.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/integration-with-backend.md": [
    "surveyjs-creator-customization/references/setup.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/api-reference/survey-creator.md": [
    "surveyjs-creator-customization/SKILL.md",
    "surveyjs-creator-customization/references/renamed-api.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/toolbox-customization.md": [
    "surveyjs-creator-customization/references/customization.md",
    "surveyjs-creator-presets/references/preset-json.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/property-grid-customization.md": [
    "surveyjs-creator-customization/references/customization.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/ui-preset-editor.md": [
    "surveyjs-creator-customization/references/ui-presets.md",
    "surveyjs-creator-presets/SKILL.md",
    "surveyjs-creator-presets/references/preset-editor.md",
    "surveyjs-creator-presets/references/predefined-presets.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/api-reference/uipreset.md": [
    "surveyjs-creator-presets/SKILL.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/api-reference/ipreset.md": [
    "surveyjs-creator-presets/references/preset-json.md"
  ],
  "https://surveyjs.io/survey-creator/examples/ui-preset-editor/documentation.md": [
    "surveyjs-creator-presets/references/preset-editor.md"
  ],
  "https://surveyjs.io/survey-creator/examples/basic-ui-preset/documentation.md": [
    "surveyjs-creator-presets/references/predefined-presets.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/survey-creator/master/packages/survey-creator-core/src/ui-presets-creator/presets.ts": [
    "surveyjs-creator-presets/SKILL.md",
    "surveyjs-creator-presets/references/preset-json.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/survey-creator/master/packages/survey-creator-core/src/ui-presets-creator/presets-toolbox.ts": [
    "surveyjs-creator-presets/references/preset-json.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/survey-creator/master/packages/survey-creator-core/src/ui-presets/basic.ts": [
    "surveyjs-creator-presets/references/predefined-presets.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/survey-creator/master/packages/survey-creator-core/src/ui-presets/advanced.ts": [
    "surveyjs-creator-presets/references/predefined-presets.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/survey-creator/master/packages/survey-creator-core/src/ui-presets/expert.ts": [
    "surveyjs-creator-presets/references/predefined-presets.md"
  ],
  "https://surveyjs.io/survey-creator/documentation/theme-editor.md": [
    "surveyjs-creator-customization/references/theming.md"
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
  ],
  "https://surveyjs.io/pdf-generator/documentation/overview.md": [
    "surveyjs-pdf-generator/SKILL.md",
    "surveyjs-pdf-generator/references/troubleshooting.md"
  ],
  "https://surveyjs.io/pdf-generator/documentation/get-started-react.md": [
    "surveyjs-pdf-generator/references/setup.md"
  ],
  "https://surveyjs.io/pdf-generator/documentation/get-started-angular.md": [
    "surveyjs-pdf-generator/references/setup.md"
  ],
  "https://surveyjs.io/pdf-generator/documentation/get-started-vue.md": [
    "surveyjs-pdf-generator/references/setup.md"
  ],
  "https://surveyjs.io/pdf-generator/documentation/get-started-html-css-javascript.md": [
    "surveyjs-pdf-generator/references/setup.md"
  ],
  "https://surveyjs.io/pdf-generator/documentation/api-reference/idocoptions.md": [
    "surveyjs-pdf-generator/references/setup.md",
    "surveyjs-pdf-generator/references/appearance.md"
  ],
  "https://surveyjs.io/pdf-generator/documentation/pdf-appearance-customization.md": [
    "surveyjs-pdf-generator/references/appearance.md"
  ],
  "https://surveyjs.io/pdf-generator/examples/customize-header-and-footer-of-pdf-form/documentation.md": [
    "surveyjs-pdf-generator/references/appearance.md"
  ],
  "https://surveyjs.io/pdf-generator/examples/change-font-in-pdf-form/documentation.md": [
    "surveyjs-pdf-generator/references/appearance.md"
  ],
  "https://surveyjs.io/pdf-generator/examples/special-characters-in-pdf-form/documentation.md": [
    "surveyjs-pdf-generator/references/appearance.md",
    "surveyjs-pdf-generator/references/troubleshooting.md"
  ],
  "https://surveyjs.io/pdf-generator/examples/how-to-create-read-only-pdf-form/documentation.md": [
    "surveyjs-pdf-generator/references/setup.md"
  ],
  "https://surveyjs.io/pdf-generator/examples/convert-pdf-form-blob-base64-raw-pdf-javascript/documentation.md": [
    "surveyjs-pdf-generator/references/setup.md"
  ],
  "https://surveyjs.io/pdf-generator/examples/map-survey-responses-to-pdf-fields-using-pdflib/documentation.md": [
    "surveyjs-pdf-generator/references/existing-pdf-forms.md"
  ],
  "https://surveyjs.io/pdf-generator/examples/fill-in-pdf-form-fields-with-dynamic-survey-data-using-pdfjs/documentation.md": [
    "surveyjs-pdf-generator/references/existing-pdf-forms.md"
  ],
  "https://surveyjs.io/documentation/combine-paper-and-online-survey-form-data.md": [
    "surveyjs-response-extractor/SKILL.md",
    "surveyjs-response-extractor/references/review-and-merge.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/ai-form-response-extractor/main/README.md": [
    "surveyjs-response-extractor/SKILL.md",
    "surveyjs-response-extractor/references/setup-and-inputs.md",
    "surveyjs-response-extractor/references/providers-and-privacy.md",
    "surveyjs-response-extractor/references/schemas-and-validation.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/ai-form-response-extractor/main/src/index.ts": [
    "surveyjs-response-extractor/SKILL.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/ai-form-response-extractor/main/src/core/types.ts": [
    "surveyjs-response-extractor/references/setup-and-inputs.md",
    "surveyjs-response-extractor/references/schemas-and-validation.md"
  ],
  "https://raw.githubusercontent.com/surveyjs/ai-form-response-extractor/main/src/utils/merging.ts": [
    "surveyjs-response-extractor/references/review-and-merge.md"
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
      const res = await fetch(url, {
        headers: { accept: "text/plain, text/markdown" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
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
