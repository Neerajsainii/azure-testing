let tokenProvider: (() => Promise<string | null>) | null = null

export function setAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
  tokenProvider = provider
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenProvider) return null
  try {
    return await tokenProvider()
  } catch {
    return null
  }
}

