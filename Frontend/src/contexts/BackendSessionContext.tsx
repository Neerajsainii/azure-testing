import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import apiClient from "@/lib/api"
import { setAuthTokenProvider } from "@/lib/authToken"
import { clearCsrfToken, setCsrfToken } from "@/lib/csrfToken"

export type BackendRole =
  | "platform_admin"
  | "principal"
  | "placement_officer"
  | "hod"
  | "student"
  | "standalone_student"

export interface BackendSession {
  role: BackendRole
  collegeId: string | null
  departmentId: string | null
  isStandalone: boolean
  redirectTo: string
  allowedBasePaths: string[]
}

const AUTH_TOKEN_KEY = "ston_auth_token"

interface Ctx {
  session: BackendSession | null
  token: string | null
  isLoading: boolean
  setToken: (token: string | null) => void
  setSession: (session: BackendSession | null) => void
  refresh: () => Promise<BackendSession | null>
  clearSession: () => void
}

const BackendSessionContext = createContext<Ctx | undefined>(undefined)

export function BackendSessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
      return null
    }
  })
  const [session, setSessionState] = useState<BackendSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setToken = useCallback((t: string | null) => {
    setTokenState(t)
    if (t) {
      try {
        window.sessionStorage.setItem(AUTH_TOKEN_KEY, t)
      } catch {
        // ignore
      }
    } else {
      clearCsrfToken()
      try {
        window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  const clearSession = useCallback(() => {
    setTokenState(null)
    setSessionState(null)
    clearCsrfToken()
    setAuthTokenProvider(null)
    try {
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    setAuthTokenProvider(
      token
        ? () => Promise.resolve(token)
        : null
    )
    return () => setAuthTokenProvider(null)
  }, [token])

  const refresh = useCallback(async (): Promise<BackendSession | null> => {
    if (!token) {
      setSessionState(null)
      clearCsrfToken()
      return null
    }

    try {
      const res = await apiClient.get<{
        user: { id: string; name: string; email: string; role: string }
        csrfToken?: string | null
        redirectTo: string
        allowedBasePaths: string[]
      }>("/api/auth/session")
      const data = res.data

      // If the backend returns a 204 No Content, data will be empty/undefined.
      // Additionally, if the data structure gets corrupted, safety check `data.user`.
      if (!data || !data.user) {
        setToken(null)
        setSessionState(null)
        clearCsrfToken()
        return null
      }

      setCsrfToken(data.csrfToken || null)
      const s: BackendSession = {
        role: data.user.role as BackendRole,
        collegeId: null,
        departmentId: null,
        isStandalone: false,
        redirectTo: data.redirectTo ?? "/login",
        allowedBasePaths: Array.isArray(data.allowedBasePaths) ? data.allowedBasePaths : [],
      }
      setSessionState(s)
      return s
    } catch (err: unknown) {
      console.error("[BackendSession] Refresh failed:", err)
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) setToken(null)
      setSessionState(null)
      return null
    }
  }, [token, setToken])

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setSessionState(null)
      setIsLoading(false)
      return
    }

    refresh()
      .then(() => {
        if (!cancelled) setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, refresh])

  const setSession = useCallback((s: BackendSession | null) => {
    setSessionState(s)
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      session,
      token,
      isLoading,
      setToken,
      setSession,
      refresh,
      clearSession,
    }),
    [session, token, isLoading, setToken, setSession, refresh, clearSession]
  )

  return (
    <BackendSessionContext.Provider value={value}>
      {children}
    </BackendSessionContext.Provider>
  )
}

export function useBackendSession() {
  const ctx = useContext(BackendSessionContext)
  if (!ctx) throw new Error("useBackendSession must be used within BackendSessionProvider")
  return ctx
}
