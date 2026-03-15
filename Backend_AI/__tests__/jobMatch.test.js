const path = require('path')

describe('jobMatch', () => {
  beforeEach(() => {
    jest.resetModules()
    delete process.env.AZURE_OPENAI_API_KEY
  })

  test('single job match returns standardized JSON with mock resume and JD', async () => {
    jest.mock('openai', () => {
      return {
        AzureOpenAI: jest.fn(() => ({
          chat: {
            completions: {
              create: jest.fn(async () => ({
                choices: [
                  { message: { content: JSON.stringify({ matchScore: 88, fitSummary: 'good', topReasons: ['skills'], riskFactors: [], keywords: { present: ['js'], missing: [] } }) } }
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
    const res = await jobMatch({ resumeText: 'Mock resume text', jobDescription: 'Mock JD text' })
    expect(typeof res.matchScore).toBe('number')
    expect(res.keywords).toBeDefined()
  })

  test('batch job match returns standardized JSON with results array', async () => {
    jest.mock('openai', () => {
      return {
        AzureOpenAI: jest.fn(() => ({
          chat: {
            completions: {
              create: jest.fn(async () => ({
                choices: [
                  { message: { content: JSON.stringify({
                    results: [
                      { jobId: 'A', matchScore: 70, fitSummary: 'ok', topReasons: ['skill fit'], riskFactors: [], keywords: { present: ['js'], missing: ['aws'] } },
                      { jobId: 'B', matchScore: 85, fitSummary: 'strong', topReasons: ['exp'], riskFactors: [], keywords: { present: ['react'], missing: [] } }
                    ]
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
    const { jobMatchBatch } = require(path.join('..', 'ai', 'jobMatch'))
    const res = await jobMatchBatch({ resumeText: 'Mock resume text', jobs: [{ id: 'A', jobDescription: '...' }, { id: 'B', jobDescription: '...' }] })
    expect(Array.isArray(res.results)).toBe(true)
    expect(res.results.length).toBe(2)
    expect(res.results[0].jobId).toBe('A')
  })
})
