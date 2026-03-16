const { callChatJson } = require('./utils/aiClient')
const { validateSkillInput, validateOrError } = require('./utils/validator')
const { makeError, attachError } = require('./utils/errors')
const { validateSkillOutput, validateResult } = require('./utils/outputSchemas')
const { prepareInput } = require('./utils/responseParser')
const { buildSkillPrompt } = require('./prompts/skill.prompt')
const { ensureJsonFromModelResponse } = require('./utils/responseParser')

function buildPrompt({ resumeText, jobDescription }) {
  return buildSkillPrompt({ resumeText, jobDescription })
}

async function callOpenAI(prompt) {
  const { normalized } = await callChatJson({ instructions: prompt.instructions, schema: prompt.schema, input: prompt.input })
  return normalized
}

const CATEGORIES = new Map([
  ['language', 'languages'],
  ['languages', 'languages'],
  ['framework', 'frameworks'],
  ['frameworks', 'frameworks'],
  ['library', 'libraries'],
  ['libraries', 'libraries'],
  ['tool', 'tools'],
  ['tools', 'tools'],
  ['cloud', 'cloud'],
  ['db', 'databases'],
  ['database', 'databases'],
  ['databases', 'databases'],
  ['platform', 'platforms'],
  ['platforms', 'platforms'],
  ['devops', 'devOps'],
  ['testing', 'testing'],
  ['softskills', 'softSkills'],
  ['soft skills', 'softSkills']
])

const LEVELS = new Map([
  ['beginner', 'beginner'],
  ['novice', 'beginner'],
  ['junior', 'beginner'],
  ['intermediate', 'intermediate'],
  ['mid', 'intermediate'],
  ['proficient', 'advanced'],
  ['advanced', 'advanced'],
  ['senior', 'advanced'],
  ['expert', 'expert']
])

function normalizeCategory(val) {
  if (!val) return 'tools'
  const k = String(val).toLowerCase().trim()
  return CATEGORIES.get(k) || 'tools'
}

function normalizeLevel(val) {
  if (!val) return 'intermediate'
  const k = String(val).toLowerCase().trim()
  return LEVELS.get(k) || 'intermediate'
}

function normalizeResult(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const skills = Array.isArray(obj.skills) ? obj.skills.map(s => ({
    name: s && s.name ? s.name : '',
    category: normalizeCategory(s && s.category),
    level: normalizeLevel(s && s.level),
    source: s && s.source ? s.source : '',
    evidence: s && s.evidence ? s.evidence : ''
  })) : []
  const missingSkills = Array.isArray(obj.missingSkills) ? obj.missingSkills.map(s => ({
    name: s && s.name ? s.name : '',
    category: normalizeCategory(s && s.category),
    reason: s && s.reason ? s.reason : ''
  })) : []
  const normalizedSkills = skills.map(s => ({ ...s }))
  const experienceLevel = normalizeLevel(obj.experienceLevel)
  const summary = typeof obj.summary === 'string' ? obj.summary : ''
  return { skills, normalizedSkills, missingSkills, experienceLevel, summary }
}

async function extractAndAnalyze({ resumeText, jobDescription, dryRun = false }) {
  const v = validateOrError(validateSkillInput, { resumeText, jobDescription, dryRun })
  if (!v.ok) return attachError({ skills: [], normalizedSkills: [], missingSkills: [], experienceLevel: 'intermediate', summary: '' }, makeError('VALIDATION_ERROR', 'Invalid input', 'error', v.errors))
  const input = prepareInput({ resumeText, jobDescription })
  const prompt = buildPrompt(input)
  if (dryRun) {
    return { skills: [], normalizedSkills: [], missingSkills: [], experienceLevel: 'intermediate', summary: '' }
  }
  try {
    const raw = await callOpenAI(prompt)
    const schemaJson = ensureJsonFromModelResponse(JSON.stringify(raw), require('./Schemas/skill.schema'))
    const normalizedFinal = normalizeResult(schemaJson)
    const outCheck = validateResult(validateSkillOutput, normalizedFinal)
    if (!outCheck.ok) return attachError({ skills: [], normalizedSkills: [], missingSkills: [], experienceLevel: 'intermediate', summary: '' }, makeError('OUTPUT_VALIDATION_ERROR', 'Invalid output', 'error', outCheck.errors))
    return normalizedFinal
  } catch (e) {
    const msg = String(e.message || e)
    const code = /Missing Azure OpenAI configuration/i.test(msg) ? 'AZURE_OPENAI_CONFIG_MISSING' : 'AZURE_OPENAI_ERROR'
    return attachError({ skills: [], normalizedSkills: [], missingSkills: [], experienceLevel: 'intermediate', summary: '' }, makeError(code, msg))
  }
}

async function extractSkills({ resumeText, jobDescription, dryRun = false }) {
  const res = await extractAndAnalyze({ resumeText, jobDescription, dryRun })
  if (res && res.error) return { skills: [], normalizedSkills: [], missingSkills: [], error: res.error }
  return { skills: res.skills, normalizedSkills: res.normalizedSkills, missingSkills: res.missingSkills }
}

async function profileAnalysis({ resumeText, jobDescription, dryRun = false }) {
  const res = await extractAndAnalyze({ resumeText, jobDescription, dryRun })
  if (res && res.error) return { experienceLevel: 'intermediate', summary: '', error: res.error }
  return { experienceLevel: res.experienceLevel, summary: res.summary }
}

module.exports = { extractSkills, extractAndAnalyze, profileAnalysis }
