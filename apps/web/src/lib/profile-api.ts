// Module: Provides typed HTTP helpers for saved profile API access.
import type { ProfileData } from "@/lib/profile-chat-api"

export type SavedProfileResponse = {
  profile: ProfileData
  updated_at: string
}

export class SavedProfileNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SavedProfileNotFoundError"
  }
}

export class SavedProfileUnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SavedProfileUnauthorizedError"
  }
}

type ApiErrorPayload = {
  detail?: unknown
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  ""
)

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null && "detail" in value
}

function getErrorMessage(payload: unknown): string {
  if (!isApiErrorPayload(payload)) {
    return "Profil bilgisi alınamadı."
  }

  if (typeof payload.detail === "string") {
    return payload.detail
  }

  return "Profil bilgisi alınamadı."
}

export async function updateProfile(
  token: string,
  profileData: ProfileData
): Promise<SavedProfileResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })
  } catch {
    throw new Error(
      "API sunucusuna ulaşılamadı. Lütfen server'ın çalıştığını ve API adresinin doğru olduğunu kontrol edin."
    )
  }

  if (!response.ok) {
    let errorPayload: unknown = null

    try {
      errorPayload = await response.json()
    } catch {
      throw new Error("Profil güncellenemedi.")
    }

    const message = getErrorMessage(errorPayload)

    if (response.status === 404) {
      throw new SavedProfileNotFoundError(message)
    }

    if (response.status === 401) {
      throw new SavedProfileUnauthorizedError(message)
    }

    throw new Error(message)
  }

  return response.json() as Promise<SavedProfileResponse>
}

export async function getSavedProfile(
  token: string
): Promise<SavedProfileResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error(
      "API sunucusuna ulaşılamadı. Lütfen server'ın çalıştığını ve API adresinin doğru olduğunu kontrol edin."
    )
  }

  if (!response.ok) {
    let errorPayload: unknown = null

    try {
      errorPayload = await response.json()
    } catch {
      throw new Error("Profil bilgisi alınamadı.")
    }

    const message = getErrorMessage(errorPayload)

    if (response.status === 404) {
      throw new SavedProfileNotFoundError(message)
    }

    if (response.status === 401) {
      throw new SavedProfileUnauthorizedError(message)
    }

    throw new Error(message)
  }

  return response.json() as Promise<SavedProfileResponse>
}
