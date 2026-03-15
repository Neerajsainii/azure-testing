const { env } = require("../config/env")

const LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
})

const configuredLevel = LEVELS[env.logLevel] || LEVELS.info

function redact(value) {
  if (!value || typeof value !== "object") return value

  if (Array.isArray(value)) return value.map(redact)

  const out = {}
  for (const [key, val] of Object.entries(value)) {
    if (/token|secret|password|api[-_]?key|authorization|cookie/i.test(key)) {
      out[key] = "[REDACTED]"
    } else {
      out[key] = redact(val)
    }
  }
  return out
}

function write(level, message, meta = {}) {
  if ((LEVELS[level] || LEVELS.info) < configuredLevel) return
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...redact(meta),
  }

  if (env.logPretty) {
    console.log(`[${payload.ts}] ${level.toUpperCase()} ${message}`, JSON.stringify(redact(meta)))
    return
  }
  console.log(JSON.stringify(payload))
}

const logger = Object.freeze({
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
})

module.exports = { logger }
