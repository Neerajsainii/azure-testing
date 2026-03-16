const rateLimit = require("express-rate-limit");
const { env } = require("../config/env")
const { logger } = require("../utils/logger")

function toEmailBucket(rawEmail) {
  return String(rawEmail || "").trim().toLowerCase()
}

function buildLimitHandler(message, code = "RATE_LIMITED") {
  return (req, res) => {
    logger.warn("rate_limit_exceeded", {
      requestId: req.requestId || null,
      ip: req.ip,
      path: req.originalUrl || req.url,
      method: req.method,
      code,
    })
    res.status(429).json({
      success: false,
      code,
      message,
      requestId: req.requestId || null,
    })
  }
}

const sharedLimiterConfig = {
  standardHeaders: true,
  legacyHeaders: false,
}

const globalApiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitGlobalMax,
  ...sharedLimiterConfig,
  handler: buildLimitHandler("Too many requests. Please slow down.", "GLOBAL_RATE_LIMITED"),
});

/**
 * Student login rate limiter
 * 5 attempts / 15 minutes
 */
const studentLoginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitStudentLoginMax,
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler("Too many login attempts. Try again later.", "LOGIN_RATE_LIMITED"),
});

/**
 * Admin / HOD / Placement login rate limiter
 * 3 attempts / 15 minutes
 */
const adminLoginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitAdminLoginMax,
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler("Too many login attempts. Try again later.", "LOGIN_RATE_LIMITED"),
});

const authLoginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: (req) => {
    const intent = String(req.body?.loginIntent || "").trim().toLowerCase()
    return intent === "student" ? env.rateLimitStudentLoginMax : env.rateLimitAdminLoginMax
  },
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler("Too many login attempts. Try again later.", "LOGIN_RATE_LIMITED"),
});

/**
 * HOD student invite rate limiter
 * 20 invites / 15 minutes
 */
const inviteLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitInviteMax,
  ...sharedLimiterConfig,
  handler: buildLimitHandler("Too many invites sent. Please try again later.", "INVITE_RATE_LIMITED"),
});

const signupLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitSignupMax,
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler("Too many signup attempts. Try again later.", "SIGNUP_RATE_LIMITED"),
});

const principalDepartmentCreateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitDepartmentCreateMax,
  ...sharedLimiterConfig,
  handler: buildLimitHandler("Too many department creation attempts. Try again later.", "DEPARTMENT_CREATE_RATE_LIMITED"),
});

module.exports = {
  globalApiLimiter,
  authLoginLimiter,
  studentLoginLimiter,
  adminLoginLimiter,
  inviteLimiter,
  signupLimiter,
  principalDepartmentCreateLimiter,
};
