import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useBackendSession } from "@/contexts/BackendSessionContext"
import { authAPI } from "@/lib/api"
import { clearCsrfToken, setCsrfToken } from "@/lib/csrfToken"
import type { Session, User, UserRole } from "@/types/auth"

const USER_STORAGE_KEY = "ston_auth_user"

function mapBackendRoleToUserRole(role: string | undefined): UserRole {
  if (role === "platform_admin") return "ADMIN"
  if (role === "principal") return "PRINCIPAL"
  if (role === "hod") return "HOD"
  if (role === "placement_officer" || role === "placement") return "PLACEMENT"
  return "STUDENT"
}

export interface LoginResponse {
  user: { id: string; name: string; email: string; role: string }
  accessToken: string
  csrfToken?: string | null
  redirectTo: string
  allowedBasePaths: string[]
}

interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    email: string,
    password: string,
    options: { loginIntent: "student" | "administration" | "main"; selectedRole?: "principal" | "hod" | "placement_officer" }
  ) => Promise<LoginResponse>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setToken, setSession, clearSession, isLoading: backendLoading, token } = useBackendSession()
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = window.sessionStorage.getItem(USER_STORAGE_KEY)
      if (stored) return JSON.parse(stored) as User
    } catch {
      // ignore
    }
    return null
  })

  const session = useMemo<Session | null>(() => {
    if (!user) return null
    return { user, provider: "custom" }
  }, [user])

  useEffect(() => {
    if (token) return
    setUser(null)
    try {
      window.sessionStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [token])

  const login = useCallback(async (
    email: string,
    password: string,
    options: { loginIntent: "student" | "administration" | "main"; selectedRole?: "principal" | "hod" | "placement_officer" }
  ): Promise<LoginResponse> => {
    const res = await authAPI.loginWithIntent({
      email,
      password,
      loginIntent: options.loginIntent,
      selectedRole: options.selectedRole,
    })

    const data = res.data
    if (!data?.accessToken) {
      const backendMessage = data?.message || "Authentication failed"
      throw new Error(String(backendMessage))
    }

    setToken(data.accessToken)
    setCsrfToken(data.csrfToken || null)
    setSession({
      role: data.user.role as import("@/contexts/BackendSessionContext").BackendRole,
      collegeId: null,
      departmentId: null,
      isStandalone: false,
      redirectTo: data.redirectTo,
      allowedBasePaths: data.allowedBasePaths ?? [],
    })

    const nextUser: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: mapBackendRoleToUserRole(data.user.role),
    }
    setUser(nextUser)
    try {
      window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    } catch {
      // ignore
    }

    return data
  }, [setToken, setSession])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      // ignore
    }
    clearSession()
    clearCsrfToken()
    setUser(null)
    try {
      window.sessionStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [clearSession])

  const updateProfile = useCallback(async (_data: Partial<User>) => {}, [])

  const changePassword = useCallback(async (_oldPassword: string, _newPassword: string) => {
    throw new Error("Password change flow is not implemented yet.")
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user,
      isLoading: backendLoading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      updateProfile,
      changePassword,
    }),
    [session, user, backendLoading, token, login, logout, updateProfile, changePassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
