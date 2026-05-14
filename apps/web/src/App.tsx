// Module: Coordinates authentication state and renders the web application shell.
import { useEffect, useState, type JSX } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router"

import { ApplicationsPage } from "@/components/applications/applications-page"
import { AuthPage } from "@/components/auth/auth-page"
import { CvReviewPage } from "@/components/job-analysis/cv-review-page"
import { JobAnalysisPage } from "@/components/job-analysis/job-analysis-page"
import { ExtensionInstallPrompt } from "@/components/extension-install/extension-install-prompt"
import { ProfilePage } from "@/components/profile/profile-page"
import { ProfileChatPage } from "@/components/profile-chat/profile-chat-page"
import { Button } from "@workspace/ui/components/button"
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
import {
  getSavedProfile,
  SavedProfileNotFoundError,
  SavedProfileUnauthorizedError,
} from "@/lib/profile-api"

type AuthState =
  | { status: "checking" }
  | { status: "guest" }
  | { status: "authenticated"; user: AuthUser }

type ExtensionStatus = "checking" | "installed" | "missing"

type SavedProfileStatus =
  | { status: "checking" }
  | { status: "missing" }
  | { status: "available" }
  | { status: "error"; message: string }

const CHROME_EXTENSION_STORE_URL = "https://chromewebstore.google.com/"
const AUTH_ROUTE = "/auth"
const PROFILE_CHAT_ROUTE = "/profile-chat"
const PROFILE_ROUTE = "/profile"
const APPLICATIONS_ROUTE = "/applications"
const JOB_ANALYSIS_ROUTE = "/job-analysis"
const CV_REVIEW_ROUTE = "/job-analysis/review"

export function App(): JSX.Element {
  const navigate = useNavigate()
  const [initialToken] = useState<string | null>(() => getStoredAccessToken())
  const [accessToken, setAccessToken] = useState<string | null>(initialToken)
  const [authState, setAuthState] = useState<AuthState>(() =>
    initialToken === null ? { status: "guest" } : { status: "checking" }
  )
  const [extensionStatus, setExtensionStatus] =
    useState<ExtensionStatus>("checking")
  const [savedProfileStatus, setSavedProfileStatus] =
    useState<SavedProfileStatus>({ status: "checking" })
  const [isExtensionPromptDismissed, setIsExtensionPromptDismissed] =
    useState(false)
  const [profileCheckAttempt, setProfileCheckAttempt] = useState(0)

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

    if (authenticatedUserId === null || accessToken === null) {
      setSavedProfileStatus({ status: "checking" })
      return undefined
    }

    setSavedProfileStatus({ status: "checking" })

    getSavedProfile(accessToken)
      .then(() => {
        if (isActive) {
          setSavedProfileStatus({ status: "available" })
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        if (error instanceof SavedProfileNotFoundError) {
          setSavedProfileStatus({ status: "missing" })
          return
        }

        if (error instanceof SavedProfileUnauthorizedError) {
          clearAccessToken()
          setAccessToken(null)
          setAuthState({ status: "guest" })
          setSavedProfileStatus({ status: "checking" })
          return
        }

        setSavedProfileStatus({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Profil durumu kontrol edilemedi.",
        })
      })

    return () => {
      isActive = false
    }
  }, [authenticatedUserId, accessToken, profileCheckAttempt])

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
    setSavedProfileStatus({ status: "checking" })
    setIsExtensionPromptDismissed(false)
    setAuthState({ status: "authenticated", user: response.user })
  }

  const handleLogout = (): void => {
    clearAccessToken()
    setAccessToken(null)
    setExtensionStatus("checking")
    setSavedProfileStatus({ status: "checking" })
    setIsExtensionPromptDismissed(false)
    setAuthState({ status: "guest" })
  }

  const handleInstallExtension = (): void => {
    window.open(CHROME_EXTENSION_STORE_URL, "_blank", "noopener,noreferrer")
  }

  const handleProfileCompleted = (redirectTo: string): void => {
    setSavedProfileStatus({ status: "available" })
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

  if (savedProfileStatus.status === "checking") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
        <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Profil bilgileri kontrol ediliyor...
        </div>
      </main>
    )
  }

  if (savedProfileStatus.status === "error") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
        <div className="flex max-w-md flex-col gap-4 rounded-lg border border-border bg-card px-5 py-4 text-sm text-card-foreground">
          <div>
            <h1 className="font-semibold">Profil durumu kontrol edilemedi</h1>
            <p className="mt-1 text-muted-foreground">
              {savedProfileStatus.message}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setProfileCheckAttempt((attempt) => attempt + 1)}
            >
              Tekrar Dene
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              Çıkış Yap
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const authenticatedHomeRoute =
    savedProfileStatus.status === "available"
      ? PROFILE_ROUTE
      : PROFILE_CHAT_ROUTE

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
      <Route
        path="/"
        element={<Navigate to={authenticatedHomeRoute} replace />}
      />
      <Route
        path={AUTH_ROUTE}
        element={<Navigate to={authenticatedHomeRoute} replace />}
      />
      <Route path={PROFILE_CHAT_ROUTE} element={profileChatPage} />
      <Route
        path={APPLICATIONS_ROUTE}
        element={<ApplicationsPage token={accessToken ?? ""} />}
      />
      <Route path={JOB_ANALYSIS_ROUTE} element={<JobAnalysisPage />} />
      <Route path={CV_REVIEW_ROUTE} element={<CvReviewPage />} />
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
      <Route
        path="*"
        element={<Navigate to={authenticatedHomeRoute} replace />}
      />
    </Routes>
  )
}
