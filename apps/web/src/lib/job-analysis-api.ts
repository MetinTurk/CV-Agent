// Module: Provides typed HTTP helpers for the job analysis (URL → structured description) API.

export type JobDescription = {
  title: string | null
  company: string | null
  location: string | null
  employment_type: string | null
  summary: string | null
  responsibilities: string[]
  requirements: string[]
  skills: string[]
}

export type MatchAnalysis = {
  yeterli_yonler: string[]
  eksik_yonler: string[]
  genel_uyumluluk_puani: number
  tavsiyeler: string[]
}

export type ApplicationStatus = "pending" | "approved" | "rejected"

export type JobAnalysisResponse = {
  id: string
  url: string
  job_description: JobDescription
  match_analysis: MatchAnalysis | null
  application_status: ApplicationStatus
  created_at: string
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

export async function createJobAnalysis(
  token: string,
  url: string
): Promise<JobAnalysisResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/job-analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
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
      throw new Error("İş ilanı analiz edilemedi.")
    }

    throw new Error(getErrorMessage(errorPayload, "İş ilanı analiz edilemedi."))
  }

  return response.json() as Promise<JobAnalysisResponse>
}

export async function listJobAnalyses(
  token: string
): Promise<JobAnalysisResponse[]> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/job-analyses`, {
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
      throw new Error("Geçmiş başvurular alınamadı.")
    }

    throw new Error(
      getErrorMessage(errorPayload, "Geçmiş başvurular alınamadı.")
    )
  }

  return response.json() as Promise<JobAnalysisResponse[]>
}

export async function updateApplicationStatus(
  token: string,
  analysisId: string,
  applicationStatus: ApplicationStatus
): Promise<JobAnalysisResponse> {
  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}/job-analyses/${analysisId}/application-status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ application_status: applicationStatus }),
      }
    )
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
      throw new Error("Başvuru durumu güncellenemedi.")
    }

    throw new Error(
      getErrorMessage(errorPayload, "Başvuru durumu güncellenemedi.")
    )
  }

  return response.json() as Promise<JobAnalysisResponse>
}
