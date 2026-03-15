import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useBackendSession } from "@/contexts/BackendSessionContext"
import { resolveLoginPath } from "@/lib/loginFlow"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, token, isLoading } = useBackendSession()
  const location = useLocation()
  const loginPath = resolveLoginPath(location.pathname)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="sr-only">Loading</span>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to={loginPath} replace />
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="sr-only">Loading</span>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
      </div>
    )
  }

  const allowed =
    session.allowedBasePaths?.some(
      (base) => location.pathname === base || location.pathname.startsWith(`${base}/`)
    ) ?? false

  if (!allowed) {
    return <Navigate to={loginPath} replace />
  }

  return <>{children}</>
}
