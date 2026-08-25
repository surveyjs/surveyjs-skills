// AGENTS.md agents (OpenAI Codex, Gemini CLI, Jules, and anything else reading AGENTS.md).
//
// Sources:
//  - https://agents.md/ — "Create an AGENTS.md file at the root of the repository"; plain
//    Markdown, no required sections. It is the project's own file, so only a marker block
//    inside it is managed and the rest is never rewritten.
//  - `.agents/skills/` is the client-neutral skills location documented by both
//    https://cursor.com/docs/skills and GitHub Copilot's agent-skills docs, so the skill
//    directories themselves go there and AGENTS.md points at them.

import { blockBody, renderSkillFile } from "../content.js";

export const id = "agents-md";
export const label = "AGENTS.md agents (OpenAI Codex, Gemini CLI, Jules, and other AGENTS.md readers)";
export const skillsDir = ".agents/skills";
export const instructionsFile = "AGENTS.md";
export const source = "https://agents.md/";
export const ownsDirectory = true;

export function plan({ planner, skills, context }) {
  for (const skill of skills) {
    for (const file of skill.files) {
      planner.file(`${skillsDir}/${skill.name}/${file}`, renderSkillFile(skill, file, context));
    }
  }
  planner.block(
    instructionsFile,
    blockBody({ skills, linkPrefix: `${skillsDir}/`, skillsDirLabel: skillsDir, context })
  );
}
