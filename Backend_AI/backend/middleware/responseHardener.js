const { env } = require("../config/env")

module.exports = function responseHardener(req, res, next) {
  const originalJson = res.json.bind(res)

  res.json = (payload) => {
    if (res.statusCode >= 500 && payload && typeof payload === "object" && !Array.isArray(payload)) {
      const hadInternalErrorField = Object.prototype.hasOwnProperty.call(payload, "error")
      const safePayload = { ...payload }
      delete safePayload.error
      delete safePayload.stack
      if (env.isProduction || hadInternalErrorField) {
        safePayload.message = "Internal server error"
      }
      safePayload.requestId = req.requestId || safePayload.requestId || null
      safePayload.success = false
      return originalJson(safePayload)
    }

    return originalJson(payload)
  }

  next()
}
