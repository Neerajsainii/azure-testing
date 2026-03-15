const SKILL_SCHEMA = require('../Schemas/skill.schema')

function buildSkillPrompt({ resumeText, jobDescription }) {
  const instructions = `Extract skills and analyze profile.
Return JSON matching the schema exactly. Constraints:
- Categories allowed: languages, frameworks, libraries, tools, cloud, databases, platforms, devOps, testing, softSkills.
- Levels allowed: beginner, intermediate, advanced, expert.
- experienceLevel must be one of the allowed levels.
- summary must be 2 sentences max.`
  return { instructions, schema: SKILL_SCHEMA, input: { resumeText, jobDescription } }
}

module.exports = { buildSkillPrompt }
