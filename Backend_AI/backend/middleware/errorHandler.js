const { env } = require("../config/env")
const { logger } = require("../utils/logger")

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500
  const code = err.code || (statusCode >= 500 ? "SERVER_ERROR" : "REQUEST_ERROR")
  const message = statusCode >= 500 && env.isProduction ? "Internal server error" : (err.message || "Unexpected error")

  logger.error("request_failed", {
    requestId: req.requestId || null,
    statusCode,
    code,
    message: err.message,
    path: req.originalUrl || req.url,
    method: req.method,
    stack: env.isProduction ? undefined : err.stack,
  })

  res.status(statusCode).json({
    success: false,
    code,
    message,
    requestId: req.requestId || null,
    ...(err.details && !env.isProduction ? { details: err.details } : {}),
  })
}

module.exports = errorHandler
