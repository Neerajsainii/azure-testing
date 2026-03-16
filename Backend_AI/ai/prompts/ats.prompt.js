const ATS_SCHEMA = require('../Schemas/ats.schema')

function buildAtsPrompt({ resumeText, jobDescription }) {
  const instructions = `Evaluate the resume against the job description using ATS heuristics. Score from 0 to 100 focusing on keyword match, section completeness, formatting simplicity, and clarity. Identify present and missing job keywords. Indicate if standard sections exist. Provide concise recommendations to improve ATS compatibility.
Return a strict JSON matching this schema.`
  return { instructions, schema: ATS_SCHEMA, input: { resumeText, jobDescription } }
}

module.exports = { buildAtsPrompt }
