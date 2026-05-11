// Module: Provides typed HTTP helpers for the ATS report generation API.
import type { TailoredCv } from "./cv-generation-api"
import type { JobDescription } from "./job-analysis-api"

export type AtsMatchLevel = "zayif" | "orta" | "orta-guclu" | "guclu"

export type AtsReport = {
  similarity_score: number
  match_level: AtsMatchLevel
  strong_matches: string[]
  warnings: string[]
  recommendations: string[]
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

export async function generateAtsReport(
  token: string,
  jobDescription: JobDescription,
  tailoredCv: TailoredCv
): Promise<AtsReport> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/ats-reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        job_description: jobDescription,
        tailored_cv: tailoredCv,
      }),
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
      throw new Error("ATS raporu oluşturulamadı.")
    }

    throw new Error(getErrorMessage(errorPayload, "ATS raporu oluşturulamadı."))
  }

  return response.json() as Promise<AtsReport>
}
