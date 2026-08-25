// GitHub Copilot.
//
// Sources:
//  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills
//    and https://code.visualstudio.com/docs/agent-customization/agent-skills — project agent
//    skills load from `.github/skills/`, `.claude/skills/`, or `.agents/skills/`. We write
//    `.github/skills/<name>/`, the Copilot-native one, and own those directories.
//  - https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions
//    — `.github/copilot-instructions.md` is the always-loaded repository instructions file.
//    We do not own it, so only a marker block inside it is managed.

import { blockBody, renderSkillFile } from "../content.js";

export const id = "copilot";
export const label = "GitHub Copilot";
export const skillsDir = ".github/skills";
export const instructionsFile = ".github/copilot-instructions.md";
export const source =
  "https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills";
export const ownsDirectory = true;

export function plan({ planner, skills, context }) {
  for (const skill of skills) {
    for (const file of skill.files) {
      planner.file(`${skillsDir}/${skill.name}/${file}`, renderSkillFile(skill, file, context));
    }
  }
  planner.block(
    instructionsFile,
    blockBody({ skills, linkPrefix: "skills/", skillsDirLabel: skillsDir, context })
  );
}
