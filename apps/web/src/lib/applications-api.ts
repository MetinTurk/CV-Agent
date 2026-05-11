// Module: Provides typed HTTP helpers for application history and status tracking.
import type { JobAnalysisResponse } from "@/lib/job-analysis-api"

export type ApplicationStatus = "pending" | "approved" | "rejected"

export type ApplicationSummary = JobAnalysisResponse & {
  application_status: ApplicationStatus
}

export type ApplicationsListResponse = {
  applications: ApplicationSummary[]
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

export async function getApplications(
  token: string
): Promise<ApplicationsListResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/applications`, {
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
      throw new Error("Başvuru geçmişi alınamadı.")
    }

    throw new Error(getErrorMessage(errorPayload, "Başvuru geçmişi alınamadı."))
  }

  return response.json() as Promise<ApplicationsListResponse>
}

export async function updateApplicationStatus(
  token: string,
  applicationId: string,
  status: ApplicationStatus
): Promise<ApplicationSummary> {
  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
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

  const body = (await response.json()) as { application: ApplicationSummary }
  return body.application
}
