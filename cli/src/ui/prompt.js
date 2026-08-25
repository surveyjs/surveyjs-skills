// Minimal readline prompts. No prompt library, and every prompt has a non-interactive
// answer so --yes (or a non-TTY stdin, as in CI) never blocks.

import { createInterface } from "node:readline";
import process from "node:process";

export function isInteractive({ input = process.stdin, output = process.stdout } = {}) {
  return Boolean(input.isTTY && output.isTTY);
}

async function ask(question, { input = process.stdin, output = process.stdout } = {}) {
  const rl = createInterface({ input, output });
  try {
    return await new Promise((resolve) => rl.question(question, resolve));
  } finally {
    rl.close();
  }
}

/**
 * Ask which clients to write to. Empty input keeps `preselected`.
 * @param {{ options: Array<{ id: string, label: string, detected: boolean }>, preselected: string[] }} config
 */
export async function selectClients({ options, preselected, io = {} }) {
  const output = io.output ?? process.stdout;
  output.write("\nWhich AI clients should the SurveyJS skills be written for?\n\n");
  options.forEach((option, index) => {
    const mark = preselected.includes(option.id) ? "x" : " ";
    const note = option.detected ? " (detected)" : "";
    output.write(`  ${index + 1}. [${mark}] ${option.label}${note}\n`);
  });

  const answer = (
    await ask("\nNumbers separated by commas, 'all', or Enter to accept the selection above: ", io)
  ).trim();

  if (answer === "") return [...preselected];
  if (/^all$/i.test(answer)) return options.map((option) => option.id);

  const chosen = [];
  for (const token of answer.split(/[,\s]+/).filter(Boolean)) {
    const index = Number.parseInt(token, 10) - 1;
    const option = options[index];
    if (option && !chosen.includes(option.id)) chosen.push(option.id);
  }
  return chosen;
}

export async function confirm(question, { defaultValue = true, io = {} } = {}) {
  const suffix = defaultValue ? " [Y/n] " : " [y/N] ";
  const answer = (await ask(`${question}${suffix}`, io)).trim();
  if (answer === "") return defaultValue;
  return /^y(es)?$/i.test(answer);
}
