// Module: Provides typed HTTP helpers for the tailored CV generation API.
import type { JobDescription } from "./job-analysis-api"

export type TailoredCvExperience = {
  role: string
  company: string
  period: string
  bullets: string[]
}

export type TailoredCvEducation = {
  institution: string
  degree: string
  period: string
}

export type TailoredCvProject = {
  name: string
  description: string
}

export type TailoredCv = {
  full_name: string
  title: string
  location: string | null
  summary: string
  skills: string[]
  experiences: TailoredCvExperience[]
  educations: TailoredCvEducation[]
  projects: TailoredCvProject[]
  certifications: string[]
  languages: string[]
}

export type CvGenerationResponse = {
  tailored_cv: TailoredCv
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

export async function generateTailoredCv(
  token: string,
  jobDescription: JobDescription
): Promise<CvGenerationResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/cv-generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ job_description: jobDescription }),
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
      throw new Error("CV oluşturulamadı.")
    }

    throw new Error(getErrorMessage(errorPayload, "CV oluşturulamadı."))
  }

  return response.json() as Promise<CvGenerationResponse>
}
