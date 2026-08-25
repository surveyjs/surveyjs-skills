// Which AI coding clients this project already uses, judged by the config files and
// directories each one documents. Every marker below is a path the client itself reads;
// none of them is a guess.

import { existsSync } from "node:fs";
import { join } from "node:path";

export const CLIENT_DEFINITIONS = [
  {
    id: "claude",
    label: "Claude Code",
    // https://code.claude.com/docs/en/skills — "Project | .claude/skills/<skill-name>/SKILL.md"
    markers: [".claude/skills", ".claude/settings.json", ".claude", "CLAUDE.md"]
  },
  {
    id: "cursor",
    label: "Cursor",
    // https://cursor.com/docs/skills — project skills load from .cursor/skills/ and .agents/skills/
    markers: [".cursor/skills", ".cursor/rules", ".cursor", ".cursorrules"]
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    // https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills
    // and https://code.visualstudio.com/docs/agent-customization/agent-skills — .github/skills/
    // https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions
    // — .github/copilot-instructions.md
    // Bare .github/ is deliberately not a marker: nearly every repository has one.
    markers: [
      ".github/skills",
      ".github/copilot-instructions.md",
      ".github/instructions",
      ".github/prompts",
      ".github/chatmodes",
      ".vscode/mcp.json"
    ]
  },
  {
    id: "agents-md",
    label: "AGENTS.md agents (OpenAI Codex, Gemini CLI, Jules, and other AGENTS.md readers)",
    // https://agents.md/ — AGENTS.md at the repository root; .agents/skills/ is the shared
    // skills location Cursor and Copilot also document.
    markers: ["AGENTS.md", ".agents/skills", ".agents"]
  }
];

export const CLIENT_IDS = CLIENT_DEFINITIONS.map((client) => client.id);

/**
 * @returns {{ detected: string[], markers: Record<string, string[]> }}
 */
export function detectClients(root) {
  const detected = [];
  const markers = {};

  for (const client of CLIENT_DEFINITIONS) {
    const found = client.markers.filter((marker) => existsSync(join(root, ...marker.split("/"))));
    markers[client.id] = found;
    if (found.length > 0) detected.push(client.id);
  }

  return { detected, markers };
}

export function clientLabel(id) {
  return CLIENT_DEFINITIONS.find((client) => client.id === id)?.label ?? id;
}
