const path = require('path')

describe('input validation failures', () => {
  beforeEach(() => {
    jest.resetModules()
    delete process.env.AZURE_OPENAI_API_KEY
  })

  test('atsScore fails fast on missing fields', async () => {
    const { atsScore } = require(path.join('..', 'ai', 'atsScore'))
    const res = await atsScore({ resumeText: '', jobDescription: '' })
    expect(res.error).toBeDefined()
    expect(res.error.code).toBe('VALIDATION_ERROR')
  })

  test('jobMatch fails fast on missing fields', async () => {
    const { jobMatch } = require(path.join('..', 'ai', 'jobMatch'))
    const res = await jobMatch({ resumeText: '', jobDescription: '' })
    expect(res.error).toBeDefined()
    expect(res.error.code).toBe('VALIDATION_ERROR')
  })

  test('skillExtractor fails fast on missing resumeText', async () => {
    const { extractSkills } = require(path.join('..', 'ai', 'skillExtractor'))
    const res = await extractSkills({ resumeText: '' })
    expect(res.error).toBeDefined()
    expect(res.error.code).toBe('VALIDATION_ERROR')
  })
})
