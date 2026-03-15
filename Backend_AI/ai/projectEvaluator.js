const { callChatJson } = require('./utils/aiClient')
const { validateProjectInput, validateOrError } = require('./utils/validator')
const { makeError, attachError } = require('./utils/errors')
const { validateProjectOutput, validateResult } = require('./utils/outputSchemas')
const { prepareInput } = require('./utils/responseParser')
const { buildProjectPrompt } = require('./prompts/project.prompt')
const { ensureJsonFromModelResponse } = require('./utils/responseParser')

function buildPrompt({ projectText, jobDescription }) {
  return buildProjectPrompt({ projectText, jobDescription })
}

async function projectEvaluator({ projectText, jobDescription, dryRun = false }) {
  const v = validateOrError(validateProjectInput, { projectText, jobDescription, dryRun })
  if (!v.ok) return attachError({ qualityScore: 0, clarity: 0, impact: 0, technicalDepth: 0, relevance: 0, strengths: [], improvements: [], tags: [] }, makeError('VALIDATION_ERROR', 'Invalid input', 'error', v.errors))
  const prompt = buildPrompt(prepareInput({ projectText, jobDescription }))
  if (dryRun) {
    return {
      qualityScore: 0,
      clarity: 0,
      impact: 0,
      technicalDepth: 0,
      relevance: 0,
      strengths: [],
      improvements: [],
      tags: []
    }
  }
  try {
    const { normalized, meta } = await callChatJson({ instructions: prompt.instructions, schema: prompt.schema, input: prompt.input })
    const coerced = ensureJsonFromModelResponse(JSON.stringify(normalized), {
      qualityScore: 0,
      clarity: 0,
      impact: 0,
      technicalDepth: 0,
      relevance: 0,
      strengths: [],
      improvements: [],
      tags: []
    })
    const outCheck = validateResult(validateProjectOutput, coerced)
    if (!outCheck.ok) return attachError({ qualityScore: 0, clarity: 0, impact: 0, technicalDepth: 0, relevance: 0, strengths: [], improvements: [], tags: [] }, makeError('OUTPUT_VALIDATION_ERROR', 'Invalid output', 'error', outCheck.errors))
    return { ...coerced, meta }
  } catch (e) {
    const msg = String(e.message || e)
    const code = /Missing Azure OpenAI configuration/i.test(msg) ? 'AZURE_OPENAI_CONFIG_MISSING' : 'AZURE_OPENAI_ERROR'
    return attachError({ qualityScore: 0, clarity: 0, impact: 0, technicalDepth: 0, relevance: 0, strengths: [], improvements: [], tags: [] }, makeError(code, msg))
  }
}

module.exports = { projectEvaluator }
