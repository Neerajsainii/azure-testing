const path = require('path')
const Ajv = require('ajv')

describe('JSON contract validation', () => {
  test('atsScore output matches schema', async () => {
    jest.resetModules()
    jest.mock('openai', () => {
      return {
        AzureOpenAI: jest.fn(() => ({
          chat: {
            completions: {
              create: jest.fn(async () => ({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        score: 80,
                        keywordCoverage: { present: ['js'], missing: [] },
                        sections: { contactInfo: true, education: true, experience: true, skills: true, projects: true },
                        recommendations: []
                      })
                    }
                  }
                ]
              }))
            }
          }
        }))
      }
    })
    process.env.AZURE_OPENAI_API_KEY = 'test-azure-key'
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example.openai.azure.com'
    process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o-mini'
    const { atsScore } = require(path.join('..', 'ai', 'atsScore'))
    const res = await atsScore({ resumeText: 'a', jobDescription: 'b' })
    const ajv = new Ajv({ allErrors: true })
    const schema = {
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
    const validate = ajv.compile(schema)
    expect(validate(res)).toBe(true)
  })

  test('jobMatch output matches schema', async () => {
    jest.resetModules()
    jest.mock('openai', () => {
      return {
        AzureOpenAI: jest.fn(() => ({
          chat: {
            completions: {
              create: jest.fn(async () => ({
                choices: [
                  { message: { content: JSON.stringify({ matchScore: 88, fitSummary: 'ok', topReasons: ['skills'], riskFactors: [], keywords: { present: ['js'], missing: [] } }) } }
                ]
              }))
            }
          }
        }))
      }
    })
    process.env.AZURE_OPENAI_API_KEY = 'test-azure-key'
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example.openai.azure.com'
    process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o-mini'
    const { jobMatch } = require(path.join('..', 'ai', 'jobMatch'))
    const res = await jobMatch({ resumeText: 'a', jobDescription: 'b' })
    const ajv = new Ajv({ allErrors: true })
    const schema = { type: 'object', required: ['matchScore','fitSummary','topReasons','riskFactors','keywords'], properties: { matchScore: { type: 'number' }, fitSummary: { type: 'string' }, topReasons: { type: 'array' }, riskFactors: { type: 'array' }, keywords: { type: 'object' } }, additionalProperties: true }
    const validate = ajv.compile(schema)
    expect(validate(res)).toBe(true)
  })

  test('skillExtractor output matches schema', async () => {
    jest.resetModules()
    jest.mock('openai', () => {
      return {
        AzureOpenAI: jest.fn(() => ({
          chat: {
            completions: {
              create: jest.fn(async () => ({
                choices: [
                  { message: { content: JSON.stringify({ skills: [], normalizedSkills: [], missingSkills: [], experienceLevel: 'intermediate', summary: '' }) } }
                ]
              }))
            }
          }
        }))
      }
    })
    process.env.AZURE_OPENAI_API_KEY = 'test-azure-key'
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example.openai.azure.com'
    process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o-mini'
    const { extractSkills } = require(path.join('..', 'ai', 'skillExtractor'))
    const res = await extractSkills({ resumeText: 'a', jobDescription: 'b' })
    const ajv = new Ajv({ allErrors: true })
    const schema = {
      type: 'object',
      required: ['skills','normalizedSkills','missingSkills'],
      properties: {
        skills: { type: 'array' },
        normalizedSkills: { type: 'array' },
        missingSkills: { type: 'array' },
        experienceLevel: { type: 'string' },
        summary: { type: 'string' }
      },
      additionalProperties: true
    }
    const validate = ajv.compile(schema)
    expect(validate(res)).toBe(true)
  })
})
