// Module: Provides typed HTTP helpers for the profile collection chat API.
export type ProfileData = {
  full_name: string | null
  location: string | null
  skills: string[]
  projects: string[]
  certifications: string[]
  languages: string[]
  work_experiences: string[]
  education: string | null
  additional_information: string | null
}

export type ProfileChatResponse = {
  reply: string
  session_id: string
  profile: ProfileData
  missing_required_fields: string[]
  is_profile_ready: boolean
}

type ProfileChatPayload = {
  message: string
  session_id: string
  source?: {
    type: "url"
    value: string
  }
}

type ProfileChatDocumentPayload = {
  message: string
  session_id: string
  document: File
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
    return "Profil asistanı isteği tamamlanamadı."
  }

  if (typeof payload.detail === "string") {
    return payload.detail
  }

  return "Profil asistanı isteği tamamlanamadı."
}

export async function sendProfileChatMessage(
  token: string,
  payload: ProfileChatPayload
): Promise<ProfileChatResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/profile-chat/message`, {
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
      throw new Error("Profil asistanı isteği tamamlanamadı.")
    }

    throw new Error(getErrorMessage(errorPayload))
  }

  return response.json() as Promise<ProfileChatResponse>
}

export async function sendProfileChatDocument(
  token: string,
  payload: ProfileChatDocumentPayload
): Promise<ProfileChatResponse> {
  const formData = new FormData()
  formData.set("message", payload.message)
  formData.set("session_id", payload.session_id)
  formData.set("document", payload.document)

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/profile-chat/document`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
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
      throw new Error("Profil asistanı isteği tamamlanamadı.")
    }

    throw new Error(getErrorMessage(errorPayload))
  }

  return response.json() as Promise<ProfileChatResponse>
}
