const path = require('path')

describe('skillExtractor', () => {
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
                    skills: [ { name: 'JavaScript', category: 'Language', level: 'Novice', source: 'resume', evidence: '2 projects' } ],
                    normalizedSkills: [],
                    missingSkills: [ { name: 'Docker', category: 'DevOps', reason: 'required in JD' } ],
                    experienceLevel: 'Intermediate',
                    summary: 'Web developer. Experience in JS.'
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
    const { extractSkills } = require(path.join('..', 'ai', 'skillExtractor'))
    const res = await extractSkills({ resumeText: 'Mock resume text', jobDescription: 'Mock JD text' })
    expect(Array.isArray(res.skills)).toBe(true)
    expect(Array.isArray(res.normalizedSkills)).toBe(true)
    expect(Array.isArray(res.missingSkills)).toBe(true)
  })
})
