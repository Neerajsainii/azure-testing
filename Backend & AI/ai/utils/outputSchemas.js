const Ajv = require('ajv')

const ajv = new Ajv({ allErrors: true, strict: false })

const atsSchema = {
  type: 'object',
  required: ['score','keywordCoverage','sections','recommendations'],
  properties: {
    score: { type: 'number' },
    keywordCoverage: { type: 'object', required: ['present','missing'], properties: { present: { type: 'array' }, missing: { type: 'array' } } },
    sections: { type: 'object' },
    recommendations: { type: 'array' }
  },
  additionalProperties: true
}

const jobSchema = {
  type: 'object',
  required: ['matchScore','fitSummary','topReasons','riskFactors','keywords'],
  properties: {
    matchScore: { type: 'number' },
    fitSummary: { type: 'string' },
    topReasons: { type: 'array' },
    riskFactors: { type: 'array' },
    keywords: { type: 'object', required: ['present','missing'], properties: { present: { type: 'array' }, missing: { type: 'array' } } }
  },
  additionalProperties: true
}

const jobBatchSchema = {
  type: 'object',
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        required: ['jobId','matchScore','fitSummary','topReasons','riskFactors','keywords'],
        properties: {
          jobId: { type: 'string' },
          matchScore: { type: 'number' },
          fitSummary: { type: 'string' },
          topReasons: { type: 'array' },
          riskFactors: { type: 'array' },
          keywords: { type: 'object' }
        }
      }
    }
  },
  additionalProperties: true
}

const projectSchema = {
  type: 'object',
  required: ['qualityScore','clarity','impact','technicalDepth','relevance','strengths','improvements','tags'],
  properties: {
    qualityScore: { type: 'number' },
    clarity: { type: 'number' },
    impact: { type: 'number' },
    technicalDepth: { type: 'number' },
    relevance: { type: 'number' },
    strengths: { type: 'array' },
    improvements: { type: 'array' },
    tags: { type: 'array' }
  },
  additionalProperties: true
}

const skillSchema = {
  type: 'object',
  required: ['skills','normalizedSkills','missingSkills','experienceLevel','summary'],
  properties: {
    skills: { type: 'array' },
    normalizedSkills: { type: 'array' },
    missingSkills: { type: 'array' },
    experienceLevel: { type: 'string' },
    summary: { type: 'string' }
  },
  additionalProperties: true
}

const validateAtsOutput = ajv.compile(atsSchema)
const validateJobOutput = ajv.compile(jobSchema)
const validateJobBatchOutput = ajv.compile(jobBatchSchema)
const validateProjectOutput = ajv.compile(projectSchema)
const validateSkillOutput = ajv.compile(skillSchema)

function validateResult(validator, result) {
  const ok = validator(result)
  return ok ? { ok: true } : { ok: false, errors: validator.errors }
}

module.exports = {
  validateAtsOutput,
  validateJobOutput,
  validateJobBatchOutput,
  validateProjectOutput,
  validateSkillOutput,
  validateResult
}
