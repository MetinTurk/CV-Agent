// Module: Coordinates authentication state and renders the web application shell.
import { useEffect, useState, type JSX } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router"

import { AuthPage } from "@/components/auth/auth-page"
import { ProfileDashboardPage } from "@/components/profile-dashboard/profile-dashboard-page"
import { ExtensionInstallPrompt } from "@/components/extension-install/extension-install-prompt"
import { ProfilePage } from "@/components/profile/profile-page"
import { ProfileChatPage } from "@/components/profile-chat/profile-chat-page"
import {
  getCurrentUser,
  type AuthResponse,
  type AuthUser,
} from "@/lib/auth-api"
import { checkBrowserExtensionInstalled } from "@/lib/browser-extension"
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

type ExtensionStatus = "checking" | "installed" | "missing"

const CHROME_EXTENSION_STORE_URL = "https://chromewebstore.google.com/"
const AUTH_ROUTE = "/auth"
const PROFILE_CHAT_ROUTE = "/profile-chat"
const PROFILE_ROUTE = "/profile"

export function App(): JSX.Element {
  const navigate = useNavigate()
  const [initialToken] = useState<string | null>(() => getStoredAccessToken())
  const [authState, setAuthState] = useState<AuthState>(() =>
    initialToken === null ? { status: "guest" } : { status: "checking" }
  )
  const [extensionStatus, setExtensionStatus] =
    useState<ExtensionStatus>("checking")
  const [isExtensionPromptDismissed, setIsExtensionPromptDismissed] =
    useState(false)

  const authenticatedUserId =
    authState.status === "authenticated" ? authState.user.id : null

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

  useEffect(() => {
    let isActive = true

    if (authenticatedUserId === null) {
      return undefined
    }

    checkBrowserExtensionInstalled().then((isInstalled) => {
      if (isActive) {
        setExtensionStatus(isInstalled ? "installed" : "missing")
      }
    })

    return () => {
      isActive = false
    }
  }, [authenticatedUserId])

  const handleAuthenticated = (
    response: AuthResponse,
    persistence: TokenPersistence
  ): void => {
    saveAccessToken(response.access_token, persistence)
    setAccessToken(response.access_token)
    setExtensionStatus("checking")
    setIsExtensionPromptDismissed(false)
    setAuthState({ status: "authenticated", user: response.user })
  }

  const handleLogout = (): void => {
    clearAccessToken()
    setAccessToken(null)
    setExtensionStatus("checking")
    setIsExtensionPromptDismissed(false)
    setAuthState({ status: "guest" })
  }

  const handleInstallExtension = (): void => {
    window.open(CHROME_EXTENSION_STORE_URL, "_blank", "noopener,noreferrer")
  }

  const handleProfileCompleted = (redirectTo: string): void => {
    navigate(redirectTo, { replace: true })
  }

  const handleProfileChatRequested = (): void => {
    navigate(PROFILE_CHAT_ROUTE)
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
    return (
      <Routes>
        <Route
          path={AUTH_ROUTE}
          element={<AuthPage onAuthenticated={handleAuthenticated} />}
        />
        <Route path="/" element={<Navigate to={AUTH_ROUTE} replace />} />
        <Route path="*" element={<Navigate to={AUTH_ROUTE} replace />} />
      </Routes>
    )
  }

  const profileChatPage = (
    <>
      <ProfileChatPage
        token={accessToken ?? ""}
        user={authState.user}
        onLogout={handleLogout}
        onProfileCompleted={handleProfileCompleted}
      />
      {extensionStatus === "missing" && !isExtensionPromptDismissed ? (
        <ExtensionInstallPrompt
          onInstallClick={handleInstallExtension}
          onRemindLater={() => setIsExtensionPromptDismissed(true)}
        />
      ) : null}
    </>
  )

  return (
    <Routes>
      <Route path="/" element={<Navigate to={PROFILE_CHAT_ROUTE} replace />} />
      <Route
        path={AUTH_ROUTE}
        element={<Navigate to={PROFILE_CHAT_ROUTE} replace />}
      />
      <Route path={PROFILE_CHAT_ROUTE} element={profileChatPage} />
      <Route
        path={PROFILE_ROUTE}
        element={
          <ProfilePage
            token={accessToken ?? ""}
            user={authState.user}
            onLogout={handleLogout}
            onProfileChatRequested={handleProfileChatRequested}
          />
        }
      />
      <Route path="*" element={<Navigate to={PROFILE_CHAT_ROUTE} replace />} />
    </Routes>
  )
}
