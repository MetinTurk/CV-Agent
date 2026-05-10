// Module: Provides typed HTTP helpers for saved profile API access.
import type { ProfileData } from "@/lib/profile-chat-api"

export type SavedProfileResponse = {
  profile: ProfileData
  updated_at: string
}

export type AddProfileProjectPayload = {
  url: string
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

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isApiErrorPayload(payload)) {
    return fallback
  }

  if (typeof payload.detail === "string") {
    return payload.detail
  }

  return fallback
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

    throw new Error(getErrorMessage(errorPayload, "Profil güncellenemedi."))
  }

  return response.json() as Promise<SavedProfileResponse>
}

export async function addProfileProject(
  token: string,
  payload: AddProfileProjectPayload
): Promise<SavedProfileResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/profile/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
      throw new Error("Proje eklenemedi.")
    }

    throw new Error(getErrorMessage(errorPayload, "Proje eklenemedi."))
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

    throw new Error(getErrorMessage(errorPayload, "Profil bilgisi alınamadı."))
  }

  return response.json() as Promise<SavedProfileResponse>
}
