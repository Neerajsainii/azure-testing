const { AZURE_OPENAI_DEPLOYMENT } = require('../ai/config')
const { getAzureOpenAIClient } = require('../ai/utils/aiClient')
async function main() {
  try {
    const client = getAzureOpenAIClient()
    const completion = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a concise assistant.' },
        { role: 'user', content: 'Say ok.' }
      ]
    })
    console.log('OK', completion.choices[0].message.content)
  } catch (e) {
    const status = e && e.status ? e.status : 0
    const msg = e && e.message ? e.message : String(e)
    console.log('ERR', status, msg)
    if (e && e.response) {
      try { console.log('BODY', await e.response.text()) } catch {}
    }
    process.exit(1)
  }
}
main()
