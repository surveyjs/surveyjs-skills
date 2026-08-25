// `survey-cli update` — re-run placement for the clients already recorded, nothing else.

import process from "node:process";

import { MANIFEST_FILE, readManifest } from "../manifest.js";
import { runInitAgents } from "./init-agents.js";

export async function runUpdate({
  root = process.cwd(),
  flags = {},
  out = process.stdout,
  err = process.stderr,
  skillsRoot
} = {}) {
  const manifest = readManifest(root);
  if (!manifest) {
    err.write(`No ${MANIFEST_FILE} in ${root}. Run \`npx survey-cli@latest init-agents\` first.\n`);
    return { code: 1, written: [], removed: [] };
  }

  const clients = Array.isArray(manifest.clients) ? manifest.clients : [];
  if (clients.length === 0) {
    err.write(`${MANIFEST_FILE} records no clients. Run \`npx survey-cli@latest init-agents\` instead.\n`);
    return { code: 1, written: [], removed: [] };
  }

  out.write(`Updating recorded clients: ${clients.join(", ")}\n`);
  return runInitAgents({
    root,
    // `update` never re-asks and never re-detects clients: it refreshes what is recorded.
    flags: { ...flags, client: clients, all: false, yes: true },
    out,
    err,
    skillsRoot
  });
}
