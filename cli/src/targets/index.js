// Target registry. Order here is the order clients are listed and written in.
//
// Deliberately not implemented yet:
//  - Google Gemini CLI and xAI Grok. The plugin under plugins/surveyjs/ supports both, but
//    their per-project skill directory (as opposed to the extension/plugin install path) was
//    not confirmed against their own current documentation. Writing a guessed path would put
//    files in someone's repository that silently never load, so both are served by the
//    portable `agents-md` target until their conventions are verified.
//  - Windsurf, Cline, Zed, JetBrains AI. Same reason.
// Adding one means: a module here, an entry in this list, detection markers in
// src/detect/clients.js, and a link to the client's own docs for the path.

import * as claude from "./claude.js";
import * as cursor from "./cursor.js";
import * as copilot from "./copilot.js";
import * as agentsMd from "./agents-md.js";

export const TARGETS = [claude, cursor, copilot, agentsMd];
export const TARGET_IDS = TARGETS.map((target) => target.id);

export function getTarget(id) {
  return TARGETS.find((target) => target.id === id) ?? null;
}
