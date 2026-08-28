#!/usr/bin/env node
import process from "node:process";

import { runDoctor } from "../src/commands/doctor.js";
import { runInitAgents } from "../src/commands/init-agents.js";
import { runUpdate } from "../src/commands/update.js";
import { cliVersion } from "../src/manifest.js";
import { CLIENT_DEFINITIONS } from "../src/detect/clients.js";

const USAGE = `survey-cli <command> [options]

Commands
  init-agents   Detect this project's SurveyJS packages and AI clients, then write the
                matching SurveyJS agent skills into each client's directory.
  doctor        Compare .surveyjs-skills.json against what is installed now.
  update        Re-run placement for the clients already recorded.

Options
  --client=<name>  Write for this client. Repeatable. Known clients:
${CLIENT_DEFINITIONS.map((client) => `                     ${client.id.padEnd(10)} ${client.label}`).join("\n")}
  --all            Write for every known client.
  --yes, -y        Never prompt. Use for CI.
  --dry-run        Print what would change without touching disk.
  --force          Overwrite files at owned paths that a previous run did not write.
  --help, -h       Show this help.
  --version, -v    Print the survey-cli version.

survey-cli makes no network calls and collects no telemetry.
`;

function parseArgv(argv) {
  const flags = { client: [], all: false, yes: false, dryRun: false, force: false, help: false, version: false };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") flags.all = true;
    else if (arg === "--yes" || arg === "-y") flags.yes = true;
    else if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--force") flags.force = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg === "--version" || arg === "-v") flags.version = true;
    else if (arg.startsWith("--client=")) flags.client.push(...splitList(arg.slice("--client=".length)));
    else if (arg === "--client") flags.client.push(...splitList(argv[++index] ?? ""));
    else if (arg.startsWith("-")) return { error: `Unknown option: ${arg}` };
    else positional.push(arg);
  }

  return { command: positional[0], extra: positional.slice(1), flags };
}

const splitList = (value) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const parsed = parseArgv(process.argv.slice(2));

if (parsed.error) {
  process.stderr.write(`${parsed.error}\n\n${USAGE}`);
  process.exit(2);
}
if (parsed.flags.version) {
  process.stdout.write(`${cliVersion()}\n`);
  process.exit(0);
}
if (parsed.flags.help || !parsed.command) {
  process.stdout.write(USAGE);
  process.exit(parsed.command ? 0 : parsed.flags.help ? 0 : 2);
}
if (parsed.extra.length > 0) {
  process.stderr.write(`Unexpected argument: ${parsed.extra[0]}\n\n${USAGE}`);
  process.exit(2);
}

const commands = {
  "init-agents": () => runInitAgents({ root: process.cwd(), flags: parsed.flags }),
  doctor: () => runDoctor({ root: process.cwd() }),
  update: () => runUpdate({ root: process.cwd(), flags: parsed.flags })
};

const command = commands[parsed.command];
if (!command) {
  process.stderr.write(`Unknown command: ${parsed.command}\n\n${USAGE}`);
  process.exit(2);
}

try {
  const result = await command();
  process.exit(result?.code ?? 0);
} catch (error) {
  process.stderr.write(`survey-cli: ${error?.message ?? error}\n`);
  process.exit(1);
}
