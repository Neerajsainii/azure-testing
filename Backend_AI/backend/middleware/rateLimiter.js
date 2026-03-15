const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");

function buildLimitHandler(message, code = "RATE_LIMITED") {
  return (req, res) => {
    logger.warn("rate_limit_exceeded", {
      requestId: req.requestId || null,
      ip: req.ip,
      path: req.originalUrl || req.url,
      method: req.method,
      code,
    });
    res.status(429).json({
      success: false,
      code,
      message,
      requestId: req.requestId || null,
    });
  };
}

/**
 * Shared config for all limiters.
 *
 * keyGenerator: Azure Functions sits behind a reverse proxy and forwards the
 * client IP in x-forwarded-for. We always prefer that over req.ip to avoid
 * the ERR_ERL_KEY_GEN_IPV6 crash that occurs when req.ip is a raw IPv6
 * address (e.g. "::ffff:1.2.3.4").  Colons are replaced so the value is safe
 * for express-rate-limit's key validation.
 *
 * validate.trustProxy: set to false so express-rate-limit does NOT throw when
 * trust proxy is enabled but x-forwarded-for is absent on an internal call.
 */
const sharedLimiterConfig = {
  standardHeaders: true,   // Return RateLimit-* headers (RFC 6585)
  legacyHeaders: false,    // Disable X-RateLimit-* headers
  validate: {
    trustProxy: false,     // We handle proxy trust ourselves via keyGenerator
    xForwardedForHeader: false, // Suppress the x-forwarded-for validation warning
  },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    const raw = forwarded
      ? forwarded.split(",")[0].trim()
      : req.ip || req.socket?.remoteAddress || "unknown_ip";

    // Replace colons (IPv6 separators) so express-rate-limit doesn't throw
    // ERR_ERL_KEY_GEN_IPV6
    return raw.replace(/:/g, "_");
  },
};

// ---------------------------------------------------------------------------
// Global limiter — applied to all /api/* routes
// ---------------------------------------------------------------------------
const globalApiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitGlobalMax,           // ← "limit" replaces deprecated "max"
  ...sharedLimiterConfig,
  handler: buildLimitHandler(
    "Too many requests. Please slow down.",
    "GLOBAL_RATE_LIMITED"
  ),
});

// ---------------------------------------------------------------------------
// Student login — 5 attempts / 15 min
// ---------------------------------------------------------------------------
const studentLoginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitStudentLoginMax,
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler(
    "Too many login attempts. Try again later.",
    "LOGIN_RATE_LIMITED"
  ),
});

// ---------------------------------------------------------------------------
// Admin / HOD / Placement login — 3 attempts / 15 min
// ---------------------------------------------------------------------------
const adminLoginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitAdminLoginMax,
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler(
    "Too many login attempts. Try again later.",
    "LOGIN_RATE_LIMITED"
  ),
});

// ---------------------------------------------------------------------------
// Unified auth limiter — dynamic cap based on loginIntent in request body.
//
// NOTE: express-rate-limit v8 requires "limit" (not "max").
// Dynamic "limit" functions ARE supported in v7+/v8 — the function receives
// (req, res) and must return a number synchronously.
// ---------------------------------------------------------------------------
const authLoginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: (req) => {                         // ← "limit" not "max"
    const intent = String(req.body?.loginIntent || "").trim().toLowerCase();
    return intent === "student"
      ? env.rateLimitStudentLoginMax
      : env.rateLimitAdminLoginMax;
  },
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler(
    "Too many login attempts. Try again later.",
    "LOGIN_RATE_LIMITED"
  ),
});

// ---------------------------------------------------------------------------
// HOD invite limiter — 20 invites / 15 min
// ---------------------------------------------------------------------------
const inviteLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitInviteMax,
  ...sharedLimiterConfig,
  handler: buildLimitHandler(
    "Too many invites sent. Please try again later.",
    "INVITE_RATE_LIMITED"
  ),
});

// ---------------------------------------------------------------------------
// Signup limiter
// ---------------------------------------------------------------------------
const signupLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitSignupMax,
  ...sharedLimiterConfig,
  skipSuccessfulRequests: true,
  handler: buildLimitHandler(
    "Too many signup attempts. Try again later.",
    "SIGNUP_RATE_LIMITED"
  ),
});

// ---------------------------------------------------------------------------
// Department-create limiter (principal)
// ---------------------------------------------------------------------------
const principalDepartmentCreateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitDepartmentCreateMax,
  ...sharedLimiterConfig,
  handler: buildLimitHandler(
    "Too many department creation attempts. Try again later.",
    "DEPARTMENT_CREATE_RATE_LIMITED"
  ),
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