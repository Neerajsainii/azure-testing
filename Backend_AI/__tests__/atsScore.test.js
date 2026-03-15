const path = require('path')

describe('atsScore', () => {
  beforeEach(() => {
    jest.resetModules()
    delete process.env.AZURE_OPENAI_API_KEY
  })

  test('returns standardized JSON shape with mock resume and JD', async () => {
    jest.mock('openai', () => {
      return {
        AzureOpenAI: jest.fn(() => ({
          chat: {
            completions: {
              create: jest.fn(async () => ({
                choices: [
                  { message: { content: JSON.stringify({
                    score: 80,
                    keywordCoverage: { present: ['js'], missing: ['docker'] },
                    sections: { contactInfo: true, education: true, experience: true, skills: true, projects: true },
                    recommendations: ['add docker keywords']
                  }) } }
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
    const res = await atsScore({ resumeText: 'Mock resume text', jobDescription: 'Mock JD text' })
    expect(typeof res.score).toBe('number')
    expect(res.keywordCoverage).toBeDefined()
    expect(res.sections).toBeDefined()
    expect(Array.isArray(res.recommendations)).toBe(true)
  })
})
