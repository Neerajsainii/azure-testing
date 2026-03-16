const MATCH_SCHEMA = require('../Schemas/match.schema')

function buildJobPrompt({ resumeText, jobDescription }) {
  const schema = {
    matchScore: 0,
    fitSummary: '',
    topReasons: [],
    riskFactors: [],
    keywords: { present: [], missing: [] }
  }
  const instructions = `Assess how well the resume matches the job description. Provide a match score from 0 to 100. Summarize fit, list top reasons for the score, and risk factors such as gaps or missing requirements. Include present and missing keywords.
Return a strict JSON matching this schema.`
  return { instructions, schema, input: { resumeText, jobDescription } }
}

function buildJobBatchPrompt({ resumeText, jobs }) {
  const instructions = `Assess job fit for each provided job description. For every job, return jobId and a match result with: matchScore 0-100, fitSummary, topReasons, riskFactors, and keywords present/missing. Return a strict JSON object with a results array matching the schema.`
  return { instructions, schema: MATCH_SCHEMA, input: { resumeText, jobs } }
}

module.exports = { buildJobPrompt, buildJobBatchPrompt }
