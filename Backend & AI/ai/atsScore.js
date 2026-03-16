const { callChatJson } = require('./utils/aiClient')
const { validateAtsInput, validateOrError } = require('./utils/validator')
const { makeError, attachError } = require('./utils/errors')
const { validateAtsOutput, validateResult } = require('./utils/outputSchemas')
const { prepareInput } = require('./utils/responseParser')
const { buildAtsPrompt } = require('./prompts/ats.prompt')

function buildPrompt({ resumeText, jobDescription }) {
  return buildAtsPrompt({ resumeText, jobDescription })
}

async function atsScore({ resumeText, jobDescription, dryRun = false }) {
  const v = validateOrError(validateAtsInput, { resumeText, jobDescription, dryRun })
  if (!v.ok) return attachError({ score: 0, keywordCoverage: { present: [], missing: [] }, sections: { contactInfo: false, education: false, experience: false, skills: false, projects: false }, recommendations: [] }, makeError('VALIDATION_ERROR', 'Invalid input', 'error', v.errors))
  const prompt = buildPrompt(prepareInput({ resumeText, jobDescription }))
  if (dryRun) {
    return {
      score: 0,
      keywordCoverage: { present: [], missing: [] },
      sections: { contactInfo: false, education: false, experience: false, skills: false, projects: false },
      recommendations: []
    }
  }
  try {
    const { normalized, meta } = await callChatJson({ instructions: prompt.instructions, schema: prompt.schema, input: prompt.input })
    const outCheck = validateResult(validateAtsOutput, normalized)
    if (!outCheck.ok) return attachError({ score: 0, keywordCoverage: { present: [], missing: [] }, sections: { contactInfo: false, education: false, experience: false, skills: false, projects: false }, recommendations: [] }, makeError('OUTPUT_VALIDATION_ERROR', 'Invalid output', 'error', outCheck.errors))
    return { ...normalized, meta }
  } catch (e) {
    const msg = String(e.message || e)
    const code = /Missing Azure OpenAI configuration/i.test(msg) ? 'AZURE_OPENAI_CONFIG_MISSING' : 'AZURE_OPENAI_ERROR'
    return attachError({ score: 0, keywordCoverage: { present: [], missing: [] }, sections: { contactInfo: false, education: false, experience: false, skills: false, projects: false }, recommendations: [] }, makeError(code, msg))
  }
}

module.exports = { atsScore }
