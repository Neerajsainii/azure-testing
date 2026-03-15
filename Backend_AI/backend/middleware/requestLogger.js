const { logger } = require("../utils/logger")
const crypto = require("crypto")

module.exports = function requestLogger(req, res, next) {
  const start = Date.now()
  const requestId = req.headers["x-request-id"] || crypto.randomUUID()

  req.requestId = requestId
  res.setHeader("x-request-id", requestId)

  res.on("finish", () => {
    const durationMs = Date.now() - start
    const level =
      res.statusCode >= 500 ? "error" :
      res.statusCode >= 400 ? "warn" :
      "info"

    // Log only the pathname — never the query string.
    // Query strings can contain invite tokens, OTP codes, or email addresses
    // that would otherwise appear permanently in Azure Monitor logs.
    const fullPath = req.originalUrl || req.url || ""
    const pathOnly = fullPath.split("?")[0]

    logger[level]("http_request", {
      requestId,
      method: req.method,
      path: pathOnly,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?._id?.toString?.() || null,
      role: req.user?.role || null,
    })
  })

  next()
}