const Joi = require("joi")

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "staging", "production").default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(5000),
  MONGO_URI: Joi.string().trim().required(),
  TRUST_PROXY: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(false),

  FRONTEND_URL: Joi.string().uri().required(),
  ADMIN_FRONTEND_URL: Joi.string().uri().optional().allow(""),
  CORS_ALLOWED_ORIGINS: Joi.string().optional().allow(""),

  // Single platform admin identity: only this email can log in at /main and invite Principal.
  PLATFORM_ADMIN_EMAIL: Joi.string().email().required(),

  AZURE_OPENAI_API_KEY: Joi.string().trim().optional().allow(""),
  AZURE_OPENAI_ENDPOINT: Joi.string().uri().optional().allow(""),
  AZURE_OPENAI_DEPLOYMENT: Joi.string().trim().optional().allow(""),
  AZURE_OPENAI_API_VERSION: Joi.string().trim().default("2024-02-15-preview"),
  AZURE_OPENAI_MODEL: Joi.string().trim().optional().allow(""),
  REQUIRE_AZURE_OPENAI: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(false),

  AI_HTTP_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(20000),
  AI_MAX_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  INVITE_EXPIRY_HOURS: Joi.number().integer().min(1).max(720).default(168),
  DEFAULT_COLLEGE_DEPARTMENT_LIMIT: Joi.number().integer().min(0).max(200).default(0),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_STUDENT_LOGIN_MAX: Joi.number().integer().min(1).default(5),
  RATE_LIMIT_ADMIN_LOGIN_MAX: Joi.number().integer().min(1).default(3),
  RATE_LIMIT_INVITE_MAX: Joi.number().integer().min(1).default(20),
  RATE_LIMIT_SIGNUP_MAX: Joi.number().integer().min(1).default(10),
  RATE_LIMIT_DEPARTMENT_CREATE_MAX: Joi.number().integer().min(1).default(20),
  RATE_LIMIT_GLOBAL_MAX: Joi.number().integer().min(1).default(300),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_TEMP_SECRET: Joi.string().min(32).optional().allow(""),
  JWT_EXPIRES_IN: Joi.string().trim().default("1h"),
  JWT_ISSUER: Joi.string().trim().default("ston-backend"),
  JWT_AUDIENCE: Joi.string().trim().default("ston-frontend"),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  LOGIN_MAX_FAILED_ATTEMPTS: Joi.number().integer().min(3).max(20).default(5),
  LOGIN_LOCK_MINUTES: Joi.number().integer().min(1).max(1440).default(15),

  CSRF_REQUIRED: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(false),

  OTP_HMAC_SECRET: Joi.string().min(32).optional().allow(""),
  EMAIL_VERIFICATION_REQUIRED: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(false),
  EMAIL_VERIFICATION_OTP_TTL_MINUTES: Joi.number().integer().min(3).max(60).default(10),
  EMAIL_USER: Joi.string().trim().optional().allow(""),
  EMAIL_PASS: Joi.string().trim().optional().allow(""),
  EMAIL_FROM: Joi.string().trim().optional().allow(""),

  HEALTH_CHECK_KEY: Joi.string().trim().optional().allow(""),

  LOG_LEVEL: Joi.string().valid("debug", "info", "warn", "error").default("info"),
  LOG_PRETTY: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(false),

  JSON_BODY_LIMIT: Joi.string().trim().default("8mb"),
}).unknown(true)

const { value, error } = schema.validate(process.env, { abortEarly: false, convert: true })

if (error) {
  const details = error.details.map((d) => d.message).join("; ")
  throw new Error(`Invalid environment configuration: ${details}`)
}

const hasAnyAzureValue = [value.AZURE_OPENAI_API_KEY, value.AZURE_OPENAI_ENDPOINT, value.AZURE_OPENAI_DEPLOYMENT]
  .some((v) => String(v || "").trim().length > 0)

if (value.REQUIRE_AZURE_OPENAI || hasAnyAzureValue) {
  const missing = []
  if (!value.AZURE_OPENAI_API_KEY) missing.push("AZURE_OPENAI_API_KEY")
  if (!value.AZURE_OPENAI_ENDPOINT) missing.push("AZURE_OPENAI_ENDPOINT")
  if (!value.AZURE_OPENAI_DEPLOYMENT) missing.push("AZURE_OPENAI_DEPLOYMENT")

  if (missing.length > 0) {
    throw new Error(`Invalid environment configuration: missing Azure OpenAI variables: ${missing.join(", ")}`)
  }
}

function parseOrigins(env) {
  const base = [env.FRONTEND_URL, env.ADMIN_FRONTEND_URL].filter(Boolean)
  const fromList = String(env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
  return [...new Set([...base, ...fromList])]
}

const env = Object.freeze({
  nodeEnv: value.NODE_ENV,
  isProduction: value.NODE_ENV === "production",
  port: value.PORT,
  mongoUri: value.MONGO_URI,
  trustProxy: value.TRUST_PROXY,

  frontendUrl: value.FRONTEND_URL,
  adminFrontendUrl: value.ADMIN_FRONTEND_URL || null,
  corsAllowedOrigins: parseOrigins(value),

  platformAdminEmail: value.PLATFORM_ADMIN_EMAIL.toLowerCase().trim(), // Configure in .env: PLATFORM_ADMIN_EMAIL

  azureOpenAiApiKey: value.AZURE_OPENAI_API_KEY || null,
  azureOpenAiEndpoint: value.AZURE_OPENAI_ENDPOINT || null,
  azureOpenAiDeployment: value.AZURE_OPENAI_DEPLOYMENT || null,
  azureOpenAiApiVersion: value.AZURE_OPENAI_API_VERSION,
  azureOpenAiModel: value.AZURE_OPENAI_MODEL || value.AZURE_OPENAI_DEPLOYMENT || null,
  requireAzureOpenAi: value.REQUIRE_AZURE_OPENAI,
  aiHttpTimeoutMs: value.AI_HTTP_TIMEOUT_MS,
  aiMaxRetries: value.AI_MAX_RETRIES,
  inviteExpiryHours: value.INVITE_EXPIRY_HOURS,
  defaultCollegeDepartmentLimit: value.DEFAULT_COLLEGE_DEPARTMENT_LIMIT > 0
    ? value.DEFAULT_COLLEGE_DEPARTMENT_LIMIT
    : null,

  rateLimitWindowMs: value.RATE_LIMIT_WINDOW_MS,
  rateLimitStudentLoginMax: value.RATE_LIMIT_STUDENT_LOGIN_MAX,
  rateLimitAdminLoginMax: value.RATE_LIMIT_ADMIN_LOGIN_MAX,
  rateLimitInviteMax: value.RATE_LIMIT_INVITE_MAX,
  rateLimitSignupMax: value.RATE_LIMIT_SIGNUP_MAX,
  rateLimitDepartmentCreateMax: value.RATE_LIMIT_DEPARTMENT_CREATE_MAX,
  rateLimitGlobalMax: value.RATE_LIMIT_GLOBAL_MAX,

  jwtSecret: value.JWT_SECRET,
  jwtTempSecret: value.JWT_TEMP_SECRET || value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  jwtIssuer: value.JWT_ISSUER,
  jwtAudience: value.JWT_AUDIENCE,
  bcryptRounds: value.BCRYPT_ROUNDS,
  loginMaxFailedAttempts: value.LOGIN_MAX_FAILED_ATTEMPTS,
  loginLockMinutes: value.LOGIN_LOCK_MINUTES,

  csrfRequired: value.CSRF_REQUIRED,

  otpHmacSecret: value.OTP_HMAC_SECRET || value.JWT_SECRET,
  emailVerificationRequired: value.EMAIL_VERIFICATION_REQUIRED,
  emailVerificationOtpTtlMinutes: value.EMAIL_VERIFICATION_OTP_TTL_MINUTES,
  emailUser: value.EMAIL_USER || null,
  emailPass: value.EMAIL_PASS || null,
  emailFrom: value.EMAIL_FROM || null,

  healthCheckKey: value.HEALTH_CHECK_KEY || null,

  logLevel: value.LOG_LEVEL,
  logPretty: value.LOG_PRETTY,
  jsonBodyLimit: value.JSON_BODY_LIMIT,
})

module.exports = { env }
