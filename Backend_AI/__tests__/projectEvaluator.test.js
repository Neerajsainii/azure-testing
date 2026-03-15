const path = require('path')

describe('projectEvaluator', () => {
  beforeEach(() => {
    jest.resetModules()
    delete process.env.AZURE_OPENAI_API_KEY
  })

  test('returns standardized JSON shape with mock project and JD', async () => {
    jest.mock('openai', () => {
      return {
        AzureOpenAI: jest.fn(() => ({
          chat: {
            completions: {
              create: jest.fn(async () => ({
                choices: [
                  { message: { content: JSON.stringify({
                    qualityScore: 90,
                    clarity: 80,
                    impact: 85,
                    technicalDepth: 75,
                    relevance: 70,
                    strengths: ['clear objectives'],
                    improvements: ['add metrics'],
                    tags: ['node', 'ai']
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
    const { projectEvaluator } = require(path.join('..', 'ai', 'projectEvaluator'))
    const res = await projectEvaluator({ projectText: 'Mock project text', jobDescription: 'Mock JD text' })
    expect(typeof res.qualityScore).toBe('number')
    expect(Array.isArray(res.tags)).toBe(true)
  })
})
