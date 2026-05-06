// Module: Stores and retrieves JWT access tokens for browser authentication.
const ACCESS_TOKEN_STORAGE_KEY = "cv-agent.access-token"

export type TokenPersistence = "local" | "session"

export function saveAccessToken(
  accessToken: string,
  persistence: TokenPersistence
): void {
  clearAccessToken()

  if (persistence === "local") {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
    return
  }

  sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
}

export function getStoredAccessToken(): string | null {
  return (
    localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ??
    sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  )
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}
