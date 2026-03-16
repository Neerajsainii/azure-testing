const jwt = require("jsonwebtoken");
const { env } = require("../config/env")

const JWT_ERROR_NAMES = new Set(["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"])

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

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    const err = new Error("Token required");
    err.statusCode = 401;
    err.code = "JWT_REQUIRED";
    return next(err);
  }

  const parts = authHeader.split(" ");
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
    decoded = jwt.verify(token, env.jwtTempSecret, {
      algorithms: ["HS256"],
      issuer: env.jwtIssuer,
      audience: `${env.jwtAudience}:mfa`,
    });
  } catch (jwtError) {
    const normalized = normalizeJwtVerificationError(jwtError)
    if (normalized) return next(normalized)
    return next(jwtError)
  }

  if (decoded.purpose !== "mfa_setup") {
    const err = new Error("Invalid MFA token");
    err.statusCode = 403;
    err.code = "JWT_INVALID";
    return next(err);
  }

  req.user = decoded;
  return next();
};
