const {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_API_VERSION
} = require('../config')
const { AzureOpenAI } = require('openai')
const { withRetry, ensureJsonFromModelResponse } = require('./responseParser')

function normalizeAzureEndpoint(endpoint) {
  return String(endpoint || '')
    .trim()
    .replace(/\/openai\/v1\/?$/i, '')
    .replace(/\/openai\/?$/i, '')
    .replace(/\/$/, '')
}

function getAzureOpenAIClient() {
  if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT) {
    throw new Error('Missing Azure OpenAI configuration. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT.')
  }
  return new AzureOpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    endpoint: normalizeAzureEndpoint(AZURE_OPENAI_ENDPOINT),
    deployment: AZURE_OPENAI_DEPLOYMENT,
    apiVersion: AZURE_OPENAI_API_VERSION
  })
}

async function callChatJson({
  instructions,
  schema,
  input,
  model = AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
  fallbackModel = null
}) {
  const client = getAzureOpenAIClient()
  async function exec(m) {
    const completion = await client.chat.completions.create({
      model: m,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: JSON.stringify({ schema, input }) }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
    const content = completion.choices[0].message.content
    const normalized = ensureJsonFromModelResponse(content, schema)
    const usage = completion.usage || {}
    const meta = {
      model: m,
      promptVersion: 1,
      timestamp: Date.now(),
      tokensUsed: usage.total_tokens || 0,
      requestId: completion.id || ''
    }
    return { normalized, meta }
  }
  try {
    return await withRetry(() => exec(model))
  } catch (e) {
    if (!fallbackModel || fallbackModel === model) throw e
    return withRetry(() => exec(fallbackModel))
  }
}

module.exports = { getAzureOpenAIClient, callChatJson }
