function safeParseJson(text) {
  try {
    return { ok: true, data: JSON.parse(text) }
  } catch (e) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const slice = text.slice(start, end + 1)
        return { ok: true, data: JSON.parse(slice) }
      } catch (e2) {
        return { ok: false, error: 'Invalid JSON', raw: text }
      }
    }
    return { ok: false, error: 'Invalid JSON', raw: text }
  }
}

function normalizeToSchema(data, schema) {
  if (!schema || typeof schema !== 'object') return data
  const out = {}
  for (const key of Object.keys(schema)) {
    const tmpl = schema[key]
    const val = data && data[key]
    if (Array.isArray(tmpl)) {
      const example = tmpl[0]
      const arr = Array.isArray(val) ? val : []
      out[key] = arr.map(item => {
        if (typeof example === 'object' && example !== null) {
          const obj = {}
          for (const k of Object.keys(example)) {
            obj[k] = item && item[k] !== undefined ? item[k] : example[k]
          }
          return obj
        }
        return item
      })
    } else if (typeof tmpl === 'object' && tmpl !== null) {
      const obj = {}
      for (const k of Object.keys(tmpl)) {
        obj[k] = val && val[k] !== undefined ? val[k] : tmpl[k]
      }
      out[key] = obj
    } else {
      out[key] = val !== undefined ? val : tmpl
    }
  }
  return out
}

function ensureJsonFromModelResponse(text, schema) {
  const parsed = safeParseJson(text)
  if (!parsed.ok) return normalizeToSchema({}, schema)
  const normalized = normalizeToSchema(parsed.data, schema)
  return normalized
}

async function withRetry(fn, { retries = 2, delayMs = 250 } = {}) {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (e) {
      if (attempt >= retries) throw e
      const wait = Math.max(0, delayMs * Math.pow(2, attempt))
      await new Promise(r => setTimeout(r, wait))
      attempt++
    }
  }
}

function truncateInput(input, { charLimit = 12000 } = {}) {
  const t = s => (typeof s === 'string' ? s.slice(0, charLimit) : s)
  const out = { ...input }
  if ('resumeText' in out) out.resumeText = t(out.resumeText)
  if ('jobDescription' in out) out.jobDescription = t(out.jobDescription)
  if ('projectText' in out) out.projectText = t(out.projectText)
  if (Array.isArray(out.jobs)) {
    out.jobs = out.jobs.map(j => ({ ...j, jobDescription: t(j.jobDescription) }))
  }
  return out
}

function sanitizeText(s) {
  if (typeof s !== 'string') return s
  return s.replace(/[\u0000-\u001F\u007F]/g, '').trim()
}

function sanitizeInput(input) {
  const out = { ...input }
  if ('resumeText' in out) out.resumeText = sanitizeText(out.resumeText)
  if ('jobDescription' in out) out.jobDescription = sanitizeText(out.jobDescription)
  if ('projectText' in out) out.projectText = sanitizeText(out.projectText)
  if (Array.isArray(out.jobs)) out.jobs = out.jobs.map(j => ({ ...j, jobDescription: sanitizeText(j.jobDescription), id: sanitizeText(j.id) }))
  return out
}

function prepareInput(input, opts) {
  return truncateInput(sanitizeInput(input), opts)
}

module.exports = {
  safeParseJson,
  normalizeToSchema,
  ensureJsonFromModelResponse,
  withRetry,
  truncateInput,
  sanitizeInput,
  prepareInput
}
