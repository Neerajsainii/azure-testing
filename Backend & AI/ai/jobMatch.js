const { callChatJson } = require('./utils/aiClient')
const { ensureJsonFromModelResponse, truncateInput } = require('./utils/responseParser')
const { validateJobInput, validateJobBatchInput, validateOrError } = require('./utils/validator')
const { makeError, attachError } = require('./utils/errors')
const { validateJobOutput, validateJobBatchOutput, validateResult } = require('./utils/outputSchemas')
const { prepareInput } = require('./utils/responseParser')
const { buildJobPrompt, buildJobBatchPrompt } = require('./prompts/jobMatch.prompt')

function buildPrompt({ resumeText, jobDescription }) {
  return buildJobPrompt({ resumeText, jobDescription })
}

function buildBatchPrompt({ resumeText, jobs }) {
  return buildJobBatchPrompt({ resumeText, jobs })
}

function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out }

async function jobMatchBatch({ resumeText, jobs, dryRun = false, batchLimit = 10 }) {
  if (dryRun) {
    return { results: jobs.map(j => ({ jobId: j.id || '', matchScore: 0, fitSummary: '', topReasons: [], riskFactors: [], keywords: { present: [], missing: [] } })) }
  }
  const v = validateOrError(validateJobBatchInput, { resumeText, jobs, batchLimit, dryRun })
  if (!v.ok) return attachError({ results: [] }, makeError('VALIDATION_ERROR', 'Invalid input', 'error', v.errors))
  try {
    const chunks = chunk(jobs.map(j => truncateInput(j)), batchLimit)
    const merged = []
    let tokens = 0
    let usedModel = 'gpt-4o-mini'
    for (const c of chunks) {
      const prompt = buildBatchPrompt({ resumeText, jobs: c })
      const { normalized, meta } = await callChatJson({ instructions: prompt.instructions, schema: prompt.schema, input: prompt.input })
      const raw = normalized
      tokens += meta && meta.tokensUsed ? meta.tokensUsed : 0
      usedModel = meta && meta.model ? meta.model : usedModel
      const res = ensureJsonFromModelResponse(JSON.stringify(raw), require('./Schemas/match.schema'))
      const outCheck = validateResult(validateJobBatchOutput, res)
      if (!outCheck.ok) return attachError({ results: [] }, makeError('OUTPUT_VALIDATION_ERROR', 'Invalid output', 'error', outCheck.errors))
      if (res && Array.isArray(res.results)) merged.push(...res.results)
    }
    return { results: merged, meta: { model: usedModel, tokensUsed: tokens, timestamp: Date.now(), promptVersion: 1 } }
  } catch (e) {
    const msg = String(e.message || e)
    const code = /Missing Azure OpenAI configuration/i.test(msg) ? 'AZURE_OPENAI_CONFIG_MISSING' : 'AZURE_OPENAI_ERROR'
    return attachError({ results: [] }, makeError(code, msg))
  }
}

async function jobMatch({ resumeText, jobDescription, dryRun = false }) {
  const v = validateOrError(validateJobInput, { resumeText, jobDescription, dryRun })
  if (!v.ok) return attachError({ matchScore: 0, fitSummary: '', topReasons: [], riskFactors: [], keywords: { present: [], missing: [] } }, makeError('VALIDATION_ERROR', 'Invalid input', 'error', v.errors))
  const prompt = buildPrompt(prepareInput({ resumeText, jobDescription }))
  if (dryRun) {
    return {
      matchScore: 0,
      fitSummary: '',
      topReasons: [],
      riskFactors: [],
      keywords: { present: [], missing: [] }
    }
  }
  try {
    const { normalized, meta } = await callChatJson({ instructions: prompt.instructions, schema: prompt.schema, input: prompt.input })
    const result = ensureJsonFromModelResponse(JSON.stringify(normalized), {
      matchScore: 0, fitSummary: '', topReasons: [], riskFactors: [], keywords: { present: [], missing: [] }
    })
    const outCheck = validateResult(validateJobOutput, result)
    if (!outCheck.ok) return attachError({ matchScore: 0, fitSummary: '', topReasons: [], riskFactors: [], keywords: { present: [], missing: [] } }, makeError('OUTPUT_VALIDATION_ERROR', 'Invalid output', 'error', outCheck.errors))
    return { ...result, meta }
  } catch (e) {
    const msg = String(e.message || e)
    const code = /Missing Azure OpenAI configuration/i.test(msg) ? 'AZURE_OPENAI_CONFIG_MISSING' : 'AZURE_OPENAI_ERROR'
    return attachError({ matchScore: 0, fitSummary: '', topReasons: [], riskFactors: [], keywords: { present: [], missing: [] } }, makeError(code, msg))
  }
}

module.exports = { jobMatch, jobMatchBatch }
