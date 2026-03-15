const CSRF_TOKEN_KEY = "ston_csrf_token"

let csrfTokenMemory: string | null = null

export function setCsrfToken(token: string | null) {
  csrfTokenMemory = token
  try {
    if (token) {
      window.sessionStorage.setItem(CSRF_TOKEN_KEY, token)
    } else {
      window.sessionStorage.removeItem(CSRF_TOKEN_KEY)
    }
  } catch {
    // ignore storage failures
  }
}

export function getCsrfToken(): string | null {
  if (csrfTokenMemory) return csrfTokenMemory
  try {
    csrfTokenMemory = window.sessionStorage.getItem(CSRF_TOKEN_KEY)
    return csrfTokenMemory
  } catch {
    return null
  }
}

export function clearCsrfToken() {
  setCsrfToken(null)
}

