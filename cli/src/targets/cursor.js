// Cursor.
//
// Source: https://cursor.com/docs/skills — "Cursor automatically loads skills from
// .agents/skills/, .cursor/skills/, ~/.agents/skills/ and ~/.cursor/skills/". Each skill is a
// folder with a SKILL.md whose `name` must match the folder name. We own that directory.

import { renderSkillFile } from "../content.js";

export const id = "cursor";
export const label = "Cursor";
export const skillsDir = ".cursor/skills";
export const source = "https://cursor.com/docs/skills";
export const ownsDirectory = true;

export function plan({ planner, skills, context }) {
  for (const skill of skills) {
    for (const file of skill.files) {
      planner.file(`${skillsDir}/${skill.name}/${file}`, renderSkillFile(skill, file, context));
    }
  }
}
