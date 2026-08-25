#!/usr/bin/env node
// Copies plugins/surveyjs/skills/ into cli/skills/ so the published tarball carries the
// skill content while git keeps exactly one copy of it. Run by `npm pack`/`npm publish`
// through the `prepack` script; cli/skills/ is gitignored.
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CLI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(CLI_ROOT, "..", "plugins", "surveyjs", "skills");
const DESTINATION = join(CLI_ROOT, "skills");

if (!existsSync(SOURCE)) {
  console.error(`prepack-skills: source skills directory not found: ${SOURCE}`);
  process.exit(1);
}

rmSync(DESTINATION, { recursive: true, force: true });
cpSync(SOURCE, DESTINATION, { recursive: true });
console.log(`prepack-skills: copied ${SOURCE} -> ${DESTINATION}`);
