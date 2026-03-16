function buildProjectPrompt({ projectText, jobDescription }) {
  const schema = {
    qualityScore: 0,
    clarity: 0,
    impact: 0,
    technicalDepth: 0,
    relevance: 0,
    strengths: [],
    improvements: [],
    tags: []
  }
  const instructions = `Evaluate the project description for portfolio readiness. Score quality, clarity, impact, technical depth, and relevance to the provided job if available. Provide strengths, concrete improvements, and tags representing technologies and domains.
Return a strict JSON matching this schema.`
  return { instructions, schema, input: { projectText, jobDescription } }
}

module.exports = { buildProjectPrompt }
