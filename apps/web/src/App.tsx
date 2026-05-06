// Module: Coordinates authentication state and renders the web application shell.
import { useEffect, useState, type JSX } from "react"

import { AuthPage } from "@/components/auth/auth-page"
import { ProfileDashboardPage } from "@/components/profile-dashboard/profile-dashboard-page"
import {
  getCurrentUser,
  type AuthResponse,
  type AuthUser,
} from "@/lib/auth-api"
import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
  type TokenPersistence,
} from "@/lib/auth-token"

type AuthState =
  | { status: "checking" }
  | { status: "guest" }
  | { status: "authenticated"; user: AuthUser }

export function App(): JSX.Element {
  const [initialToken] = useState<string | null>(() => getStoredAccessToken())
  const [authState, setAuthState] = useState<AuthState>(() =>
    initialToken === null ? { status: "guest" } : { status: "checking" }
  )

  useEffect(() => {
    let isActive = true

    if (initialToken === null) {
      return undefined
    }

    getCurrentUser(initialToken)
      .then((user) => {
        if (isActive) {
          setAuthState({ status: "authenticated", user })
        }
      })
      .catch(() => {
        clearAccessToken()
        if (isActive) {
          setAuthState({ status: "guest" })
        }
      })

    return () => {
      isActive = false
    }
  }, [initialToken])

  const handleAuthenticated = (
    response: AuthResponse,
    persistence: TokenPersistence
  ): void => {
    saveAccessToken(response.access_token, persistence)
    setAuthState({ status: "authenticated", user: response.user })
  }

  const handleLogout = (): void => {
    clearAccessToken()
    setAuthState({ status: "guest" })
  }

  if (authState.status === "checking") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
        <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Oturum kontrol ediliyor...
        </div>
      </main>
    )
  }

  if (authState.status === "guest") {
    return <AuthPage onAuthenticated={handleAuthenticated} />
  }

  return <ProfileDashboardPage user={authState.user} onLogout={handleLogout} />
}
