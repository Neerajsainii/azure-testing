import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useBackendSession } from "@/contexts/BackendSessionContext"
import { toSafeAuthErrorMessage } from "@/lib/authErrors"
import { Eye, EyeOff } from "lucide-react"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { session: backendSession } = useBackendSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && backendSession?.redirectTo) {
      navigate(backendSession.redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, backendSession])

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await login(normalizedEmail, password, {
        loginIntent: "student",
      })
      navigate(res.redirectTo, { replace: true })
    } catch (err: unknown) {
      const backendMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Invalid email or password"
      setError(toSafeAuthErrorMessage(backendMessage))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0424] via-[#1a0f4a] to-[#2b1d77] px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
          <h1 className="text-lg font-semibold">Student Login</h1>
          <p className="mt-1 text-sm text-white/70">Only imported students can sign in here.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 text-white outline-none focus:border-white/50"
                maxLength={254}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80" htmlFor="password">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 pr-10 text-white outline-none focus:border-white/50"
                  minLength={8}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white/20 py-2.5 font-medium text-white transition hover:bg-white/30 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-white/60">
            Not a student?{" "}
            <Link to="/administration" className="text-white/90 underline hover:no-underline">
              Administration
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

