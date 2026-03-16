const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Admin = require("../models/Admin");
const RevokedToken = require("../models/RevokedToken")
const { env } = require("../config/env")
const { ROLES } = require("../constants/roles")
const { logger } = require("../utils/logger")
const { LruTtlCache } = require("../utils/cache")

const JWT_ERROR_NAMES = new Set(["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"])
const revokedTokenCache = new LruTtlCache({ maxSize: 2000, ttlMs: 5 * 60 * 1000 })

function isSafeMethod(method) {
  const normalized = String(method || "").toUpperCase()
  return normalized === "GET" || normalized === "HEAD" || normalized === "OPTIONS"
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""))
  const right = Buffer.from(String(b || ""))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function normalizeRole(role, email) {
  const value = String(role || "")
  const normalizedEmail = String(email || "").trim().toLowerCase()
  if (normalizedEmail === env.platformAdminEmail) return ROLES.PLATFORM_ADMIN
  if (value === ROLES.PLACEMENT) return ROLES.PLACEMENT_OFFICER
  if (value === ROLES.STANDALONE_STUDENT) return ROLES.STUDENT
  return value || ROLES.STUDENT
}

function normalizeJwtVerificationError(error) {
  if (!JWT_ERROR_NAMES.has(error?.name)) return null

  const normalized = new Error(
    error.name === "TokenExpiredError"
      ? "Authentication token has expired"
      : "Invalid authentication token"
  )
  normalized.statusCode = 401
  normalized.code = error.name === "TokenExpiredError" ? "JWT_EXPIRED" : "JWT_INVALID"
  return normalized
}

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      const err = new Error("Authorization header missing");
      err.statusCode = 401;
      err.code = "JWT_REQUIRED";
      return next(err);
    }

    const parts = header.split(" ");
    const scheme = parts[0];
    const token = parts[1];
    if (parts.length !== 2 || scheme !== "Bearer" || !token) {
      const err = new Error("Authorization header must be in format 'Bearer <token>'");
      err.statusCode = 401;
      err.code = "JWT_MALFORMED";
      return next(err);
    }

    let decoded
    try {
      decoded = jwt.verify(token, env.jwtSecret, {
        algorithms: ["HS256"],
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      });
    } catch (jwtError) {
      const normalized = normalizeJwtVerificationError(jwtError)
      if (normalized) return next(normalized)
      throw jwtError
    }

    if (env.csrfRequired && !isSafeMethod(req.method)) {
      const csrfHeader = req.headers["x-csrf-token"]
      if (!decoded.csrfToken || !csrfHeader || !safeEqual(decoded.csrfToken, csrfHeader)) {
        const err = new Error("Invalid CSRF token")
        err.statusCode = 403
        err.code = "CSRF_INVALID"
        return next(err)
      }
    }

    if (decoded.jti) {
      const jti = String(decoded.jti)
      if (revokedTokenCache.has(jti)) {
        const err = new Error("Authentication token has been revoked")
        err.statusCode = 401
        err.code = "JWT_REVOKED"
        return next(err)
      }
      const revoked = await RevokedToken.findOne({ jti }).select({ _id: 1 }).lean()
      if (revoked) {
        revokedTokenCache.set(jti, true)
        const err = new Error("Authentication token has been revoked")
        err.statusCode = 401
        err.code = "JWT_REVOKED"
        return next(err)
      }
    }

    let account = await User.findById(decoded.id);
    if (!account) account = await Admin.findById(decoded.id);
    if (!account) {
      const err = new Error("Account not found");
      err.statusCode = 401;
      err.code = "USER_NOT_FOUND";
      return next(err);
    }

    if (account.status === "suspended") {
      const err = new Error("Account is suspended")
      err.statusCode = 403
      err.code = "ACCOUNT_SUSPENDED"
      return next(err)
    }

    req.user = account;
    req.auth = decoded;
    req.user.role = normalizeRole(account.role, account.email)
    return next();
  } catch (error) {
    const normalizedJwtError = normalizeJwtVerificationError(error)
    if (normalizedJwtError) {
      return next(normalizedJwtError)
    }

    logger.warn("auth_middleware_failed", {
      requestId: req.requestId || null,
      path: req.originalUrl || req.url,
      code: error.code || "AUTH_MIDDLEWARE_ERROR",
      message: error.message,
    })
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "AUTH_MIDDLEWARE_ERROR";
    return next(error);
  }
};

/* =========================
   LEGACY AUTH (DISABLED)
   =========================

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    const err = new Error("Authorization header missing");
    err.statusCode = 401;
    err.code = "JWT_REQUIRED";
    return next(err);
  }

  const parts = header.split(" ");
  const scheme = parts[0];
  const token = parts[1];
  if (parts.length !== 2 || scheme !== "Bearer" || !token) {
    const err = new Error("Authorization header must be in format 'Bearer <token>'");
    err.statusCode = 401;
    err.code = "JWT_MALFORMED";
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "ston.backend",
      audience: "ston.frontend",
      clockTolerance: 5,
    });
    let account = await User.findById(decoded.id);
    if (!account) account = await Admin.findById(decoded.id);
    if (!account) {
      const err = new Error("Account not found");
      err.statusCode = 401;
      err.code = "USER_NOT_FOUND";
      return next(err);
    }
    req.user = account;
    next();
  } catch (error) {
    error.statusCode = 401;
    error.code = "JWT_INVALID";
    return next(error);
  }
};

*/
