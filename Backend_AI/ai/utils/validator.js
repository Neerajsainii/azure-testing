const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

const str = { type: 'string', minLength: 1 }

const atsInputSchema = {
  type: 'object',
  required: ['resumeText', 'jobDescription'],
  properties: { resumeText: str, jobDescription: str, dryRun: { type: 'boolean' } }
}

const jobInputSchema = {
  type: 'object',
  required: ['resumeText', 'jobDescription'],
  properties: { resumeText: str, jobDescription: str, dryRun: { type: 'boolean' } }
}

const jobBatchInputSchema = {
  type: 'object',
  required: ['resumeText', 'jobs'],
  properties: {
    resumeText: str,
    jobs: {
      type: 'array', minItems: 1,
      items: { type: 'object', required: ['id', 'jobDescription'], properties: { id: str, jobDescription: str } }
    },
    batchLimit: { type: 'integer', minimum: 1 },
    dryRun: { type: 'boolean' }
  }
}

const projectInputSchema = {
  type: 'object',
  required: ['projectText'],
  properties: { projectText: str, jobDescription: { type: 'string' }, dryRun: { type: 'boolean' } }
}

const skillInputSchema = {
  type: 'object',
  required: ['resumeText'],
  properties: { resumeText: str, jobDescription: { type: 'string' }, dryRun: { type: 'boolean' } }
}

const validateAtsInput = ajv.compile(atsInputSchema)
const validateJobInput = ajv.compile(jobInputSchema)
const validateJobBatchInput = ajv.compile(jobBatchInputSchema)
const validateProjectInput = ajv.compile(projectInputSchema)
const validateSkillInput = ajv.compile(skillInputSchema)

function validateOrError(validator, input) {
  const ok = validator(input)
  return ok ? { ok: true } : { ok: false, errors: validator.errors }
}

module.exports = {
  validateAtsInput,
  validateJobInput,
  validateJobBatchInput,
  validateProjectInput,
  validateSkillInput,
  validateOrError
}
