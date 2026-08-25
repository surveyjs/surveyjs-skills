// Claude Code.
//
// Source: https://code.claude.com/docs/en/skills — "Where skills live": project skills load
// from `.claude/skills/<skill-name>/SKILL.md`, and a skill is a directory that may carry
// supporting files alongside SKILL.md. We own that directory, so whole directories are copied.

import { renderSkillFile } from "../content.js";

export const id = "claude";
export const label = "Claude Code";
export const skillsDir = ".claude/skills";
export const source = "https://code.claude.com/docs/en/skills";
export const ownsDirectory = true;

export function plan({ planner, skills, context }) {
  for (const skill of skills) {
    for (const file of skill.files) {
      planner.file(`${skillsDir}/${skill.name}/${file}`, renderSkillFile(skill, file, context));
    }
  }
}
