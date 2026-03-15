const SAFE_AUTH_MESSAGES = [
  "Invalid email or password",
  "Too many login attempts",
  "Account temporarily locked",
  "TOTP required",
  "MFA setup required",
  "Please verify your email",
  "Only imported students can sign in here",
  "Unauthorized access to platform admin",
  "Account is suspended",
]

export function toSafeAuthErrorMessage(rawMessage: unknown, fallback = "Invalid email or password"): string {
  const message = String(rawMessage || "").trim()
  if (!message) return fallback
  const safe = SAFE_AUTH_MESSAGES.find((value) => message.includes(value))
  return safe ? message : fallback
}
