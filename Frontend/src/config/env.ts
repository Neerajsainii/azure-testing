import { z } from "zod"

function normalizeUrl(u: string): string {
  return u.replace(/\/+$/, "")
}

const defaultApiUrl = ""
const EnvSchema = z.object({
  VITE_API_URL: z.preprocess(
    (val) => (typeof val === "string" ? val : defaultApiUrl),
    z.string().optional().default(defaultApiUrl)
  ),
  VITE_GOOGLE_AUTH_URL: z.string().min(1).optional(),
})

const parsed = EnvSchema.safeParse(import.meta.env)
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
  throw new Error(`Invalid frontend environment configuration: ${issues}`)
}

const env = parsed.data

export const APP_ENV = Object.freeze({
  apiBaseUrl: normalizeUrl(env.VITE_API_URL || defaultApiUrl),
  googleAuthUrl: env.VITE_GOOGLE_AUTH_URL || `${normalizeUrl(env.VITE_API_URL)}/api/auth/google`,
})