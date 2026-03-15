function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]"
}

const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"])

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (isPlainObject(value)) {
    const out = {}
    for (const [key, nested] of Object.entries(value)) {
      if (
        BLOCKED_KEYS.has(key) ||
        key.startsWith("$") ||
        key.includes(".")
      ) {
        continue
      }
      out[key] = sanitizeValue(nested)
    }
    return out
  }

  if (typeof value === "string") {
    return value.replace(/\u0000/g, "")
  }

  return value
}

module.exports = function requestSanitizer(req, _res, next) {
  req.body = sanitizeValue(req.body)
  req.query = sanitizeValue(req.query)
  req.params = sanitizeValue(req.params)
  next()
}
