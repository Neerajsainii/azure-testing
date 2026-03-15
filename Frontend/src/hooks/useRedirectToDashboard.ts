import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useBackendSession } from "@/contexts/BackendSessionContext"

export function useRedirectToDashboard() {
  const navigate = useNavigate()
  const { session, isLoading } = useBackendSession()

  useEffect(() => {
    if (isLoading) return
    if (session?.redirectTo) {
      navigate(session.redirectTo, { replace: true })
    }
  }, [session, isLoading, navigate])
}

