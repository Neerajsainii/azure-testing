const { logger } = require("../utils/logger")
const crypto = require("crypto")

module.exports = function requestLogger(req, res, next) {
  const start = Date.now()
  const requestId = req.headers["x-request-id"] || crypto.randomUUID()

  req.requestId = requestId
  res.setHeader("x-request-id", requestId)

  res.on("finish", () => {
    const durationMs = Date.now() - start
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"
    logger[level]("http_request", {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userId: req.user?._id?.toString?.() || null,
      role: req.user?.role || null,
    })
  })

  next()
}
