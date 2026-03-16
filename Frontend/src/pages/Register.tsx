import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { authAPI } from "@/lib/api"
import { Eye, EyeOff } from "lucide-react"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [collegeName, setCollegeName] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [batch, setBatch] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get("token")
  const inviteEmail = searchParams.get("email")
  const isActivation = !!inviteToken

  useEffect(() => {
    if (isActivation && inviteEmail) {
      setEmail(inviteEmail)
    }
  }, [isActivation, inviteEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setMessage({ type: "error", text: "Enter a valid email address." })
      return
    }
    if (!PASSWORD_REGEX.test(password)) {
      setMessage({
        type: "error",
        text: "Password must be 8-128 chars and include upper, lower, number, and symbol.",
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." })
      return
    }

    setLoading(true)
    try {
      if (isActivation) {
        await authAPI.activateInvite({
          email: normalizedEmail,
          newPassword: password,
          token: inviteToken,
        })
        setMessage({ type: "success", text: "Account activated successfully. You can now sign in." })
      } else {
        await authAPI.register({
          name: name.trim(),
          email: normalizedEmail,
          password,
          role: "student",
          collegeName: collegeName.trim() || undefined,
          department: department.trim() || undefined,
          year: year ? Number(year) : undefined,
          batch: batch.trim() || undefined,
        })
        setMessage({ type: "success", text: "Signup successful. You can now sign in." })
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (isActivation ? "Activation failed" : "Signup failed")
      setMessage({ type: "error", text: String(msg) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0424] via-[#1a0f4a] to-[#2b1d77] px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
          <h1 className="text-lg font-semibold">{isActivation ? "Activate Account" : "Student Sign up"}</h1>
          <p className="mt-1 text-sm text-white/70">
            {isActivation
              ? "Verify your details and set a password to activate your account."
              : "Create an account. Only imported students can sign in at the student login."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isActivation && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80" htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 text-white outline-none focus:border-white/50"
                    maxLength={120}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80" htmlFor="collegeName">College Name</label>
                  <input
                    id="collegeName"
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 text-white outline-none focus:border-white/50"
                    maxLength={160}
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-white/80" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 text-white outline-none focus:border-white/50 ${isActivation ? 'opacity-70 cursor-not-allowed' : ''}`}
                maxLength={254}
                required
                readOnly={isActivation}
              />
            </div>
            {!isActivation && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80" htmlFor="department">Department</label>
                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 text-white outline-none focus:border-white/50"
                    maxLength={64}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80" htmlFor="year">Year</label>
                  <input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 text-white outline-none focus:border-white/50"
                    min={1}
                    max={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80" htmlFor="batch">Batch</label>
                  <input
                    id="batch"
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 text-white outline-none focus:border-white/50"
                    maxLength={32}
                    placeholder="e.g., 2022-2026"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white/80" htmlFor="password">Password</label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
            <div>
              <label className="block text-sm font-medium text-white/80" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative mt-2">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-[#130a3a] px-3 py-2 pr-10 text-white outline-none focus:border-white/50"
                  minLength={8}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {message && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${message.type === "success"
                    ? "border border-green-500/30 bg-green-500/10 text-green-200"
                    : "border border-red-500/30 bg-red-500/10 text-red-200"
                  }`}
              >
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white/20 py-2.5 font-medium text-white transition hover:bg-white/30 disabled:opacity-60"
            >
              {loading ? (isActivation ? "Activating..." : "Signing up...") : (isActivation ? "Activate" : "Sign up")}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-white/60">
            Already have an account? <Link to="/login" className="text-white/90 underline hover:no-underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
